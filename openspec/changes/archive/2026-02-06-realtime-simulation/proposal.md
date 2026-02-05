## Why

現在の実装では `tick()` を手動で呼び出す必要があり、オリジナルの勇なまのようなリアルタイムゲーム体験ができない。シミュレーションを時間ベースで自動進行させることで、モンスターが自律的に動き、プレイヤーはその合間に掘削を行うという本来のゲームプレイが実現できる。

## What Changes

- ゲームループ機能を追加（一定間隔で `tick()` を自動実行）
- `GameState` に `gameTime`（経過ティック数）と `isPaused`（一時停止状態）を追加
- ゲームの開始/一時停止/再開機能
- tick 間隔の設定（デフォルト: 500ms）

## Capabilities

### New Capabilities

- `game-loop`: ゲームループの管理。自動 tick 実行、一時停止/再開、ゲーム時間追跡を含む。

### Modified Capabilities

（なし - 新規機能のみ）

## Impact

- **新規ファイル**: `src/core/game-loop.ts` - ゲームループクラス
- **変更ファイル**:
  - `src/core/types.ts` - `GameState` に `gameTime`, `isPaused` 追加
  - `src/App.vue` - ゲームループ統合、UI 更新
- **既存機能への影響**: 現在の Auto ボタンをゲームループに置き換え
