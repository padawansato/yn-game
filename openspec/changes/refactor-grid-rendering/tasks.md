## 1. 事前調査 (完了済み)

- [x] 1.1 `getCellClass` / `getCellDisplay` / `nestCellSet` / `getTopMonster` の依存関係を把握
- [x] 1.2 `App.vue` のグリッド描画部分と他部分の結合点をリストアップ
- [x] 1.3 既存 E2E 3 本の座標依存を確認（10×8 前提、デフォルト small なら壊れない）
- [x] 1.4 ゲームバランスへの影響を分析（20×15 だと `initializeNutrients` で平均 0.85/セル、モンスターがほぼスポーンしない → 調整不要の preset 並存方式に決定）

## 2. Characterization test（現状動作の固定）

- [ ] 2.1 `@vue/test-utils` を導入するための vitest 環境確認（jsdom が既に入っていることを確認）
- [ ] 2.2 `src/components/GridView.test.ts` の初期ファイル作成。最小の smoke test が通ることを確認
- [ ] 2.3 リファクタ前の `App.vue` を mount して、10×8 のグリッドが DOM に正しく描画されることをテスト（行数・セル数・主要クラス）
- [ ] 2.4 セルクリックで `handleCellClick` 相当の挙動が起きることをテスト
- [ ] 2.5 テストが全て通ることを確認（characterization baseline 確立）

## 3. GRID_PRESETS 定義

- [ ] 3.1 `src/core/constants.ts` に `GRID_PRESETS = { small: { width: 10, height: 8 }, large: { width: 20, height: 15 } } as const` を追加
- [ ] 3.2 `DEFAULT_GRID_WIDTH` / `DEFAULT_GRID_HEIGHT` を `GRID_PRESETS.small` 由来に変更（廃止 or 参照）
- [ ] 3.3 `src/core/constants.test.ts` に `GRID_PRESETS` の検証テストを追加（値の正しさ、正の整数、重複リテラルなし）
- [ ] 3.4 `createDefaultConfig()` を `GRID_PRESETS.small` を参照する形に変更
- [ ] 3.5 `src/core/config.test.ts` に「default config は small preset 由来」のテストを追加
- [ ] 3.6 全テストが通ることを確認（デフォルト small 維持で挙動変化なし）

## 4. GridView スケルトン作成

- [ ] 4.1 `src/components/GridView.vue` を新規作成。最小テンプレート + Props: `gameState`, `config` + Emits: `cell-click`
- [ ] 4.2 `App.vue` から GridView を import（まだ既存の描画を置き換えない、並存状態）
- [ ] 4.3 `GridView.test.ts` に基本 smoke test を追加（mount 時にエラーが出ない）

## 5. DOM 構造の移動

- [ ] 5.1 `App.vue` の `<div class="grid">` 〜 `</div>` 部分を GridView のテンプレートに移動
- [ ] 5.2 `App.vue` で `<GridView :game-state="gameState" :config="gameConfig" @cell-click="handleCellClick" />` に置き換え
- [ ] 5.3 クリックペイロードの型を `{ x: number, y: number }` として受け取るよう `handleCellClick` を調整
- [ ] 5.4 ブラウザで目視確認：DOM 構造が同じ、クリック動作が同じ
- [ ] 5.5 既存 E2E を実行して全通過を確認

## 6. 表示ロジックの移動

- [ ] 6.1 `getCellClass`, `getCellDisplay`, `getMonstersAtCell`, `getHeroesAtCell`, `getOverlapCount`, `isDemonLordCell`, `isEntranceCell`, `getNutrientLevel`, `getTopMonster` を GridView に移動
- [ ] 6.2 `nestCellSet` computed を GridView に移動
- [ ] 6.3 `ENTITY_ICONS` / `DISPLAY_PRIORITY` を GridView に移動
- [ ] 6.4 `App.vue` から不要になった import / 関数を削除
- [ ] 6.5 既存 E2E を実行して全通過を確認

## 7. 凡例の移動

- [ ] 7.1 `<div class="legend">` と `<div class="legend nutrient-legend">` を GridView のテンプレートに移動
- [ ] 7.2 関連する CSS（`.legend`, `.legend-item`, `.nutrient-legend`, `.nutrient-dot`, `.nutrient-*`）を GridView の style に移動
- [ ] 7.3 ブラウザで目視確認：凡例が正しく表示される

## 8. スタイルの移動

- [ ] 8.1 グリッド関連の CSS（`.grid`, `.row`, `.cell`, `.cell-*`, `.monster-*`, `.hero-*`, `.nijirigoke-*`, `.nest-cell`, `.entrance-cell`, `.demon-lord-cell`, `.overlap-badge`, `.nutrient-indicator`, 関連する @keyframes）を `App.vue` から GridView に移動
- [ ] 8.2 scoped ではなく `<style>` で書く（既存のクラス参照を壊さないため）
- [ ] 8.3 ブラウザで目視確認：見た目が完全に同じ
- [ ] 8.4 既存 E2E を実行して全通過を確認

## 9. ハードコード除去（App.vue の createGameState）

- [ ] 9.1 `App.vue:23` の `createGameState(10, 8, 1.0)` を `createGameState(gameConfig.value.grid.defaultWidth, gameConfig.value.grid.defaultHeight, 1.0)` に変更
- [ ] 9.2 `createInitialState` の中で使う高養分土の座標 `grid[2][6]`, `grid[3][4]` が small (10×8) の範囲内で有効なことを確認（内部 8×6 なので OK）
- [ ] 9.3 `gameConfig` を `ref<GameConfig>` にして差し替え可能にする
- [ ] 9.4 ブラウザで目視確認：small で起動する、ゲームが遊べる
- [ ] 9.5 既存 E2E を実行して全通過を確認

## 10. UI シナリオの spread override 化

- [ ] 10.1 `App.vue` 内の 4 シナリオを順次修正:
  - リザードマン産卵
  - ニジリゴケ変態
  - ガジガジムシ変態
  - 捕食チェーン
- [ ] 10.2 各シナリオで `const scenarioConfig = { ...gameConfig.value, grid: { ...gameConfig.value.grid, defaultWidth: 12, defaultHeight: 10 } }` 形式で config を作る
- [ ] 10.3 `makeEmptyArena(12, 10)` を `makeEmptyArena(scenarioConfig.grid.defaultWidth, scenarioConfig.grid.defaultHeight)` に変更
- [ ] 10.4 `createGameState` もシナリオ config から取得する形に統一
- [ ] 10.5 ブラウザで各シナリオを手動実行して動作確認

## 11. preset 切替 UI 追加

- [ ] 11.1 `App.vue` に `activePresetKey = ref<'small' | 'large'>('small')` を追加
- [ ] 11.2 `selectPreset(key)` 関数を追加:
  - `stopGame()`
  - `activePresetKey.value = key`
  - `gameConfig.value = createConfigForPreset(key)`（`createDefaultConfig()` に preset 引数を取る形、または独自ヘルパー）
  - `gameState.value = createInitialState(gameConfig.value)`
  - events / flags リセット
- [ ] 11.3 `handleReset` が現在の `activePresetKey` に従って reset する形に調整
- [ ] 11.4 template にサイズ選択ボタンを追加（シナリオボタンの隣、同じスタイル）:
  ```
  <button
    v-for="(preset, key) in GRID_PRESETS"
    :key="key"
    :class="{ active: activePresetKey === key }"
    @click="selectPreset(key)"
  >
    {{ key === 'small' ? '小' : '大' }} {{ preset.width }}×{{ preset.height }}
  </button>
  ```
- [ ] 11.5 CSS で active 状態の視覚マーク（既存の scenario-btn スタイルを流用）
- [ ] 11.6 ブラウザで手動確認:
  - small / large ボタンで切り替わる
  - active ボタンが視覚的に強調される
  - 切替後にゲームが遊べる
  - シナリオは preset に影響されない（12×10 で起動）
  - reset は `activePresetKey` に従う

## 12. パラメトリックテスト追加

- [ ] 12.1 `GridView.test.ts` に `describe.each([[5, 5], [10, 8], [20, 15], [30, 40]])` のパラメトリックブロックを追加
- [ ] 12.2 各サイズで以下を検証:
  - `.row` 要素の数 = height
  - `.cell` 要素の数（全体）= width × height
  - 特定座標のセルが期待通りレンダリングされる（例: `(0, 0)` が `.cell-wall`）
  - セルクリックで正しい座標が emit される
- [ ] 12.3 `getCellClass` / `getCellDisplay` の分岐網羅テスト
- [ ] 12.4 preset 切替の統合テスト（App.vue を mount して small → large → small で切り替わる）
- [ ] 12.5 テスト実行、全通過確認

## 13. 最終検証

- [ ] 13.1 `docker compose run --rm app pnpm test` で全単体テスト通過を確認
- [ ] 13.2 `docker compose run --rm app pnpm lint` でエラーなし
- [ ] 13.3 `docker compose run --rm app pnpm exec vue-tsc -b` で型エラーなし
- [ ] 13.4 `docker compose run --rm app pnpm exec playwright test` で既存 E2E 3 本全通過
- [ ] 13.5 `docker compose up` でブラウザを開き、手動動作確認:
  - small（デフォルト）で 10×8 が表示される
  - large ボタン → 20×15 に切り替わる（ゲームバランスは崩れるが動く）
  - small ボタン → 10×8 に戻る
  - 4 シナリオが preset に関係なく動作する
  - 凡例 / モンスター / 勇者 / 重なりバッジ / 養分インジケーターが正しく表示される
- [ ] 13.6 `find src -name "*.js" -o -name "*.d.ts"` で stale ファイルがないことを確認

## 14. Verify / Archive 準備

- [ ] 14.1 `openspec change validate refactor-grid-rendering` で artifact の整合を確認
- [ ] 14.2 Definition of Done チェックリスト:
  - [ ] `App.vue` が `GridView` 導入により明確に縮小している（目安 300 行以上減少）
  - [ ] グリッドサイズ値が `GRID_PRESETS` に統一（App.vue / シナリオ / constants の乖離が解消）
  - [ ] preset 切替 UI が動作する（small / large）
  - [ ] デフォルト起動が small で既存と同じ
  - [ ] GridView のパラメトリックテスト（4 サイズ）が通る
  - [ ] `GRID_PRESETS` の単体テストが通る
  - [ ] 既存 E2E 3 本が通る
  - [ ] lint / 型チェック / 全単体テストが通る
  - [ ] 手動動作確認でデグレなし
- [ ] 14.3 PR 作成 → CI 通過確認 → レビュー → merge
- [ ] 14.4 `/opsx:archive refactor-grid-rendering` でアーカイブ
