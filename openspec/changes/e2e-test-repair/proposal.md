## Why

E2Eテスト (`e2e/nutrient-system.spec.ts`) が作成時（2026-02-05, ce96d89）から一度も通っていない。存在しないCSSセレクタ（`.game-container`, `.cell.soil`, `.entity.monster`）を使用しており、Playwright実行環境もDocker上で正常に動作しない。これにより `hero-system` と `nijirigoke-scenario-too-fast` の2つのOpenSpec changeのverify/アーカイブがブロックされている。(GitHub issue #29)

## What Changes

- Docker Compose の `e2e` サービスを修正（Playwrightバージョン不一致、npm→pnpm）
- Page Object Model (`e2e/helpers/game-page.ts`) を新規作成し、CSSセレクタを一元管理
- `e2e/nutrient-system.spec.ts` を現在のApp.vue DOM構造に合わせて全面書き換え
- `e2e/hero-system.spec.ts` を新規作成（魔王配置・勇者スポーン・戦闘・ゲームオーバー）
- `e2e/nijirigoke-scenario.spec.ts` を新規作成（フェーズ遷移の観察可能性・各フェーズのtick数計測）
- `package.json` に `e2e` スクリプト追加

## Capabilities

### New Capabilities

- `e2e-test-infrastructure`: Playwright E2E テストの実行基盤（Docker Composeサービス、Page Object Model、テスト実行スクリプト）
- `e2e-nutrient-system`: 養分システムのE2E検証（dig→スポーン、養分によるモンスター種別分岐、ステータス表示）
- `e2e-hero-system`: 勇者システムのE2E検証（魔王配置、スポーン、戦闘、ゲームオーバー、つるはし免疫）
- `e2e-nijirigoke-scenario`: ニジリゴケ変態シナリオのE2E検証（フェーズ遷移timing、全フェーズ通過）

### Modified Capabilities

（なし — 既存のゲームロジック仕様に変更なし。テスト追加のみ）

## Impact

- `compose.yaml` — e2eサービスの設定修正
- `package.json` — e2eスクリプト追加
- `e2e/` — テストファイル3件 + ヘルパー1件
- `playwright.config.ts` — 微調整（必要に応じて）
- ゲームロジック (`src/core/`) への変更なし
- CI (`.github/workflows/ci.yml`) への変更は本changeのスコープ外
