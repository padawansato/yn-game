# Design: refactor-grid-rendering

## Context

`src/App.vue` は 1149 行に肥大化しており、以下の責務が混在している:

- ゲームループ制御（start / pause / resume / stop / reset）
- シナリオ定義（4 つのデバッグシナリオ）
- 状態管理（gameState, events, isRunning, isPaused, isPlacingDemonLord 等）
- グリッド描画（DOM 構造 + CSS + 表示ロジック + 凡例）
- ユーザー操作ハンドリング（魔王配置モード、dig、勇者呼び出し）

このうち **グリッド描画** の部分は Issue #47（ステージサイズ拡大）を段階的に進めるための前提であり、以下の問題を抱えている:

1. グリッドサイズが 3 箇所でハードコードされている (`App.vue:23` の 10×8、シナリオ 4 本の 12×10、`constants.ts` の 20×15)
2. `GameConfig.grid.defaultWidth/Height` が型・spec で定義済みにもかかわらず、実装が完全に無視している
3. `getCellClass`, `getCellDisplay` 等の UI ロジックがテスト完全未整備
4. ゲームバランスがステージサイズに依存する（`initializeNutrients` は soil セル全体に `totalNutrients` を分配するため、セル数が増えると 1 セル当たりの養分が薄くなる。20×15 では既存の `totalNutrients=200` で平均 0.85/セルとなり、モンスターがほぼスポーンしないゲームになる。本 change で採用する `large = 30×40` ではさらに薄まり、モンスター早期死亡が顕著化する想定。バランス調整は後続 change で対応）

本 change ではグリッド描画を `GridView.vue` コンポーネントに抽出し、SSoT 化を行う。加えて、ゲームバランス調整は時間のかかる反復作業のため、**複数のグリッドサイズ preset（small / large）を実行時に切り替え可能にして、プレイしながら調整できる状態を作る**。デフォルト起動は `small` とし、既存のプレイ体験・E2E・ゲームバランスを完全維持する。

## Goals

1. `App.vue` からグリッド描画関連コード（推定 300〜400 行）を `GridView.vue` に移動する
2. グリッドサイズの値を SSoT（`GRID_PRESETS` + `GameConfig.grid`）に統一し、3 箇所のハードコードを解消する
3. `GridView` の振る舞いを Vue Test Utils による単体テストでカバーする
4. `GRID_PRESETS = { small, large }` を定義し、ランタイムで切替可能な UI を追加する
5. デフォルト起動は `small (10×8)`、既存の E2E / ゲームバランスを完全維持する
6. 既存の E2E 3 本を壊さず、リファクタのデグレを検出可能にする
7. M2 / M3 が「可変サイズ対応済みのコンポーネント + preset カタログ」を前提にして実装できる基盤を提供する

## Non-Goals

- カメラ / スクロール / ズーム対応（M2 のスコープ。本 change では `large = 30×40` を採用するが、操作性改善はページスクロール任せの暫定状態とする）
- 縦長ステージ特有の仕様（深さ・層・養分分布変化）（M3 のスコープ）
- 内側壁方式での擬似小ステージ（Issue #50、M3 タイミング）
- `src/cli/scenarios.ts` の SSoT 化（Issue #49、別 change）
- `large` preset のゲームバランス調整（本 change では意図的に手を入れない、後続で実施）
- ゲームロジック（魔王配置、dig、tick 制御）のリファクタ
- `App.vue` の style セクションの整理

## Architecture

### Component boundary

```
GridView.vue                    (新規、描画のみ)
├── Props
│   ├── gameState: GameState
│   └── config: GameConfig
├── Emits
│   └── cell-click({ x, y })
├── Template
│   ├── <div class="grid"> ... </div>
│   └── <div class="legend"> ... </div> × 2
└── Style (grid / row / cell 関連 CSS)

App.vue                         (リファクタ後)
├── State
│   ├── gameState (ref)
│   ├── gameConfig (ref, 動的に差し替え可能)
│   ├── activePresetKey (ref, 'small' | 'large')
│   └── ... その他状態
├── Methods
│   ├── selectPreset(key)       ← preset 切替
│   ├── handleCellClick(payload)
│   ├── handleTick / start / pause / resume / stop / reset
│   ├── scenario setup × 4       ← spread override 形式
│   └── ...
├── Template
│   ├── controls (Tick / Start / Pause / Resume / Stop / Reset / 勇者呼ぶ)
│   ├── preset buttons (新規: 小 10×8 / 大 30×40)     ← サイズ選択 UI
│   ├── scenario buttons (既存)
│   ├── status / banners
│   ├── <GridView :gameState :config @cell-click="handleCellClick" />
│   └── events log

src/core/constants.ts           (リファクタ)
└── GRID_PRESETS = {
      small: { width: 10, height: 8 },
      large: { width: 30, height: 40 },
    } as const

src/core/config.ts              (リファクタ)
└── createDefaultConfig()
    └── grid.defaultWidth  = GRID_PRESETS.small.width
        grid.defaultHeight = GRID_PRESETS.small.height
```

### GridView に含まないもの

- `handleCellClick` の本体ロジック（魔王配置モード判定、dig 呼び出し）
- `scenarios` 配列と各シナリオの `setup()` 関数
- `createInitialState()` / `makeEmptyArena()` の本体
- GameLoop / controls / status / events の UI
- **preset 切替 UI**（App.vue 側の責務）

### Props 設計

- **`gameState` 全体を渡す**: `getCellClass` が複数プロパティ（monsters, heroes, demonLordPosition 等）を参照するため、部分切り出しのメリットが薄い
- **`config` も渡す**: 描画自体には使わないが、SSoT 原則（サイズに関する情報は config 経由）を担保する
- **preset key は渡さない**: GridView は preset の概念を知らない。preset 切替は App.vue の責務で、切替の結果として新しい `gameState` / `config` が props に流れ込む

## Data Flow

```
User clicks "大 30×40"
        ↓
App.vue.selectPreset('large')
        ↓
├── stopGame()
├── activePresetKey.value = 'large'
├── gameConfig.value = createConfigForPreset('large')
├── gameState.value  = createInitialState(gameConfig.value)
└── events / flags reset
        ↓
Vue reactivity triggers re-render
        ↓
GridView receives new gameState + config via props
        ↓
Template re-renders with 30×40 grid

--------

User clicks a cell in GridView
        ↓
GridView emits cell-click({ x, y })
        ↓
App.vue.handleCellClick({ x, y })
        ├── if isPlacingDemonLord → place demon lord
        └── else → dig(gameState, { x, y })
```

- Preset 切替は App.vue の責務。GridView は state を受け取るだけ
- GridView は「どこをクリックしたか」を emit するだけ、意味づけは App.vue

## Migration Strategy

リファクタの安全性を最大化するため、以下の順序で段階的に進める:

1. **Characterization test 先行**: 現状の `App.vue` の振る舞いを Vue Test Utils で固定するテストを先に書く
2. **GRID_PRESETS 定義 + createDefaultConfig 更新**: `constants.ts` に `GRID_PRESETS` を追加し、`createDefaultConfig()` を small preset 由来に切り替える。`DEFAULT_GRID_WIDTH/HEIGHT` を廃止または GRID_PRESETS 参照に変更。このステップだけで既存テストが壊れないことを確認（デフォルト small 維持なので挙動変化なし）
3. **GridView スケルトン作成**: 最小の GridView.vue（props, emits, 空のテンプレート）を作成し、`App.vue` から import しておく
4. **DOM 構造を移動**: `.grid / .row / .cell` の template 部分を GridView に移し、App.vue は `<GridView>` でレンダリング
5. **表示ロジックを移動**: `getCellClass`, `getCellDisplay`, `nestCellSet`, `getTopMonster`, `getMonstersAtCell`, `getHeroesAtCell`, `getOverlapCount`, `isDemonLordCell`, `isEntranceCell`, `getNutrientLevel`, `ENTITY_ICONS`, `DISPLAY_PRIORITY` を GridView に移す
6. **凡例を移動**: `.legend` x2 を GridView に移す
7. **Style を移動**: グリッド関連 CSS を GridView に移す
8. **ハードコード除去**: `App.vue` の `createGameState(10, 8, 1.0)` を `createGameState(gameConfig.value.grid.defaultWidth, gameConfig.value.grid.defaultHeight, 1.0)` に変更。この時点でデフォルトは small preset なので既存動作と同じ
9. **UI シナリオの spread override 化**: 4 シナリオ setup で `{ ...gameConfig.value, grid: { ...gameConfig.value.grid, defaultWidth: 12, defaultHeight: 10 } }` 形式に書き換え
10. **preset 切替 UI 追加**: `activePresetKey` ref、`selectPreset(key)` 関数、template にボタン追加
11. **パラメトリックテスト追加**: 複数サイズでの動作検証を GridView.test.ts に入れる
12. **手動確認 + lint + 既存 E2E 実行**

各ステップ後にテスト実行し、デグレがないことを確認しながら進める。

## Test Strategy

### 新規単体テスト

**`src/components/GridView.test.ts`** に以下のテストを追加:

- **Rendering basics**: `gameState` に対して、行数 / セル数 / セルクラス / セルテキストが期待通り
- **Cell click**: セルをクリックすると `cell-click` が `{ x, y }` で emit される
- **Cell display logic**: `getCellClass` / `getCellDisplay` の各分岐（wall, soil, empty, monster 各 type, hero states, entrance, demon lord, nest）を個別テスト
- **Legend rendering**: 2 つの legend が存在する
- **Parametric at multiple sizes**: `describe.each([[5, 5], [10, 8], [20, 15], [30, 40]])` で各サイズを検証

**`src/core/constants.test.ts`**（既存）に追記:

- `GRID_PRESETS.small.width === 10 && .height === 8`
- `GRID_PRESETS.large.width === 30 && .height === 40`
- preset の値が正の整数であること

**`src/core/config.test.ts`**（既存）に追記:

- `createDefaultConfig().grid.defaultWidth === GRID_PRESETS.small.width`
- `createDefaultConfig().grid.defaultHeight === GRID_PRESETS.small.height`

### 既存テストの扱い

- **core 単体テスト**: 変更なし。基本的にゲームロジックのみで UI に触れない
- **E2E（Playwright）**: 変更なし。デフォルト起動が small (10×8) のままなので座標も壊れない
- **スクリーンショット比較**: 行わない（M1 では過剰、保守コストが高い）

### 手動動作確認

`docker compose up` でブラウザから以下を確認:

- small で起動（10×8 で表示される、既存と同じ）
- large ボタンをクリック → 30×40 でリセット、遊べる
- small ボタンをクリック → 10×8 に戻る
- シナリオ切替（preset に関係なく 12×10 で起動）
- dig / 魔王配置 / 勇者呼び出し / tick / pause / resume / stop / reset
- active preset のボタンが視覚的にマークされている

## Risks and Mitigations

| リスク | 軽減策 |
|--------|--------|
| `getCellClass` が想定以上に複雑で GridView の責務境界に収まらない | 事前調査で依存関係を確認済み（`gameState.monsters`, `gameState.heroes`, `nestCellSet` のみ）。GridView 内で閉じられる見込み |
| DOM 構造を変えてしまい既存 E2E が壊れる | セレクタを保つことを Definition of Done に含める。E2E 実行を tasks に明記 |
| large preset でゲームバランスが崩れる（モンスターほぼスポーンしない、勇者到達時間が長い等） | 本 change では意図的に調整しない。「動く」ことだけ確認、調整は後続 change。Impact / proposal に明記済み |
| preset 切替時に event listener / game loop が残ってリークする | `stopGame()` を切替の最初に呼ぶ。実装時に `gameLoop` の再初期化を確実に行う |
| preset 切替時に scenario 実行中の状態がおかしくなる | scenario は独自の config を使うので preset と分離される。reset 時は `activePresetKey` に従う |
| パラメトリックテストが遅い | 複数サイズは 4 つに絞る。各サイズの検証項目は最小限（行数・セル数・主要クラス）に留める |

## Out of Scope Follow-ups

- Issue #49: `src/cli/scenarios.ts` の SSoT 統一（別 change）
- Issue #50: 内側壁方式での擬似小ステージ（M3 タイミング）
- M2 で `large = 30×40` の操作性改善（cell 縮小 / カメラ追従 / ズーム / ページスクロール脱却）
- M2 以降で large preset のゲームバランス調整（totalNutrients 相対化、高養分土配置の入口相対化、勇者定数見直し）
- `App.vue` のさらなる責務分離（GameLoop / controls / scenarios 等の抽出）は本 change では行わない
