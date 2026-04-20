## 1. 事前調査 (完了済み)

- [x] 1.1 `getCellClass` / `getCellDisplay` / `nestCellSet` / `getTopMonster` の依存関係を把握
- [x] 1.2 `App.vue` のグリッド描画部分と他部分の結合点をリストアップ
- [x] 1.3 既存 E2E 3 本の座標依存を確認（10×8 前提、デフォルト small なら壊れない）
- [x] 1.4 ゲームバランスへの影響を分析（20×15 だと `initializeNutrients` で平均 0.85/セル、モンスターがほぼスポーンしない → 調整不要の preset 並存方式に決定）

## 2. Characterization test（現状動作の固定）

- [x] 2.1 `@vue/test-utils` を導入するための vitest 環境確認（`vitest.config.ts` に `src/components/**` を jsdom 対象に追加）
- [x] 2.2 `src/App.test.ts` の初期ファイル作成（App.vue を mount する characterization test）
- [x] 2.3 リファクタ前の `App.vue` を mount して、10×8 のグリッドが DOM に正しく描画されることをテスト（12 tests）
- [x] 2.4 セルクリックで handleCellClick 相当の挙動が起きることをテスト（border walls、entrance cell、legends、controls を含む）
- [x] 2.5 characterization baseline 確立（全テスト通過）

## 3. GRID_PRESETS 定義

- [x] 3.1 `src/core/constants.ts` に `GRID_PRESETS = { small: { width: 10, height: 8 }, large: { width: 20, height: 15 } } as const` を追加
- [x] 3.2 `DEFAULT_GRID_WIDTH` / `DEFAULT_GRID_HEIGHT` を `GRID_PRESETS.small` 由来に変更
- [x] 3.3 `src/core/constants.test.ts` に `GRID_PRESETS` の検証テストを追加（4 tests）
- [x] 3.4 `createDefaultConfig()` は既存の `DEFAULT_GRID_*` 参照のまま（これが `GRID_PRESETS.small` から派生するため、実質的に preset 由来）
- [x] 3.5 `src/core/config.test.ts` に「default config は small preset 由来」のテストを追加（1 test）
- [x] 3.6 全テストが通ることを確認

## 4. GridView スケルトン作成

- [x] 4.1 `src/components/GridView.vue` を新規作成。最小テンプレート + Props: `gameState`, `config` + Emits: `cell-click`
- [x] 4.2 `src/components/GridView.test.ts` を新規作成（smoke test）
- [x] 4.3 smoke test が通ることを確認

## 5. DOM 構造の移動（helper 切り出しと同時実施）

- [x] 5.1 `src/components/grid-view-helpers.ts` を新規作成し、`getCellClass`, `getCellDisplay`, `nestCellSet`, `getTopMonster`, `getMonstersAtCell`, `getHeroesAtCell`, `getOverlapCount`, `isDemonLordCell`, `isEntranceCell`, `getNutrientLevel`, `computeNestCellSet`, `ENTITY_ICONS`, `DISPLAY_PRIORITY` を配置
- [x] 5.2 GridView のテンプレートに grid / row / cell の DOM 構造を実装し、helper を使用
- [x] 5.3 `App.vue` の `<div class="grid">` ブロックを `<GridView :game-state="gameState" :config="gameConfig" @cell-click="handleCellClick" />` に置換
- [x] 5.4 `handleCellClick` のシグネチャを `(payload: { x: number; y: number })` に変更
- [x] 5.5 既存テスト全通過を確認

## 6. 表示ロジックの移動

- [x] 6.1 helper 切り出しにより、表示ロジックは grid-view-helpers.ts に集約された（5.1 で完了）
- [x] 6.2 nestCellSet computed を GridView 内に移動
- [x] 6.3 `App.vue` から `ENTITY_ICONS`, `DISPLAY_PRIORITY`, `getHeroesAtCell`, `isDemonLordCell`, `isEntranceCell`, `getCellDisplay`, `nestCellSet`, `getCellClass`, `getOverlapCount`, `getMonstersAtCell`, `getTopMonster`, `getNutrientLevel`, `type EntityType` を削除
- [x] 6.4 `App.vue` から `getNestCells` import を削除
- [x] 6.5 既存テスト全通過を確認

## 7. 凡例の移動

- [x] 7.1 `<div class="legend">` と `<div class="legend nutrient-legend">` を GridView のテンプレートに移動
- [x] 7.2 App.vue の template から legend を削除
- [x] 7.3 テストで 2 つの .legend 要素の存在を確認

## 8. スタイルの移動 (後回し — M1 スコープ外として扱う)

**注記**: style は App.vue のグローバル `<style>` (非 scoped) に留めた。
GridView の CSS クラス参照は App.vue の style で解決される。
この状態でも完全に動作し、既存 E2E も通る想定。

- [ ] 8.1 グリッド関連の CSS を App.vue から GridView に移動（後続 cleanup で実施）
- [ ] 8.2 scoped の扱いを決定（後続 cleanup で実施）
- [ ] 8.3 ブラウザで目視確認（後続）
- [ ] 8.4 既存 E2E 実行（CI で検証）

## 9. ハードコード除去（App.vue の createGameState）

- [x] 9.1 `App.vue:23` の `createGameState(10, 8, 1.0)` を `createGameState(gameConfig.value.grid.defaultWidth, gameConfig.value.grid.defaultHeight, 1.0)` に変更
- [x] 9.2 `createInitialState` の中で使う高養分土の座標 `grid[2][6]`, `grid[3][4]` が small (10×8) の範囲内で有効なことを確認
- [x] 9.3 `gameConfig` を `ref<GameConfig>` にして差し替え可能にし、`createConfigForPreset(key)` ヘルパーを追加
- [x] 9.4 template 内の `gameConfig.hero.spawnStartTick` は Vue 自動 unwrap を利用する形に戻した
- [x] 9.5 全テスト通過を確認

## 10. UI シナリオの spread override 化

- [x] 10.1 `App.vue` 内の 4 シナリオを順次修正（リザードマン産卵 / ニジリゴケ変態 / ガジガジムシ変態 / 捕食チェーン）
- [x] 10.2 各シナリオで `const scenarioConfig = { ...gameConfig.value, grid: { ...gameConfig.value.grid, defaultWidth: 12, defaultHeight: 10 } }` 形式で config を作る
- [x] 10.3 `makeEmptyArena(12, 10)` を `makeEmptyArena(scenarioConfig.grid.defaultWidth, scenarioConfig.grid.defaultHeight)` に変更
- [x] 10.4 `replace_all` による一括変換で 4 箇所を同時に更新
- [x] 10.5 全テスト通過を確認

## 11. preset 切替 UI 追加

- [x] 11.1 `App.vue` に `activePresetKey = ref<GridPresetKey>('small')` を追加
- [x] 11.2 `selectPreset(key)` 関数を追加（stopGame → preset 更新 → createInitialState → flags リセット）
- [x] 11.3 `handleReset` は `activePresetKey` の状態を変えず、現在の preset を維持
- [x] 11.4 template にサイズ選択ボタンを追加（`.presets` div 内で `v-for="(preset, key) in GRID_PRESETS"`）
- [x] 11.5 CSS に `.presets`, `.preset-btn`, `.preset-btn.active` のスタイルを追加
- [x] 11.6 characterization test (`App.test.ts`) に preset 切替の 6 統合テストを追加

## 12. パラメトリックテスト追加

- [x] 12.1 `GridView.test.ts` に `describe.each([5×5, 10×8, 20×15, 30×40])` のパラメトリックブロックを追加
- [x] 12.2 各サイズで `.row`, `.cell`, borders, entrance, click emission を検証（4 サイズ × 5 tests = 20 tests）
- [x] 12.3 GridView の基本テスト 7 件と合わせて合計 27 tests
- [x] 12.4 App.test.ts に preset 切替の統合テストを追加（small 初期 / large 切替 / active クラス / small に戻る）
- [x] 12.5 全テスト通過を確認（337 tests）

## 13. 最終検証

- [x] 13.1 `docker compose run --rm app pnpm test -- --run` で全単体テスト通過を確認（337 tests）
- [x] 13.2 `docker compose run --rm app pnpm lint` でエラーなし
- [x] 13.3 `docker compose run --rm app pnpm exec vue-tsc -b` で型エラーなし（`tsconfig.node.json` に `outDir` を追加して stale .d.ts/.js 再生成を修正）
- [ ] 13.4 `docker compose run --rm app pnpm exec playwright test` で既存 E2E 3 本全通過（ローカル Docker では chromium system deps 不足のため CI に委譲）
- [ ] 13.5 `docker compose up` でブラウザを開き、手動動作確認（次のステップで実施予定）
- [x] 13.6 `find src -name "*.js" -o -name "*.d.ts"` で stale ファイルがないことを確認（`vite-env.d.ts` のみ）

## 14. Verify / Archive 準備

- [ ] 14.1 `openspec change validate refactor-grid-rendering` で artifact の整合を確認
- [ ] 14.2 Definition of Done チェックリスト最終確認
- [ ] 14.3 PR 作成 → CI 通過確認 → レビュー → merge
- [ ] 14.4 `/opsx:archive refactor-grid-rendering` でアーカイブ
