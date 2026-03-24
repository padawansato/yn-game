## 1. 型定義の拡張

- [x] 1.1 `Cell` インターフェースに `magicAmount: number` フィールドを追加（将来用、初期値0）
- [x] 1.2 `Monster` インターフェースに `phase` フィールドを追加（MonsterType ごとの union 型）
- [x] 1.3 `NijirigokePhase`, `GajigajimushiPhase`, `LizardmanPhase` 型を定義
- [x] 1.4 `MonsterPhase` union 型を定義（全 phase の union）
- [x] 1.5 `GameEvent` に `MONSTER_ATTACKED`, `PHASE_TRANSITION`, `MONSTER_REPRODUCED`, `EGG_LAID`, `EGG_HATCHED` イベントを追加
- [x] 1.6 既存の `MONSTER_DIED` イベントに `cause: 'pickaxe'` を追加

## 2. 養分保存則の実装

- [x] 2.1 `NUTRIENT_DEPLETION_RATIO` 定数を削除し、`depleteOnDig()` 関数を削除
- [x] 2.2 `getAdjacentSoilCells()` を `getSurroundingCells()` に改名・拡張（8方向+中心、soil/empty両対応）
- [x] 2.3 `releaseNutrientsOnDeath()` を9マス放出（8方向+中心）に変更し、空洞セルにも放出可能にする
- [x] 2.4 養分オーバーフロー分配ロジックを実装（`MAX_NUTRIENT_PER_CELL` 超過時に周囲セルへ分配、収まらない場合は上限超過を許容）
- [x] 2.5 `releaseNutrient()` で放出先が見つからない場合に空洞セルにも放出する対応
- [x] 2.6 `initializeNutrients()` で空洞セルの `nutrientAmount` を0に初期化する処理を維持確認
- [x] 2.7 保存則の検証テストを作成（tick 前後で `getTotalNutrients()` が一定であること）
- [x] 2.8 既存テストの修正（`depleteOnDig` 関連テストの削除/修正、30%喪失前提のアサーション修正）

## 3. 掘削ロジックの修正

- [x] 3.1 `dig()` 関数から `depleteOnDig()` 呼び出しを削除し、養分100%をモンスター生成に使用
- [x] 3.2 モンスター生成時の初期 life は `config.life`（lifeは保存則の外）、養分は `carryingNutrient` + 周囲セルに分配
- [x] 3.3 余剰養分（N > carryingCapacity の場合）を周囲セルに分配するロジック追加
- [x] 3.4 生成されるモンスターに初期 `phase` を設定（nijirigoke='mobile', gajigajimushi='larva', lizardman='normal'）
- [x] 3.5 掘削関連テストの更新（養分100%保存の検証）

## 4. つるはし機能（コアロジック）

- [x] 4.1 `PICKAXE_DAMAGE` 定数を `constants.ts` に追加
- [x] 4.2 `attackMonster(state, monsterId, damage)` 関数を `simulation.ts` に実装
- [x] 4.3 つるはし攻撃によるモンスター死亡時の保存則準拠養分放出を確認
- [x] 4.4 勇者エンティティへのダメージ不可ガードを追加（将来の勇者実装に備え：monsterId検索で対応）
- [x] 4.5 つるはし機能のユニットテスト作成（ダメージ付与、死亡、養分保存則）

## 5. モンスター変態システム - 基盤

- [x] 5.1 `constants.ts` に変態閾値定数を追加（`BUD_NUTRIENT_THRESHOLD`, `FLOWER_NUTRIENT_THRESHOLD`, `PUPA_NUTRIENT_THRESHOLD`, `PUPA_DURATION`, `LAYING_NUTRIENT_THRESHOLD`, `LAYING_LIFE_THRESHOLD`, `LAYING_DURATION`, `EGG_HATCH_DURATION`）
- [x] 5.2 Monster に `phaseTickCounter: number` フィールドを追加（蛹・産卵・卵の経過ティック管理用）
- [x] 5.3 `processPhaseTransitions(state)` 関数を `simulation.ts` に実装（全モンスターの phase 遷移チェック）
- [x] 5.4 `tick()` の処理順序に `processPhaseTransitions()` を追加（生命減少・死亡判定の後）

## 6. ニジリゴケ変態（コケ類ライフサイクル）

- [x] 6.1 mobile → bud 遷移ロジック実装（carryingNutrient >= 閾値 AND life <= 閾値）
- [x] 6.2 bud 状態の広範囲吸収ロジック実装（9マスから養分吸収）
- [x] 6.3 bud → flower 遷移ロジック実装（carryingNutrient >= 閾値）
- [x] 6.4 flower 状態のライフ減少ロジック実装（通常より速い減少）
- [x] 6.5 flower → withered 遷移ロジック実装（life <= 0）
- [x] 6.6 ニジリゴケ変態のユニットテスト作成

## 7. ガジガジムシ変態（ムシ類ライフサイクル）

- [x] 7.1 larva → pupa 遷移ロジック実装（carryingNutrient >= 閾値）
- [x] 7.2 pupa 状態の無消費ロジック実装（immobile phaseで移動スキップ）
- [x] 7.3 pupa → adult 遷移ロジック実装（PUPA_DURATION ティック経過後）
- [x] 7.4 adult 状態の移動ロジック確認（既存 refraction パターン流用、immobileリストに含まない）
- [x] 7.5 ガジガジムシ変態のユニットテスト作成

## 8. リザードマン変態（トカゲ類ライフサイクル）

- [x] 8.1 normal/nesting → laying 遷移ロジック実装（巣位置 AND carryingNutrient >= 閾値 AND life >= 閾値）
- [x] 8.2 laying 状態の固定化ロジック実装（immobile phaseで移動スキップ）
- [x] 8.3 laying → egg 生成ロジック実装（LAYING_DURATION 後に egg エンティティ生成、親の養分を一部移譲）
- [x] 8.4 egg の孵化ロジック実装（EGG_HATCH_DURATION 後に子リザードマン生成）
- [x] 8.5 egg の捕食脆弱性実装（ガジガジムシに食べられる）
- [x] 8.6 リザードマン変態のユニットテスト作成

## 9. 繁殖システム

- [x] 9.1 ニジリゴケ繁殖実装（withered 時に子コケ最大5匹生成、養分均等分配）
- [x] 9.2 ガジガジムシ繁殖実装（adult が条件を満たすと larva を1匹生成、養分/lifeコスト）
- [x] 9.3 リザードマン繁殖実装（egg 孵化で子リザードマン生成、egg の養分を継承）
- [x] 9.4 繁殖時の養分保存則テスト作成（親の養分が子に正確に分配されること）
- [x] 9.5 繁殖イベント発行の実装とテスト

## 10. 移動システムの phase 対応

- [x] 10.1 `calculateMove()` に phase チェックを追加（immobile phase はスキップ）
- [x] 10.2 immobile phase リスト定義（'bud', 'flower', 'withered', 'pupa', 'laying', 'egg'）
- [x] 10.3 移動システムの phase 対応テスト作成

## 11. 統合テストと検証

- [x] 11.1 複数 tick にわたる養分保存則の統合テスト作成（integration.test.ts に追加済み）
- [x] 11.2 変態→繁殖→捕食の連鎖シナリオテスト作成（simulation.test.ts に追加済み）
- [x] 11.3 既存テストスイートの全テストがパスすることを確認（191/191 passed）
- [x] 11.4 lint / format / 型チェックがパスすることを確認（vue-tsc 0 errors, eslint clean）
