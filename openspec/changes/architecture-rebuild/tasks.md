## 1. GameConfig型定義とデフォルト値

- [ ] 1.1 `src/core/config.ts`を作成: GameConfig, MonsterTypeConfig型定義
- [ ] 1.2 `createDefaultConfig()`を実装: constants.tsの値をGameConfigに変換
- [ ] 1.3 `validateConfig()`を実装: 正数チェック、predationTargets参照チェック
- [ ] 1.4 config.tsのテストを作成: デフォルト値一致、バリデーション、serialization round-trip

## 2. GameStateへのconfig注入

- [ ] 2.1 `types.ts`のGameStateにconfig: GameConfigフィールドを追加
- [ ] 2.2 `spawn.ts`（後述の分割後）のcreateGameState()にconfig引数を追加、デフォルト注入
- [ ] 2.3 既存テストのGameState生成ヘルパーにcreateDefaultConfig()を追加
- [ ] 2.4 全テスト通過を確認

## 3. simulation.ts分割

- [ ] 3.1 `src/core/movement-resolution.ts`を作成: calculateAllMoves, resolveConflicts, applyMovements
- [ ] 3.2 `src/core/life-cycle.ts`を作成: decreaseLifeForMoved, processNestEstablishment
- [ ] 3.3 `src/core/phase-transitions.ts`を作成: processPhaseTransitions, 3種phase関数, applyMoyomoyoAttacks
- [ ] 3.4 `src/core/dig.ts`を作成: dig, attackMonster, isAdjacentToEmpty
- [ ] 3.5 `src/core/spawn.ts`を作成: createGameState, generateMonsterId, getMonsterTypeByNutrient
- [ ] 3.6 `src/core/tick.ts`を作成: tick()オーケストレーション
- [ ] 3.7 `simulation.ts`をre-exportファイルに変換（後方互換性）
- [ ] 3.8 全テスト通過を確認

## 4. constants.ts参照をconfig参照に移行

- [ ] 4.1 tick.ts内のconstants参照をstate.config参照に置換
- [ ] 4.2 dig.ts内のconstants参照をstate.config参照に置換
- [ ] 4.3 phase-transitions.ts内のconstants参照をstate.config参照に置換
- [ ] 4.4 life-cycle.ts内のconstants参照をstate.config参照に置換
- [ ] 4.5 movement-resolution.ts内のconstants参照をstate.config参照に置換
- [ ] 4.6 nutrient.ts内のconstants参照をconfig引数に置換
- [ ] 4.7 combat.ts内のconstants参照をconfig引数に置換
- [ ] 4.8 hero/*.ts内のconstants参照をconfig引数に置換
- [ ] 4.9 constants.tsのexportを削除（createDefaultConfig内部のみに）
- [ ] 4.10 全テスト通過を確認

## 5. Config編集UI

- [ ] 5.1 App.vueにconfig編集パネルを追加（モンスターパラメータ編集）
- [ ] 5.2 ゲーム設定（grid, nutrient, dig, hero）の編集UIを追加
- [ ] 5.3 バリデーションエラー表示を実装
- [ ] 5.4 localStorageプリセット保存/読み込み/削除を実装
- [ ] 5.5 JSON export（テキスト表示+コピー）を実装
- [ ] 5.6 JSON import（テキスト貼り付け+バリデーション+読み込み）を実装
- [ ] 5.7 ブラウザで動作確認

## 6. 非同期対戦

- [ ] 6.1 スコア計算を実装（gameTimeベース）
- [ ] 6.2 ゲームオーバー時のスコア表示UIを追加
- [ ] 6.3 Battle dataエクスポートを実装（config + score + seed のJSON）
- [ ] 6.4 Battle dataインポート（チャレンジモード）を実装
- [ ] 6.5 スコア比較表示（元スコア vs 自分のスコア）を実装
- [ ] 6.6 ブラウザで動作確認

## 7. LLM勇者AI

- [ ] 7.1 HeroAIStrategy interfaceを定義
- [ ] 7.2 RuleBasedAIクラスを実装（既存calculateHeroMoveをラップ）
- [ ] 7.3 tick.tsのhero処理をstrategy経由に変更
- [ ] 7.4 GameConfigにhero.aiTypeフィールドを追加
- [ ] 7.5 GameStateをプロンプトに変換する関数を実装
- [ ] 7.6 LlmAIクラスを実装（API呼び出し+レスポンスパース）
- [ ] 7.7 API失敗時のrule-basedフォールバックを実装
- [ ] 7.8 APIキー入力UIを追加（localStorage保存）
- [ ] 7.9 テスト: RuleBasedAI動作等価性、フォールバック動作
- [ ] 7.10 ブラウザで動作確認
