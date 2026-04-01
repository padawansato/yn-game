## 1. GameConfig型定義とデフォルト値

- [x] 1.1 `src/core/config.ts`を作成: GameConfig, MonsterTypeConfig型定義
- [x] 1.2 `createDefaultConfig()`を実装: constants.tsの値をGameConfigに変換
- [x] 1.3 `validateConfig()`を実装: 正数チェック、predationTargets参照チェック
- [x] 1.4 config.tsのテストを作成: デフォルト値一致、バリデーション、serialization round-trip

## 2. GameStateへのconfig注入

- [x] 2.1 `types.ts`のGameStateにconfig: GameConfigフィールドを追加
- [x] 2.2 `spawn.ts`（後述の分割後）のcreateGameState()にconfig引数を追加、デフォルト注入
- [x] 2.3 既存テストのGameState生成ヘルパーにcreateDefaultConfig()を追加
- [x] 2.4 全テスト通過を確認

## 3. simulation.ts分割

- [x] 3.1 `src/core/movement-resolution.ts`を作成: calculateAllMoves, resolveConflicts, applyMovements
- [x] 3.2 `src/core/life-cycle.ts`を作成: decreaseLifeForMoved, processNestEstablishment
- [x] 3.3 `src/core/phase-transitions.ts`を作成: processPhaseTransitions, 3種phase関数, applyMoyomoyoAttacks
- [x] 3.4 `src/core/dig.ts`を作成: dig, attackMonster, isAdjacentToEmpty
- [x] 3.5 `src/core/spawn.ts`を作成: createGameState, generateMonsterId, getMonsterTypeByNutrient
- [x] 3.6 `src/core/tick.ts`を作成: tick()オーケストレーション
- [x] 3.7 `simulation.ts`をre-exportファイルに変換（後方互換性）
- [x] 3.8 全テスト通過を確認

## 4. constants.ts参照をconfig参照に移行

- [x] 4.1 tick.ts内のconstants参照をstate.config参照に置換
- [x] 4.2 dig.ts内のconstants参照をstate.config参照に置換
- [x] 4.3 phase-transitions.ts内のconstants参照をstate.config参照に置換
- [x] 4.4 life-cycle.ts内のconstants参照をstate.config参照に置換
- [x] 4.5 movement-resolution.ts内のconstants参照をstate.config参照に置換
- [x] 4.6 nutrient.ts内のconstants参照をconfig引数に置換
- [x] 4.7 combat.ts内のconstants参照をconfig引数に置換
- [x] 4.8 hero/*.ts内のconstants参照をconfig引数に置換
- [x] 4.9 constants.tsのexportを削除（createDefaultConfig内部のみに）
- [x] 4.10 全テスト通過を確認

## 5. Config編集UI (FUTURE)

> 別changeで実装予定。delta specは openspec/specs/future/ に退避済み。

## 6. 非同期対戦 (FUTURE)

> 別changeで実装予定。delta specは openspec/specs/future/ に退避済み。

## 7. LLM勇者AI (FUTURE)

> 別changeで実装予定。delta specは openspec/specs/future/ に退避済み。
