## 1. 型定義・定数

- [x] 1.1 `src/core/hero/types.ts` に HeroEntity, HeroState, HeroAttackPattern, HeroSpawnConfig 型を定義
- [x] 1.2 `src/core/types.ts` に GameState 拡張（heroes, entrancePosition, demonLordPosition, heroSpawnConfig, nextHeroId, isGameOver）と GameEvent 追加（HERO_SPAWNED, HERO_PARTY_ANNOUNCED, HERO_COMBAT, HERO_DIED, HERO_ESCAPED, DEMON_LORD_FOUND, GAME_OVER）
- [x] 1.3 `src/core/constants.ts` に勇者関連定数追加（HERO_LIFE, HERO_ATTACK, HERO_SPAWN_START_TICK, HERO_SPAWN_INTERVAL, HERO_ANNOUNCE_TICKS, HERO_NUTRIENT_DROP）
- [x] 1.4 型定義のユニットテスト（型の整合性確認）

## 2. 入口・魔王フラグ

- [x] 2.1 GameState初期化で entrancePosition（グリッド上部中央）を計算・設定
- [x] 2.2 GameState初期化で demonLordPosition を設定（デフォルトnull、プレイヤー配置方式に変更）
- [x] 2.3 入口・魔王フラグの初期化テスト

## 3. 勇者スポーン

- [x] 3.1 `src/core/hero/spawn.ts` に processHeroSpawns() 実装（タイミング判定、HeroEntity生成、HERO_SPAWNED イベント発行）
- [x] 3.2 パーティー予告イベント（HERO_PARTY_ANNOUNCED）の発行ロジック実装
- [x] 3.3 順次スポーン（HERO_SPAWN_INTERVAL 間隔）のロジック実装
- [x] 3.4 スポーンのユニットテスト（タイミング、順次出現、入口占有時も出現）

## 4. 勇者AI移動

- [x] 4.1 `src/core/hero/ai.ts` に calculateHeroMove() 実装（探索モード: 未踏優先、ランダム方向選択）
- [x] 4.2 バックトラック実装（全隣接セル踏破済みの場合、pathHistory を逆順に戻る）
- [x] 4.3 魔王発見ロジック（demonLordPosition 到達で state='returning', DEMON_LORD_FOUND イベント）
- [x] 4.4 帰還モード実装（pathHistory 逆順を辿る、1tick=1セル）
- [x] 4.5 探索AIのユニットテスト（前進、方向転換、バックトラック、魔王発見、帰還）

## 5. 戦闘システム

- [x] 5.1 `src/core/combat.ts` に processCombat() 実装（前方セル攻撃判定: 勇者→モンスター、モンスター→勇者）
- [x] 5.2 同時ダメージ解決の実装（全ダメージ計算後に一括適用）
- [x] 5.3 戦闘死亡処理（モンスター死亡: carryingNutrient の9セル放出、勇者死亡: HERO_NUTRIENT_DROP の外部追加）
- [x] 5.4 同一セル非攻撃ルールの実装（前方セルのみ攻撃対象）
- [x] 5.5 戦闘のユニットテスト（一方的攻撃、相互攻撃、相討ち、attack=0、同一セル非攻撃）

## 6. simulation.ts 統合

- [x] 6.1 tick() に processHeroSpawns() ステップ追加（既存フローの後）
- [x] 6.2 tick() に calculateHeroMoves() + 移動適用ステップ追加
- [x] 6.3 tick() に processCombat() ステップ追加
- [x] 6.4 tick() に帰還判定ステップ追加（HERO_ESCAPED → isGameOver = true）
- [x] 6.5 統合テスト（完全なtickフローで勇者スポーン→探索→戦闘→帰還→ゲームオーバー）

## 7. 既存システムとの整合

- [x] 7.1 pickaxe-interaction の勇者免疫実装（attackMonsterはMonster型のみ対象、型レベルで自然に守られている）
- [x] 7.2 nutrient-conservation の勇者死亡時外部追加実装（HERO_NUTRIENT_DROPを9セル分配）
- [x] 7.3 既存テストが引き続き通過することを確認（261テスト全通過）
