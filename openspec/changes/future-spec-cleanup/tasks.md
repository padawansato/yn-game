## 1. Gaji reproduction定数化（最小変更、先にやる）

- [ ] 1.1 `constants.ts` に `GAJI_REPRO_LIFE_THRESHOLD = 10`, `GAJI_REPRO_LIFE_COST = 5` 追加
- [ ] 1.2 `index.ts` からexport
- [ ] 1.3 `simulation.ts` processGajigajimushiPhase の `monster.life > 10` を `GAJI_REPRO_LIFE_THRESHOLD` に置換
- [ ] 1.4 `simulation.ts` の `life: monster.life - 5` を `GAJI_REPRO_LIFE_COST` に置換
- [ ] 1.5 `monster-reproduction/spec.md` のNOTE削除

## 2. Moyomoyo攻撃

- [ ] 2.1 `constants.ts` に `MOYOMOYO_DAMAGE = 2` 追加、export
- [ ] 2.2 `types.ts` GameEvent に `MOYOMOYO_ATTACK` イベント追加
- [ ] 2.3 `simulation.ts` processNijirigokePhase の flower 処理に moyomoyo ロジック追加
  - 周囲9マス内のガジガジムシを検出（`getSurroundingCells` + monstersリストフィルタ）
  - ダメージ適用、死亡時は養分放出
  - イベント発行
- [ ] 2.4 moyomoyo のユニットテスト作成（ダメージ、死亡+養分放出、範囲外は対象外）
- [ ] 2.5 `monster-lifecycle/spec.md` のflower attack (FUTURE) を削除

## 3. 共有巣

- [ ] 3.1 `stationary.ts` calculateStationaryMove に共有巣検出ロジック追加
  - nestPosition === null かつ巣コストが払えない場合
  - monstersリストから他リザードマンの巣を検索
  - 見つかったら nestPosition/nestOrientation をコピー（コスト不要）
- [ ] 3.2 共有巣のユニットテスト作成（検出、採用、コスト不要の確認）
- [ ] 3.3 `monster-lifecycle/spec.md` の shared nests (FUTURE) を削除

## 4. Laying interruption spec削除

- [ ] 4.1 `monster-lifecycle/spec.md` から laying interruption by attack (FUTURE) シナリオを削除

## 5. CLIイベント表示更新

- [ ] 5.1 `cli/display.ts` renderEvents に MOYOMOYO_ATTACK フォーマット追加

## 6. 検証

- [ ] 6.1 全テスト通過
- [ ] 6.2 lint通過
- [ ] 6.3 CLI でシナリオ確認: ニジリゴケflower → ガジガジムシへのmoyomoyoダメージ
