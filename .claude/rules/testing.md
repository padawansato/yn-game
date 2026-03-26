---
paths:
  - "src/**/*.ts"
  - "src/**/*.vue"
---

# テスト検証ルール

## 実装時の必須検証

1. **テスト実行**: 実装後は必ず `docker compose run --rm app pnpm test` で全テスト通過を確認
2. **lint**: `docker compose run --rm app pnpm lint` でエラーがないこと
3. **ブラウザ動作確認**: UI変更時は `docker compose up` でブラウザから実際にプレイして動作確認。スクリーンショットやコンソールログで検証する
4. **staleファイル注意**: `.js`, `.d.ts` がsrc/以下に残っているとViteが誤って読み込む。`find src -name "*.js" -o -name "*.d.ts"` で確認し、あれば削除

## TDD

- テストを先に書く（RED） → 最小実装（GREEN） → リファクタ
- Agent Teamsで並列実装する場合も、各チームメイトがTDDサイクルを守ること

## コミット前チェックリスト

- [ ] 全テスト通過
- [ ] lint通過
- [ ] UI変更がある場合、ブラウザで動作確認済み
- [ ] stale .js/.d.ts ファイルがないこと
