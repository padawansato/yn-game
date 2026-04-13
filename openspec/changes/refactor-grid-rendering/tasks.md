## 1. 事前調査

- [ ] 1.1 `getCellClass` / `getCellDisplay` / `nestCellSet` / `getTopMonster` の依存関係を正確に把握（`gameState` の何を参照しているか）
- [ ] 1.2 `App.vue` のグリッド描画部分と他部分（魔王配置モード / シナリオ / gameLoop）の結合点をリストアップ
- [ ] 1.3 既存 E2E 3 本（`hero-system.spec.ts`, `nutrient-system.spec.ts`, `nijirigoke-scenario.spec.ts`）で使われている座標を確認し、20×15 に拡大しても有効か検証
- [ ] 1.4 20×15 でゲームバランスに大きな変化が出ないか仮検証（初期養分分布、勇者スポーン位置、モンスター繁殖速度）

## 2. Characterization test（現状動作の固定）

- [ ] 2.1 `@vue/test-utils` を `src/components/GridView.test.ts` で import し、最小の smoke test が通ることを確認（設定の動作確認）
- [ ] 2.2 `App.vue` 全体を mount したときに、初期表示サイズ（ハードコード除去前の現状、10×8）のグリッドが DOM に正しく描画されることをテスト
- [ ] 2.3 セルのクリックで `handleCellClick` が呼ばれる（既存動作）ことをテスト
- [ ] 2.4 テストが全て通ることを確認（characterization baseline 確立）

## 3. GridView スケルトン作成

- [ ] 3.1 `src/components/GridView.vue` を新規作成（最小テンプレート + Props: `gameState`, `config` + Emits: `cell-click`）
- [ ] 3.2 GridView の import を `App.vue` に追加するが、まだ既存の描画を置き換えない（並存状態）
- [ ] 3.3 GridView の基本 smoke test を `src/components/GridView.test.ts` に追加（mount 時にエラーが出ない）

## 4. DOM 構造の移動

- [ ] 4.1 `App.vue` 内の `<div class="grid">` 〜 `</div>` 部分を GridView のテンプレートに移動
- [ ] 4.2 `App.vue` で `<GridView :game-state="gameState" :config="gameConfig" @cell-click="handleCellClick" />` 形式に置き換え
- [ ] 4.3 クリックペイロードの型を `{ x: number, y: number }` として受け取る形に `handleCellClick` を調整（引数シグネチャを変えず、受け取り方だけ）
- [ ] 4.4 ブラウザで目視確認：DOM 構造が同じ、クリック動作が同じ
- [ ] 4.5 既存 E2E を実行して全通過を確認

## 5. 表示ロジックの移動

- [ ] 5.1 `getCellClass`, `getCellDisplay`, `getMonstersAtCell`, `getHeroesAtCell`, `getOverlapCount`, `isDemonLordCell`, `isEntranceCell`, `getNutrientLevel`, `getTopMonster` を GridView に移動
- [ ] 5.2 `nestCellSet` computed を GridView に移動
- [ ] 5.3 `ENTITY_ICONS` 定数や `DISPLAY_PRIORITY` マップが GridView で必要なら一緒に移動
- [ ] 5.4 移動後、`App.vue` から不要になった import / 関数を削除
- [ ] 5.5 既存 E2E を実行して全通過を確認

## 6. 凡例の移動

- [ ] 6.1 `<div class="legend">` と `<div class="legend nutrient-legend">` を GridView のテンプレートに移動
- [ ] 6.2 関連する CSS（`.legend`, `.legend-item`, `.nutrient-legend`, `.nutrient-dot`, `.nutrient-*`）を GridView の style に移動
- [ ] 6.3 ブラウザで目視確認：凡例が正しく表示される

## 7. スタイルの移動

- [ ] 7.1 グリッド関連の CSS（`.grid`, `.row`, `.cell`, `.cell-*`, `.monster-*`, `.hero-*`, `.nijirigoke-*`, `.nest-cell`, `.entrance-cell`, `.demon-lord-cell`, `.overlap-badge`, `.nutrient-indicator`, 関連する @keyframes）を `App.vue` から GridView に移動
- [ ] 7.2 scoped ではなく `<style>` で書く（既存のクラス参照を壊さないため）、または scoped にするなら全参照箇所も確認
- [ ] 7.3 ブラウザで目視確認：見た目が完全に同じ
- [ ] 7.4 既存 E2E を実行して全通過を確認

## 8. ハードコード除去（App.vue の createGameState）

- [ ] 8.1 `App.vue:23` の `createGameState(10, 8, 1.0)` を `createGameState(gameConfig.grid.defaultWidth, gameConfig.grid.defaultHeight, 1.0)` に変更
- [ ] 8.2 `createInitialState` の中で使う高養分土の座標 `grid[2][6]`, `grid[3][4]` が 20×15 の範囲内で有効かを確認（20×15 なら内側 18×13 なので有効）
- [ ] 8.3 ブラウザで目視確認：20×15 で起動する、ゲームが遊べる
- [ ] 8.4 既存 E2E を実行して全通過を確認（座標 `(5, 1)` 等が 20×15 でも有効）

## 9. UI シナリオの spread override 化

- [ ] 9.1 `App.vue` 内の 4 シナリオを順次修正:
  - リザードマン産卵
  - ニジリゴケ変態
  - ガジガジムシ変態
  - 捕食チェーン
- [ ] 9.2 各シナリオで `const scenarioConfig = { ...gameConfig, grid: { ...gameConfig.grid, defaultWidth: 12, defaultHeight: 10 } }` 形式で config を作る
- [ ] 9.3 `makeEmptyArena(12, 10)` を `makeEmptyArena(scenarioConfig.grid.defaultWidth, scenarioConfig.grid.defaultHeight)` に変更
- [ ] 9.4 `createGameState` もシナリオ config から取得する形に統一
- [ ] 9.5 ブラウザで各シナリオを手動実行して動作確認

## 10. パラメトリックテスト追加

- [ ] 10.1 `GridView.test.ts` に `describe.each([[5, 5], [10, 8], [20, 15], [30, 40]])` のパラメトリックブロックを追加
- [ ] 10.2 各サイズで以下を検証:
  - `.row` 要素の数 = height
  - `.cell` 要素の数（全体）= width × height
  - 特定座標のセルが期待通りレンダリングされる（例: `(0, 0)` が `.cell-wall`、`(width/2, 0)` が `.cell-empty`）
  - セルクリックで正しい座標が emit される
- [ ] 10.3 `getCellClass` / `getCellDisplay` の分岐網羅テスト（hero / hero-returning / nijirigoke 各 phase / gajigajimushi / lizardman / nest / demon-lord / entrance / wall / soil / empty）
- [ ] 10.4 テスト実行、全通過確認

## 11. 最終検証

- [ ] 11.1 `docker compose run --rm app pnpm test` で全単体テスト通過を確認
- [ ] 11.2 `docker compose run --rm app pnpm lint` でエラーなし
- [ ] 11.3 `docker compose run --rm app pnpm exec vue-tsc -b` で型エラーなし
- [ ] 11.4 `docker compose run --rm app pnpm exec playwright test` で既存 E2E 3 本全通過
- [ ] 11.5 `docker compose up` でブラウザを開き、手動動作確認:
  - 通常起動で 20×15 のグリッドが表示される
  - dig / 魔王配置 / 勇者呼び出しが機能する
  - 4 シナリオが動作する
  - 凡例が正しく表示される
  - セル上のモンスター / 勇者 / 重なりバッジ / 養分インジケーターが正しく表示される
- [ ] 11.6 `find src -name "*.js" -o -name "*.d.ts"` で stale ファイルがないことを確認

## 12. Verify / Archive 準備

- [ ] 12.1 `/opsx:verify` で実装と spec の整合を確認
- [ ] 12.2 Definition of Done チェックリスト:
  - [ ] `App.vue` が `GridView` 導入により明確に縮小している（目安 300 行以上減少）
  - [ ] グリッドサイズ値が SSoT に統一（App.vue / シナリオ / constants の乖離が解消）
  - [ ] GridView のパラメトリックテスト（4 サイズ）が通る
  - [ ] 既存 E2E 3 本が通る
  - [ ] lint / 型チェック / 全単体テストが通る
  - [ ] 手動動作確認でデグレなし
- [ ] 12.3 PR 作成 → CI 通過確認 → レビュー → merge
- [ ] 12.4 `/opsx:archive refactor-grid-rendering` でアーカイブ
