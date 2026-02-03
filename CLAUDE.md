# yn-game

## 開発環境

**Docker内で統一**（ローカルにnode_modulesを置かない）

```bash
# 開発サーバー起動（http://localhost:5173）
docker compose up

# テスト実行
docker compose run --rm app pnpm test

# 特定テストのみ
docker compose run --rm app pnpm test -- --run <path>

# lint / format
docker compose run --rm app pnpm lint
docker compose run --rm app pnpm format
```

### 依存関係更新時
```bash
# package.json編集後
docker compose build --no-cache
```

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

## OpenSpec (opsx) ワークフロー

### 基本フロー
```
opsx:new → opsx:continue (繰り返し) → 実装 → opsx:archive
```

### 各コマンドの役割
| コマンド | 目的 |
|---------|------|
| `opsx:new <name>` | 新しいchangeを作成 |
| `opsx:continue` | 次のアーティファクトを作成（proposal → specs → design → tasks） |
| `opsx:ff` | 全アーティファクトを一気に作成 |
| `opsx:archive` | **sync + アーカイブ**（main specs更新 + フォルダ移動） |
| `opsx:sync` | syncのみ（main specs更新、changesに残す）※特殊ケース用 |

### ディレクトリ構造
```
openspec/
├── specs/           ← メインのスペック（プロジェクト全体の仕様）
├── changes/         ← 作業中の変更
│   └── <name>/
│       ├── proposal.md
│       ├── specs/   ← delta specs（この変更で追加/修正する仕様）
│       ├── design.md
│       └── tasks.md
└── archive/         ← 完了した変更
```

### sync vs archive
- **archive**: 通常はこれだけでOK（sync + アーカイブを一括実行）
- **sync**: changesに残したままmain specsだけ更新したい場合

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
