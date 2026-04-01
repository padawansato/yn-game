# バージョン管理ルール

## Semantic Versioning

`vMAJOR.MINOR.PATCH` (v1.0.0未満は開発版)

- **MINOR**: 新機能追加（例: 勇者システム導入 → v0.1.0 → v0.2.0）
- **PATCH**: バグ修正・調整（例: 即スポーン修正 → v0.1.1）

## マージ後のタグ付け

PRがmainにマージされたら:

1. `git checkout main && git pull`
2. 変更内容に応じて MINOR or PATCH を判断
3. `git tag vX.Y.Z && git push --tags`

## PRとの対応

- 機能PR（feature/）→ MINOR バンプ
- 修正PR（fix/）→ PATCH バンプ
- 仕様PR（spec/）→ タグ付けしない（実装変更なし）
- 複数PRをまとめてタグ付けしない。各マージごとにタグを打つ

## ドキュメント図のバージョン管理

### 対応バージョンの明記

`docs/diagrams/` の各図ファイルには、対応するコードバージョンをファイル先頭に記載する:

```markdown
<!-- Based on: v0.4.2 -->
# タイトル
```

### spec変更時の図の更新確認

specを変更するPRでは、関連する `docs/diagrams/` の図が影響を受けないか確認する。
影響がある場合は同じPRで図も更新し、`Based on` のバージョンを更新する。
