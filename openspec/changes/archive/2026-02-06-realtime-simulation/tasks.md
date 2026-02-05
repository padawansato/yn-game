## 1. 型定義

- [x] 1.1 `src/core/types.ts` の `GameState` に `gameTime: number` を追加

## 2. GameLoop 実装

- [x] 2.1 `src/core/game-loop.ts` を新規作成
- [x] 2.2 GameLoop クラスを実装（start, stop, pause, resume, isRunning）
- [x] 2.3 tick 実行時に gameTime をインクリメント

## 3. App.vue 統合

- [x] 3.1 既存の Auto 機能を GameLoop に置き換え
- [x] 3.2 UI に gameTime を表示
- [x] 3.3 Pause/Resume ボタンを追加

## 4. テスト

- [x] 4.1 GameLoop のユニットテスト作成
- [x] 4.2 gameTime インクリメントのテスト
- [x] 4.3 pause/resume のテスト

## 5. 検証

- [x] 5.1 ブラウザで自動 tick 動作を確認
- [x] 5.2 pause/resume が正しく動作することを確認
