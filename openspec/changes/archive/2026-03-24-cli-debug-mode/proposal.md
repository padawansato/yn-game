## Why

ブラウザUIでのデバッグは、特定シナリオの再現が困難で開発効率が低い。CLIで対話的にゲームを操作できれば、1tickずつステップ実行・状態確認・コマンドで掘削など、コアロジックの検証が格段に速くなる。今後のAI挙動・進化システム開発でも検証基盤として使い回せる。

## What Changes

- CLI対話モード（REPL）の追加: コマンド入力でゲームを操作
- ASCIIグリッド表示: ターミナルでゲーム盤面を可視化
- 固定乱数（seed指定）: 再現可能なデバッグセッション
- コマンド体系: `dig x,y`, `tick [N]`, `status`, `monsters`, `scenario <name>` 等
- 既存の `src/debug.ts` シナリオスクリプトをCLIモードから呼び出し可能に

## Capabilities

### New Capabilities
- `cli-repl`: CLI対話モード（REPL）。コマンド解析、ゲーム操作、状態表示
- `cli-display`: ASCIIグリッド表示、モンスター状態表示、イベントログ

### Modified Capabilities
（既存specの要件変更なし。コアロジックはそのまま利用）

## Impact

- 新規ファイル: `src/cli.ts`（エントリーポイント）、`src/cli/` ディレクトリ
- 依存追加: Node.js readline（標準ライブラリ、追加パッケージ不要）
- 実行方法: `docker compose run --rm app pnpm exec tsx src/cli.ts`
- 既存コードへの影響: なし（`src/core/` を読み取り専用で利用）
