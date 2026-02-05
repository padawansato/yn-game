---
name: commit
description: Git CZ風のコミットメッセージを生成してコミットする
---

# Commit Skill

Git CZ 風のコミットメッセージを生成し、コミットを作成するスキル。

## 使用方法

`/commit` または `/commit -m "追加のコンテキスト"` で呼び出す。

## コミットメッセージフォーマット

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type（必須）

| タイプ | 説明 |
|--------|------|
| feat | 新機能 |
| fix | バグ修正 |
| docs | ドキュメントのみ |
| style | フォーマット（コードの動作に影響なし） |
| refactor | リファクタリング |
| perf | パフォーマンス改善 |
| test | テスト追加・修正 |
| build | ビルドシステム・依存関係 |
| ci | CI設定 |
| chore | その他（ビルドプロセス、補助ツール） |

### Scope（任意）

変更の影響範囲を示す：
- `core` - src/core/ 内の変更
- `simulation` - シミュレーション関連
- `movement` - 移動ロジック
- `predation` - 捕食システム
- `nutrient` - 養分システム
- `ui` - UI関連
- `test` - テスト関連
- `ci` - CI/CD関連

### Subject（必須）

- 命令形で記述（"add" not "added"）
- 先頭は小文字
- 末尾にピリオドなし
- 50文字以内

### Body（任意）

- 変更の理由と目的
- 72文字で折り返し

### Footer（任意）

- Breaking Changes
- Issue参照（Closes #123）

## ワークフロー

1. `git status` で変更を確認
2. `git diff` で差分を確認
3. `git log --oneline -5` で最近のコミットスタイルを確認
4. コミットメッセージを生成
5. ユーザーに確認を求める
6. 承認後、コミットを実行

## 例

```bash
# 機能追加
feat(movement): add diagonal movement support

# バグ修正
fix(predation): correct predator-prey relationship calculation

Fixes #42

# リファクタリング
refactor(core): extract common monster utilities

Split Monster class utilities into separate module
for better testability and reuse.

# ドキュメント
docs: update README with Docker commands

# テスト
test(nutrient): add edge case tests for consumption
```

## 注意事項

- コミット前に `docker compose run --rm app pnpm lint` が自動実行される（PostToolUse hook）
- セキュリティ上の理由から `.env` ファイルはコミットしない
- 大きな変更は小さなコミットに分割することを推奨
