# Design: refactor-grid-rendering

## Context

`src/App.vue` は 1149 行に肥大化しており、以下の責務が混在している:

- ゲームループ制御（start / pause / resume / stop / reset）
- シナリオ定義（4 つのデバッグシナリオ）
- 状態管理（gameState, events, isRunning, isPaused, isPlacingDemonLord 等）
- グリッド描画（DOM 構造 + CSS + 表示ロジック + 凡例）
- ユーザー操作ハンドリング（魔王配置モード、dig、勇者呼び出し）

このうち **グリッド描画** の部分は Issue #47（ステージサイズ拡大）を段階的に進めるための前提であり、以下の 3 つの問題を抱えている:

1. グリッドサイズが 3 箇所でハードコードされている (`App.vue:23` の 10×8、シナリオ 4 本の 12×10、`constants.ts` の 20×15)
2. `GameConfig.grid.defaultWidth/Height` が型・spec で定義済みにもかかわらず、実装が完全に無視している
3. `getCellClass`, `getCellDisplay` 等の UI ロジックがテスト完全未整備

本 change ではグリッド描画を `GridView.vue` コンポーネントに抽出し、SSoT 化を行う。デフォルト表示サイズは `GameConfig.grid` に従い 20×15 となる（`constants.ts` 初期コミットからの設計意図）。

## Goals

1. `App.vue` からグリッド描画関連コード（推定 300〜400 行）を `GridView.vue` に移動する
2. グリッドサイズの値を SSoT（`GameConfig.grid`）に統一し、3 箇所のハードコードを解消する
3. `GridView` の振る舞いを Vue Test Utils による単体テストでカバーする
4. 既存の E2E 3 本を壊さず、リファクタのデグレを検出可能にする
5. M2 / M3 が「可変サイズ対応済みのコンポーネント」を前提にして実装できる基盤を提供する

## Non-Goals

- ステージサイズをゆうなま相当（30×40 等）に拡大すること（M2 のスコープ）
- カメラ / スクロール / ズーム対応（M2 のスコープ）
- 縦長ステージ特有の仕様（深さ・層・養分分布変化）（M3 のスコープ）
- 内側壁による擬似小ステージ方式（Issue #50 で追跡、M3 タイミング）
- `src/cli/scenarios.ts` の SSoT 化（Issue #49 で追跡、別 change）
- ゲームロジック（魔王配置、dig、tick 制御）のリファクタ
- `App.vue` の style セクションの整理

## Component Boundary

```
GridView.vue
├── Props
│   ├── gameState: GameState         (全体を渡す)
│   └── config: GameConfig           (将来のサイズ取得 / SSoT 参照のため)
│
├── Emits
│   └── cell-click(payload: { x: number, y: number })
│
├── Template
│   ├── <div class="grid">
│   │     <div class="row" v-for="row">
│   │       <div class="cell" v-for="cell" @click="emit('cell-click', { x, y })">
│   │         <span class="cell-content">{{ getCellDisplay(...) }}</span>
│   │         <span class="overlap-badge" v-if="...">...</span>
│   │         <span class="nutrient-indicator" v-if="..." />
│   │       </div>
│   │     </div>
│   │   </div>
│   │
│   ├── <div class="legend">...</div>
│   └── <div class="legend nutrient-legend">...</div>
│
├── Script (composition)
│   ├── getCellClass(cell, x, y): string
│   ├── getCellDisplay(cell, x, y): string
│   ├── nestCellSet: computed<Set<string>>
│   ├── getTopMonster(monsters): Monster | null
│   ├── getMonstersAtCell(x, y): Monster[]
│   ├── getHeroesAtCell(x, y): Hero[]
│   ├── getOverlapCount(x, y): number
│   ├── isDemonLordCell(x, y): boolean
│   ├── isEntranceCell(x, y): boolean
│   └── getNutrientLevel(amount): 'low' | 'mid' | 'high' | null
│
└── Style
    └── .grid / .row / .cell / .cell-* / .monster-* / .hero-* / .nest-* / .nijirigoke-* / .overlap-badge / .nutrient-* etc.
```

### 含まないもの（App.vue に残す）

- 魔王配置モード判定 (`isPlacingDemonLord`)
- `handleCellClick` のロジック本体（GridView から emit を受けて App.vue が `dig` や魔王配置を呼ぶ）
- `scenarios` 配列と各シナリオの `setup()` 関数
- `createInitialState()` と `makeEmptyArena()`（App.vue 内実装）
- GameLoop / 状態管理 / controls / status / events の UI

### Props 設計の判断

- **`gameState` 全体を渡す**: 部分切り出し（`grid`, `monsters`, `heroes` 等を個別 prop にする案）も検討したが、`getCellClass` が複数プロパティを同時に参照する性質上、prop が膨れるだけでメリットが薄い。型定義もそのまま `GameState` を流用できる
- **`config` も渡す**: 描画自体に直接は使わないが、SSoT 原則（サイズに関する情報は GameConfig 経由で取得）を担保するため。将来 GridView 内部で `config.grid.defaultWidth/Height` を利用するフックを作る余地を残す

## Data Flow

```
App.vue                         GridView.vue
========                        ============
gameState (ref)  ────props────> gameState
config (ref)     ────props────> config

                                Template renders cells
                                based on gameState.grid

                                User clicks cell
                                ↓
                                emit('cell-click', { x, y })
                                ↓
handleCellClick(x, y)  <──event──
  ├── if isPlacingDemonLord → place demon lord
  └── else → dig(gameState, { x, y })
```

- データの所有権は App.vue にあり、GridView は読み取り専用
- GridView は「何をしたか」を伝えるのではなく「どこがクリックされたか」だけを伝える
- クリックの意味づけ（dig か魔王配置か）は App.vue の責務

## Migration Strategy

リファクタの安全性を最大化するため、以下の順序で段階的に進める:

1. **Characterization test 先行**: 現状の `App.vue` の振る舞いを Vue Test Utils で固定するテストを先に書く（リファクタ開始前の振る舞いのスナップショット）
2. **GridView スケルトン作成**: 最小の GridView.vue（props, emits, 空のテンプレート）を作成し、`App.vue` から import しておく（まだ使わない）
3. **DOM 構造を移動**: `.grid / .row / .cell` の template 部分を `GridView.vue` に移し、`App.vue` は `<GridView>` タグでレンダリングする
4. **表示ロジックを移動**: `getCellClass`, `getCellDisplay`, `nestCellSet`, `getTopMonster`, `getMonstersAtCell`, `getHeroesAtCell`, `getOverlapCount`, `isDemonLordCell`, `isEntranceCell`, `getNutrientLevel` を GridView に移す
5. **凡例を移動**: `.legend` x2 を GridView に移す
6. **Style を移動**: グリッド関連の CSS (`.grid`, `.cell-*`, `.monster-*`, `.hero-*`, etc.) を GridView に移す
7. **クリックイベント**: GridView が `cell-click` を emit、App.vue がそれを受けて既存の `handleCellClick` を呼ぶ
8. **ハードコード除去**: `App.vue:23` の `createGameState(10, 8, 1.0)` を `createGameState(config.grid.defaultWidth, config.grid.defaultHeight, 1.0)` に変更
9. **シナリオの spread override 化**: 4 つのシナリオ setup で独自 config を作り、`makeEmptyArena` 呼び出しを config 経由にする
10. **パラメトリックテスト追加**: 複数サイズでの動作検証を入れる
11. **手動確認 + lint + 既存 E2E 実行**

各ステップ後にテスト実行し、デグレがないことを確認しながら進める。

## Test Strategy

### 新規単体テスト（Vue Test Utils）

**`src/components/GridView.test.ts`** に以下のテストを追加:

- **Rendering basics**: 指定した `gameState` に対して、行数 / セル数 / セルクラス / セルテキストが期待通り
- **Cell click**: セルをクリックすると `cell-click` イベントが `{ x, y }` で emit される
- **Cell display logic**: `getCellClass` / `getCellDisplay` の各分岐（wall, soil, empty, monster 各 type, hero states, entrance, demon lord, nest）を個別テスト
- **Legend rendering**: 2 つの legend が存在する
- **Parametric at multiple sizes**: `describe.each([[5, 5], [10, 8], [20, 15], [30, 40]])` で各サイズを検証

モックは最小限（gameState を現実的なファクトリで作る、config は `createDefaultConfig()` を使う）。

### 既存テストの扱い

- **core 単体テスト**: 変更なし。`src/core/*.test.ts` はゲームロジックのみで UI に触れないので影響なし
- **E2E（Playwright）**: 変更なし。既存の `e2e/*.spec.ts` が `.cell` 等のセレクタで要素を特定しているので、DOM 構造を保てば動く
- **E2E の座標依存**: `clickCell(5, 1)` 等の座標は 10×8 ベースで書かれているが、20×15 でも同じ座標は有効（範囲内）なので E2E は壊れない

### 手動動作確認

`docker compose up` でブラウザから以下を確認:

- 通常起動（20×15 で表示される）
- シナリオ切替（4 種のシナリオが動く）
- dig / 魔王配置 / 勇者呼び出し / tick / pause / resume / stop / reset

## Risks and Mitigations

| リスク | 軽減策 |
|--------|--------|
| `getCellClass` が想定以上に複雑で GridView の責務境界に収まらない | 事前に関数全体を読み、依存関係を確認済み（`gameState.monsters`, `gameState.heroes`, `nestCellSet` のみ）。GridView 内で閉じられる見込み |
| DOM 構造を変えてしまい既存 E2E が壊れる | セレクタを保つことを Definition of Done に含める。E2E 実行を tasks に明記 |
| 20×15 でゲームバランスが崩れる（勇者が詰む等） | ゲームバランスへの影響は tasks の調査ステップで確認。必要なら `soilRatio` 等を調整する |
| パラメトリックテストが遅い | 複数サイズは 4 つに絞る。各サイズの検証項目は最小限（行数・セル数・主要クラス）に留める |
| App.vue の responsiveness（`ref`, `computed`）が GridView に移した後も期待通り動くか | `gameState` を props で受け取る限り Vue のリアクティビティは維持される（props 経由で更新がトリガされる） |

## Out of Scope Follow-ups

- Issue #49: `src/cli/scenarios.ts` の SSoT 統一（別 change）
- Issue #50: 内側壁方式での擬似小ステージ（M3 タイミングで検討）
- `App.vue` のさらなる責務分離（GameLoop / controls / scenarios 等の抽出）は本 change では行わない
