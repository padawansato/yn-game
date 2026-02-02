# yn-game

## Git（GitHub Flow）

### ブランチ構成
- `main` - 常にデプロイ可能な状態
- `feature/<name>` - 機能開発用

### ワークフロー
1. `main` から `feature/<name>` を作成
2. 実装 → コミット → push
3. PR作成 → セルフレビュー → mainへマージ

### OpenSpecとの連携
- changeごとにfeatureブランチ: `feature/food-chain-system`
- アーカイブ時にmainへマージ

### コミットタイミング
1. **アーティファクト作成時** - proposal/spec/design/tasks作成後
2. **実装中** - 数タスク完了ごと（tasks.md更新と同期）
3. **アーカイブ時** - change完了後、mainへマージ

### git管理対象
- `openspec/` 全体をgit管理（.gitignoreに追加しない）

### コミットメッセージ例
- `OpenSpec: Add proposal for <change-name>`
- `Implement: <機能> (task X.X-X.X)`
- `Archive: <change-name> (YYYY-MM-DD)`

### バージョン管理（タグ）
- Semantic Versioning: `vMAJOR.MINOR.PATCH`
- リリース時: `git tag v0.1.0` → `git push --tags`
- v1.0.0 未満は開発版

## その他
### ファイル削除
rm -rf ではなく mv ~/.Trash を推奨
