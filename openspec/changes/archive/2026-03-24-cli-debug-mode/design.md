## Context

yn-game のコアロジック（`src/core/`）はUI非依存で設計されており、`tick()`, `dig()`, `createGameState()` 等の関数を直接呼び出せる。現在 `src/debug.ts` に固定シナリオのデバッグスクリプトがあるが、対話的な操作はできない。

## Goals / Non-Goals

**Goals:**
- ターミナルから対話的にゲームを操作できるREPL
- 1tickずつステップ実行、状態確認、掘削などの基本操作
- 固定seed乱数で再現可能なセッション
- 既存のシナリオ（debug.ts相当）をCLIから呼び出し可能

**Non-Goals:**
- リッチなTUI（ncurses的なもの）は不要。printベースで十分
- ブラウザUIの置き換えではない
- ゲームの保存/ロード機能
- パフォーマンス最適化

## Decisions

### 1. エントリーポイント: `src/cli.ts`

単一ファイルで完結。複雑になったら `src/cli/` に分割。
Node.js標準の `readline` を使用し、追加パッケージ不要。

**代替案:** inquirer.js等のライブラリ → 依存追加のコストに見合わない

### 2. コマンド体系

```
dig <x>,<y>         掘削
tick [N]             N tick進める（デフォルト1）
run                  自動実行（Ctrl+Cで停止）
stop                 自動実行停止
status               ゲーム状態サマリ
grid                 ASCIIグリッド表示
monsters [type]      モンスター一覧
monster <id>         特定モンスター詳細
scenario <name>      プリセットシナリオをロード
seed <number>        乱数seedを設定
reset                ゲームリセット
help                 コマンド一覧
quit                 終了
```

**代替案:** サブコマンド形式（`game tick`, `game dig`） → REPLとしてはシンプルな方が使いやすい

### 3. 表示方式

ASCIIグリッドは `src/debug.ts` の `printGrid()` を流用・拡張。
モンスターは2文字記号（Nj, Gj, Lz, 卵, etc.）で表示。
tick毎のイベントは自動表示。

### 4. シナリオ機能

`src/debug.ts` のシナリオ関数をモジュール化し、CLIから名前指定で呼び出し。
`scenario list` でシナリオ一覧表示。

### 5. 固定乱数

`src/debug.ts` の `createSeededRandom()` を共有ユーティリティに移動。
デフォルトseed=42。`seed <N>` で変更可能。

## Risks / Trade-offs

- **[Risk] readline はシンプルすぎる** → 目的がデバッグ用なので十分。将来richなTUIが必要になったら別changeで対応
- **[Risk] Docker内での対話入力** → `docker compose run --rm -it app pnpm exec tsx src/cli.ts` で `-it` フラグが必要。CLAUDE.mdに記載
- **[Risk] debug.tsとの重複** → シナリオ関数を共有モジュールに切り出して重複解消
