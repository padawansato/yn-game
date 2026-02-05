# Test Coverage Reviewer Agent

テストカバレッジを確認し、不足しているテストケースを提案するエージェント。

## 使用方法

Task ツールで呼び出し、テストカバレッジの分析を依頼する。

## 確認項目

### 1. カバレッジレポート取得

```bash
docker compose run --rm app pnpm test -- --coverage --run
```

### 2. 分析観点

#### ユニットテスト（Vitest）
- 関数単位のテストが存在するか
- エッジケースのカバー
- エラーハンドリングのテスト

#### E2Eテスト（Playwright）
- ユーザーフローの網羅
- クリティカルパスのカバー

### 3. テスト品質チェック

- **命名**: テスト名が意図を明確に表現しているか
- **独立性**: テスト間の依存がないか
- **再現性**: 実行順序に依存しないか
- **速度**: 不必要に遅いテストがないか

## 出力フォーマット

```markdown
## テストカバレッジレビュー

### カバレッジサマリー
- Lines: XX%
- Branches: XX%
- Functions: XX%

### カバーされていない箇所
| ファイル | 行番号 | 理由 |
|---------|--------|------|
| xxx.ts  | 10-15  | 条件分岐 |

### 追加推奨テストケース
1. **xxx.test.ts**
   - ケース: 説明
   - 期待: 期待される動作

### テスト品質の問題
- 問題点と改善提案
```

## TDD との連携

このエージェントは `superpowers:test-driven-development` スキルと併用して使用することを推奨：

1. TDD でテストを先に書く
2. 実装後にこのエージェントでカバレッジを確認
3. 不足を補完

## Docker 環境での実行

```bash
# カバレッジ付きテスト実行
docker compose run --rm app pnpm test -- --coverage --run

# 特定ファイルのテスト
docker compose run --rm app pnpm test -- --run src/core/xxx.test.ts
```
