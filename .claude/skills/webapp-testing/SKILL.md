---
name: webapp-testing
description: Playwright E2Eテストの作成・実行を支援
---

# Webapp Testing Skill

Playwright を使用した E2E テストの作成と実行を支援するスキル。

## 使用場面

- 新しい E2E テストを追加する
- 既存のテストを修正する
- テスト失敗の原因を調査する

## Docker 環境でのコマンド

```bash
# 全 E2E テスト実行
docker compose run --rm app pnpm exec playwright test

# 特定テストのみ
docker compose run --rm app pnpm exec playwright test tests/example.spec.ts

# ヘッドレスモードで実行（CI用）
docker compose run --rm app pnpm exec playwright test --reporter=list

# デバッグモード（ローカル開発時は注意）
docker compose run --rm app pnpm exec playwright test --debug
```

## テストファイル構成

```
tests/
├── example.spec.ts     ← 基本的な E2E テスト
└── fixtures/           ← テスト用データ
```

## テスト作成ガイドライン

### 1. ファイル命名
- `<feature>.spec.ts` の形式

### 2. テスト構造

```typescript
import { test, expect } from '@playwright/test';

test.describe('機能名', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('ユーザーアクションの説明', async ({ page }) => {
    // Arrange
    // Act
    // Assert
  });
});
```

### 3. セレクタ戦略
- `data-testid` を優先
- テキストコンテンツは補助的に使用
- CSS セレクタは最終手段

### 4. 待機処理
- 明示的な待機より `expect` の自動待機を活用
- `page.waitForSelector` は必要な場合のみ

## トラブルシューティング

### テストがタイムアウトする
```bash
# タイムアウト延長
docker compose run --rm app pnpm exec playwright test --timeout=60000
```

### 要素が見つからない
1. ページが完全にロードされているか確認
2. セレクタが正しいか確認
3. 要素が表示状態か確認

## CI/CD 連携

GitHub Actions での実行は `.github/workflows/` で設定済み。
ローカルと同じ Docker 環境で実行される。
