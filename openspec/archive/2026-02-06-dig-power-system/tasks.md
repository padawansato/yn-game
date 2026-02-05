## 1. 型定義と定数

- [x] 1.1 `src/core/types.ts` の `GameState` に `digPower: number` を追加
- [x] 1.2 `src/core/constants.ts` に `INITIAL_DIG_POWER = 100` を追加

## 2. simulation.ts の更新

- [x] 2.1 `createGameState()` で `digPower` を初期化（デフォルト: `INITIAL_DIG_POWER`）
- [x] 2.2 `dig()` の先頭に digPower チェックを追加（0 なら `"insufficient dig power"` エラー）
- [x] 2.3 `dig()` 成功時に `state.digPower` を 1 減らす

## 3. テスト

- [x] 3.1 テスト: 初期状態で digPower が正しく設定される
- [x] 3.2 テスト: digPower > 0 で dig 成功時に digPower が 1 減る
- [x] 3.3 テスト: digPower = 0 で dig 失敗（"insufficient dig power"）
- [x] 3.4 テスト: dig 失敗時（位置エラーなど）は digPower が減らない
- [x] 3.5 既存の dig テストが壊れていないことを確認
