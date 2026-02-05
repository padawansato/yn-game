## Context

現在の実装:
- `tick()` は手動呼び出し
- App.vue で `setInterval` を使った簡易的な Auto 機能がある
- `GameState` にはゲーム時間の概念がない

## Goals / Non-Goals

**Goals:**
- `GameLoop` クラスを作成してゲームループをカプセル化
- `GameState` に `gameTime` と `isPaused` を追加
- 一定間隔での自動 tick 実行
- 一時停止/再開機能

**Non-Goals:**
- 可変速度（固定間隔のみ）
- フレームレート同期（単純な setInterval）
- サーバーサイド同期

## Decisions

### 1. GameLoop の実装方式

**決定**: クラスベースの `GameLoop` を作成

```typescript
class GameLoop {
  constructor(
    private state: GameState,
    private onTick: (state: GameState) => GameState,
    private tickInterval: number = 500
  )

  start(): void
  stop(): void
  pause(): void
  resume(): void
  isRunning(): boolean
}
```

**理由**:
- 状態とロジックのカプセル化
- テストしやすい
- 将来の拡張に対応可能

**代替案**:
- 関数ベース → 状態管理が複雑になる
- Vue の composable → コアロジックが Vue に依存する

### 2. gameTime の型

**決定**: `number` 型（整数、tick 回数）

**理由**:
- シンプルで十分
- tick ごとに +1 でインクリメント

### 3. isPaused の位置

**決定**: `GameState` ではなく `GameLoop` クラス内で管理

**理由**:
- pause/resume はゲームループの責任
- GameState は純粋なゲームデータのみ

### 4. 既存の Auto 機能との統合

**決定**: App.vue の既存 Auto 機能を GameLoop に置き換え

**理由**:
- 重複を避ける
- 一貫した API

## Risks / Trade-offs

**[Risk] setInterval の精度** → ゲームの性質上、厳密なタイミングは不要。許容範囲。

**[Trade-off] isPaused を GameState に含めない** → シリアライズ時に状態が失われる可能性があるが、現時点では問題なし。
