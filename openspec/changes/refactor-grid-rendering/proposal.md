## Why

`src/App.vue` が 1149 行に肥大化し、グリッド描画ロジックがゲームロジック・シナリオ定義・状態管理と混在している。さらにグリッドサイズが 3 箇所に散在してハードコードされている状態（`App.vue:23` で 10×8、シナリオ 4 本で 12×10、`constants.ts` で 20×15）で、`GameConfig.grid.defaultWidth/Height` が型と spec で定義済みにもかかわらず実装側で無視されている。Issue #47（ステージサイズ拡大）を段階的に実装する前提として、まずこの構造的問題を解消する必要がある。

加えて、事前調査でステージサイズがゲームバランス（養分分布、勇者 AI の到達時間、モンスタースポーン条件）に強く影響することが判明した。1 つのサイズに決め打ちすると、バランス調整が終わるまでそのサイズで固定され、別サイズを試すのにコード変更が必要になる。本 change では **複数のグリッドサイズ preset を定義し、実行時に切り替え可能にする** ことで、プレイしながらバランス調整ができる状態を作る。

## What Changes

### リファクタ (GridView 抽出)

- 新規コンポーネント `GridView.vue` を作成し、`App.vue` からグリッド描画とその支援関数を抽出する
  - DOM 構造 (`.grid` → `.row` → `.cell`)
  - 表示ロジック (`getCellClass`, `getCellDisplay`, `nestCellSet`, `getTopMonster`)
  - 凡例 2 つ（通常、養分）

### SSoT 化

- `App.vue` の `createGameState(10, 8, 1.0)` ハードコードを `GameConfig.grid` 経由に置換
- UI シナリオ 4 本の `makeEmptyArena(12, 10)` を `{ ...baseConfig, grid: { ...baseConfig.grid, defaultWidth, defaultHeight } }` の spread override 形式に書き換え

### グリッドサイズ preset の導入

- `src/core/constants.ts` に **`GRID_PRESETS`** を定義: `{ small: { width: 10, height: 8 }, large: { width: 20, height: 15 } }`
- 従来の `DEFAULT_GRID_WIDTH = 20, DEFAULT_GRID_HEIGHT = 15` は `GRID_PRESETS` に統合し、重複を解消
- `GameConfig.grid.defaultWidth/Height` は `GRID_PRESETS.small` から派生（デフォルトは small で既存動作を維持）

### サイズ選択 UI

- 既存のシナリオボタンと同じスタイルで、グリッドサイズを実行時に切り替える UI を追加
  - 表示例: `[小 10×8]` `[大 20×15]`
- クリックするとゲームループを停止し、選択された preset のサイズで新しい GameState を作ってリセットする
- デフォルト起動サイズは **small (10×8)**。既存のプレイ体験・E2E・ゲームバランスを完全維持する
- 現在選択中の preset は視覚的にマークされる

### テスト

- Vue Test Utils で `GridView` の単体テストを新規追加（現状、UI ロジックのテストはゼロ）
- `GridView` テストは複数サイズ（5×5 / 10×8 / 20×15 / 30×40）でパラメトリック化し、サイズ依存がないことを検証する
- `GRID_PRESETS` と preset 切替ロジックの単体テストも追加

### スコープ外 (明示)

- 大幅なサイズ拡大（ゆうなま相当の 30×40 等、huge preset 追加）は後続 change（M2: `viewport-camera-scroll`）のスコープ
- **ゲームバランス調整（large サイズでの養分総量、勇者 spawn 定数等）は M1 では行わない**。プレイしながら後続 change で詰める
- `src/cli/scenarios.ts` の SSoT 統一は Issue #49 で別途追跡
- 内側壁方式の擬似小ステージ（Issue #50）は M3 で検討

## Capabilities

### New Capabilities

- `grid-view-component`: グリッド描画を担う Vue コンポーネント `GridView.vue` の責務・境界・Props/Emits インターフェース・サイズ可変性の要件を定義する
- `grid-size-preset`: 複数のグリッドサイズ preset（small / large）の定義、デフォルト、ランタイム切替 UI、シナリオとの分離に関する要件を定義する

### Modified Capabilities

なし。`game-config` spec は既に `grid.defaultWidth/Height` を含めた GameConfig 型を要求しているため、本 change は spec 側の要件を変えない。実装が既存の requirement に従うようになる（＝ spec と実装の乖離の解消）だけであり、requirement の追加・削除・変更はない。

## Impact

- **コード（変更）**
  - `src/App.vue`: グリッド描画関連のコード（推定 300〜400 行）が `GridView.vue` に移動。UI シナリオ定義を spread override 形式へ。`createGameState` 呼び出しを `GameConfig.grid` 経由に変更。`makeEmptyArena` の UI 側参照も整理。サイズ選択ボタンをシナリオボタン群の近くに追加。現在選択中の preset を `ref` で保持
  - `src/core/constants.ts`: `DEFAULT_GRID_WIDTH/HEIGHT` を廃止し `GRID_PRESETS` に統合
  - `src/core/config.ts`: `createDefaultConfig()` が `GRID_PRESETS.small` から派生する形に変更
  - `src/cli/scenarios.ts` の `makeEmptyArena` 重複実装と CLI シナリオ 4 本は **本 change のスコープ外**（Issue #49）
- **コード（新規）**
  - `src/components/GridView.vue`: グリッド描画コンポーネント
  - `src/components/GridView.test.ts`: Vue Test Utils による単体テスト
- **テスト戦略**
  - 新規: `GridView` のコンポーネントテスト（パラメトリックで複数サイズを検証）
  - 新規: `GRID_PRESETS` と preset 切替ロジックの単体テスト
  - 既存: E2E 3 本（`hero-system.spec.ts`, `nutrient-system.spec.ts`, `nijirigoke-scenario.spec.ts`）が通ることを safety net とする（デフォルト small 維持により座標が壊れない）
- **依存**
  - `@vue/test-utils`: 既に `devDependencies` に入っているが現状未使用。本 change で初導入となる
- **仕様との関係**
  - `openspec/specs/game-config/spec.md` の `grid.defaultWidth/Height` の要件を、本 change で初めて実装が実際に参照するようになる（spec は変更なし）
- **ユーザー視点の変化**
  - **デフォルト起動は従来通り small (10×8)** なので、既存プレイヤーの体験に変化はない
  - **追加機能として「大 20×15」ボタン** が増える。ユーザーが選択するとゲームがその preset でリセットされて遊べる
  - large 選択時のゲームバランスは未調整。「意図的に手を入れない」ことを本 change の明示的な方針とする
- **ゲームバランス調整の方針**
  - M1 では調整を行わない。プレイしながら small と large を比較し、必要な調整（totalNutrients、高養分土配置、勇者 spawn 定数等）を別 change で実施する
- **後続 change**
  - M2（`viewport-camera-scroll`）と M3（`vertical-stage-ecology`）は本 change の基盤（GridView、GameConfig 経由の SSoT、GRID_PRESETS）を前提として実装される
  - M2 では huge preset（30×40 等）を追加してゆうなま相当のステージに拡大可能
- **関連 issue**
  - Issue #47: ステージサイズ拡大（親 issue）
  - Issue #49: CLI scenarios SSoT 統一（本 change のスコープ外として追跡）
  - Issue #50: inner-wall debug arena（M3 タイミングで検討、将来検討事項として追跡）
