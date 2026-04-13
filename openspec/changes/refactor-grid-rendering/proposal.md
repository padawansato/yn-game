## Why

`src/App.vue` が 1149 行に肥大化し、グリッド描画ロジックがゲームロジック・シナリオ定義・状態管理と混在している。さらにグリッドサイズが 3 箇所に散在してハードコードされている状態（`App.vue:23` で 10×8、シナリオ 4 本で 12×10、`constants.ts` で 20×15）で、`GameConfig.grid.defaultWidth/Height` が型と spec で定義済みにもかかわらず実装側で無視されている。Issue #47（ステージサイズ拡大）を段階的に実装する前提として、まずこの構造的問題を解消する必要がある。

## What Changes

- 新規コンポーネント `GridView.vue` を作成し、`App.vue` からグリッド描画とその支援関数を抽出する
  - DOM 構造 (`.grid` → `.row` → `.cell`)
  - 表示ロジック (`getCellClass`, `getCellDisplay`, `nestCellSet`, `getTopMonster`)
  - 凡例 2 つ（通常、養分）
- `App.vue` の `createGameState(10, 8, 1.0)` ハードコードを `GameConfig.grid` 経由に置換
- UI シナリオ 4 本の `makeEmptyArena(12, 10)` を `{ ...baseConfig, grid: { ...baseConfig.grid, defaultWidth, defaultHeight } }` の spread override 形式に書き換え
- Vue Test Utils で `GridView` の単体テストを新規追加（現状、UI ロジックのテストはゼロ）
- `GridView` テストは複数サイズ（5×5 / 10×8 / 20×15 / 30×40）でパラメトリック化し、サイズ依存がないことを検証する
- 表示サイズは `GameConfig.grid` のデフォルト値（**20×15**）に統一する。`src/core/constants.ts` の `DEFAULT_GRID_WIDTH/HEIGHT` は初期コミット（`b996440` 2026-02-02）から 20×15 として定義されており、これが本来の設計意図である。`App.vue` のハードコード 10×8 は後付けの乖離であり、本 change で解消する。結果として実際の表示サイズは 10×8 → 20×15 に変わるが、本 change の目的はサイズ変更ではなく SSoT 化であり、このサイズ差は副作用として発生する
- 大幅なサイズ拡大（ゆうなま相当の 30×40 等）は後続 change（M2: `viewport-camera-scroll`）のスコープ

## Capabilities

### New Capabilities

- `grid-view-component`: グリッド描画を担う Vue コンポーネント `GridView.vue` の責務・境界・Props/Emits インターフェース・サイズ可変性の要件を定義する

### Modified Capabilities

なし。`game-config` spec は既に `grid.defaultWidth/Height` を含めた GameConfig 型を要求しているため、本 change は spec 側の要件を変えない。実装が既存の requirement に従うようになる（＝ spec と実装の乖離の解消）だけであり、requirement の追加・削除・変更はない。

## Impact

- **コード（変更）**
  - `src/App.vue`: グリッド描画関連のコード（推定 300〜400 行）が `GridView.vue` に移動。UI シナリオ定義を spread override 形式へ。`createGameState` 呼び出しを `GameConfig.grid` 経由に変更。`makeEmptyArena` の UI 側参照も整理
  - `src/cli/scenarios.ts` の `makeEmptyArena` 重複実装と CLI シナリオ 4 本は **本 change のスコープ外**（Issue #49 で別 change として追跡）
- **コード（新規）**
  - `src/components/GridView.vue`: グリッド描画コンポーネント
  - `src/components/GridView.test.ts`: Vue Test Utils による単体テスト
- **テスト戦略**
  - 新規: `GridView` のコンポーネントテスト（パラメトリックで複数サイズを検証）
  - 既存: E2E 3 本（`hero-system.spec.ts`, `nutrient-system.spec.ts`, `nijirigoke-scenario.spec.ts`）が通ることを safety net とする
- **依存**
  - `@vue/test-utils`: 既に `devDependencies` に入っているが現状未使用。本 change で初導入となる
- **仕様との関係**
  - `openspec/specs/game-config/spec.md` の `grid.defaultWidth/Height` の要件を、本 change で初めて実装が実際に参照するようになる（spec は変更なし）
- **ユーザー視点の変化**
  - 実際の表示サイズが 10×8 → 20×15 に変わる（ハードコード解消の副作用）。画面内には収まるので破綻はしない。ゲームバランスへの影響は proposal 後の調査で確認し、必要なら `soilRatio` 等の調整を tasks に含める
- **後続 change**
  - M2（`viewport-camera-scroll`）と M3（`vertical-stage-ecology`）は本 change の基盤（可変サイズ対応済みの `GridView` と SSoT 化された `GameConfig`）を前提として実装される
- **関連 issue**
  - Issue #47: ステージサイズ拡大（親 issue）
  - Issue #49: CLI scenarios SSoT 統一（本 change のスコープ外として追跡）
  - Issue #50: inner-wall debug arena（M3 タイミングで検討、将来検討事項として追跡）
