## Context

現在の `dig()` 関数は掘削操作に何の制限もない。オリジナルの勇なまでは「掘りパワー」という有限リソースがあり、プレイヤーは計画的に掘削する必要がある。この変更は、後続の realtime-simulation や async-game-actions への基盤となる。

現在の実装:
- `GameState` は `grid`, `monsters`, `totalInitialNutrients` を持つ
- `dig()` は位置チェック、土ブロックチェック、空きセル隣接チェックのみ

## Goals / Non-Goals

**Goals:**
- `GameState` に `digPower` フィールドを追加
- 掘削時に digPower を消費
- digPower が 0 の場合に掘削を拒否
- 初期 digPower を定数で設定可能に

**Non-Goals:**
- digPower の回復メカニズム（別の change で対応）
- digPower の UI 表示（UI 層の責任）
- digPower 消費量のカスタマイズ（現時点では常に 1）

## Decisions

### 1. digPower の型と初期値

**決定**: `number` 型、初期値 100

**理由**:
- オリジナルの勇なまに近い値
- 後で調整可能（定数として管理）
- 整数で十分（小数は不要）

**代替案**:
- `{ current: number, max: number }` オブジェクト → 現時点では max は不要、YAGNI
- リソースクラス → オーバーエンジニアリング

### 2. エラー戻り値

**決定**: 既存のエラー形式 `{ error: string }` を踏襲し、`"insufficient dig power"` を追加

**理由**:
- 既存のエラーパターンと一貫性
- 呼び出し側のコード変更が最小限

### 3. digPower チェックのタイミング

**決定**: `dig()` 関数の最初でチェック（他のバリデーションより前）

**理由**:
- 掘りパワーがないのに詳細なエラー（"Position out of bounds" など）を返すのは UX として不自然
- 早期リターンで無駄な処理を避ける

## Risks / Trade-offs

**[Risk] 既存テストの破壊** → テストで `digPower` を明示的に設定する必要がある。`createGameState()` にデフォルト値を設定することで軽減。

**[Trade-off] digPower = 0 での dig 試行はエラー** → 呼び出し側で事前チェックが必要になるが、これは意図した設計（リソース管理をゲームの一部として強制）。

**[Trade-off] 消費量は常に 1** → 柔軟性は低いが、シンプルで予測可能。必要になったら拡張。
