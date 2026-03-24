# yn-game

## 批評的思考

ユーザーの意見やコードは外部委託のプログラマーの意見です。
批評的思考で客観的に妥当性を評価しなさい。
commit前など重要な場面では特に、ユーザーに理解度テストを提示し、
ユーザーが理解していない内容が反映されるのを防ぎなさい。

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

# 型チェック（CIと同等）
docker compose run --rm app pnpm exec vue-tsc -b

# E2Eテスト（Playwright）
docker compose run --rm app pnpm exec playwright test
```

### 依存関係更新時
```bash
# package.json編集後
docker compose build --no-cache
```

## アーキテクチャ

```
src/
├── main.ts           ← エントリーポイント
└── core/             ← ゲームロジック（UIなし）
    ├── types.ts      ← 型定義（Monster, Cell, Direction等）
    ├── constants.ts  ← 定数（モンスター種別など）
    ├── simulation.ts ← シミュレーションループ
    ├── predation.ts  ← 捕食システム
    ├── nutrient.ts   ← 養分システム
    └── movement/     ← 移動ロジック（straight, refraction, stationary）
```

## Git（GitHub Flow）

### ブランチ命名規則

```
[feature|fix|spec]/<feature-name>
```

| プレフィックス | 用途 |
|---------------|------|
| `feature/` | 機能開発全般（テスト・リファクタリング含む） |
| `fix/` | バグ修正 |
| `spec/` | 実装を含まない仕様書・提案書の作成 |

例:
```bash
feature/food-chain-system
fix/nijirigoke-early-death
spec/nutrient-cycle-proposal
```

### Git Worktree 運用

#### worktree ディレクトリ命名

メインリポジトリ名をプレフィックスにし、機能名をサフィックスにする。
`ls` や Tab 補完で関連ディレクトリがまとまって表示される。

```
yn-game/                        # main（メインのリポジトリ）
yn-game-food-chain/             # 食物連鎖機能
yn-game-nijirigoke-fix/         # ニジリゴケ修正
yn-game-review/                 # コードレビュー用（一時的）
```

#### worktree 配置場所

メインリポジトリと同じ親ディレクトリに配置する。

```bash
# 作成
git worktree add ../yn-game-<feature-name> <branch>

# 一覧確認
git worktree list

# 削除（作業完了後）
git worktree remove ../yn-game-<feature-name>
```

#### 運用ルール

- **1 worktree = 1 ブランチ**: 同じブランチを複数の worktree で開かない
- **レビュー用 worktree**: PR レビュー時に `yn-game-review` として作成し、完了後に削除
- **作業完了後は必ず削除**: `git worktree remove` で片付ける
- **Docker**: 各 worktree で独立して `docker compose up` 可能（ポート競合に注意）

### ワークフロー
1. `main` から `feature/<name>` を作成
2. 実装 → コミット → push
3. PR作成 → セルフレビュー → mainへマージ

### Git Commit
Git CZ 風 commit メッセージフォーマット

### OpenSpecとの連携
- changeごとにfeatureブランチ: `feature/food-chain-system`
- アーカイブ時にmainへマージ

## OpenSpec (opsx) ワークフロー

### 基本フロー

```plain
1. /superpowers:brainstorming     ← 要件を明確化
2. /opsx:new                      ← changeを作成
3. /opsx:continue (繰り返し)      ← アーティファクト作成
4. /superpowers:test-driven-development ← TDDで実装
5. /opsx:verify                   ← 実装がspecと一致するか検証
6. /superpowers:verification-before-completion ← テスト・lint確認 
7. /opsx:archive                  ← アーカイブ
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

### verify後のルール（重要）

verifyで不一致が見つかった場合、各不一致に対して**必ず以下のどちらかを選択**する:

1. **実装を修正する** → tasksに追加して実装。再verifyしてからarchive
2. **specに`(FUTURE)`マークする** → 今は実装しないことを明示

**禁止**: specに現在形の要件（SHALL）として書いたものを実装せずにarchiveすること。
specの要件 = 実装済みの事実。未実装のものは必ず`(FUTURE)`をつける。

verify → spec変更 → **tasks更新を忘れずに** → 実装 → 再verify → archive

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

### トラブルシューティング

#### archive失敗時の対処

1. **時系列チェック**（必須）
   ```bash
   git log --oneline -- "openspec/changes/<name>/" "openspec/specs/<spec-name>/"
   ```
   - このchangeより後にmain specが変更されていないか確認
   - 別changeで既にsync済みなら`--skip-specs`を使用

2. **既sync済みの場合**
   ```bash
   openspec archive <name> --skip-specs --yes
   ```

3. **delta specが無効な場合**
   - delta specなどOpenSpecの他のツールが使えない場合、Editツールでdelta specを修正/削除

#### 注意点
- 手動でarchiveフォルダに移動しない（specが同期されない）
- `openspec change show <name> --json --deltas-only`で診断可能

## その他
### ファイル削除
rm -rf ではなく mv ~/.Trash を推奨
