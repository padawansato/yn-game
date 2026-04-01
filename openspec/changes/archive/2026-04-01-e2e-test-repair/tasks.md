## 1. Playwright基盤修復

- [x] 1.1 `compose.yaml` の e2e サービスを修正（Playwrightイメージバージョン合わせ、pnpm使用）
- [x] 1.2 `package.json` に `e2e` スクリプト追加
- [x] 1.3 `docker compose --profile e2e run --rm e2e` でPlaywrightが起動することを確認

## 2. Page Object Model

- [x] 2.1 `e2e/helpers/game-page.ts` を作成（セレクタマッピング、goto/waitForLoad）
- [x] 2.2 セル操作メソッド追加（clickCell, getCellNutrient, getCellContent）
- [x] 2.3 ゲーム制御メソッド追加（advanceTicks, runScenario）
- [x] 2.4 モンスター・勇者・ステータス系ロケーター追加

## 3. nutrient-system.spec.ts 修正

- [x] 3.1 8.2.1: dig→spawn テストを正しいセレクタで書き換え
- [x] 3.2 8.2.2: dig 0養分テストを書き換え
- [x] 3.3 8.2.3: ニジリゴケ移動テストを書き換え（シナリオ使用、Tickボタン制御）
- [x] 3.4 8.2.4: ステータス表示テストを書き換え
- [x] 3.5 8.3: 養分→モンスター種別テストを書き換え
- [x] 3.6 全5テスト通過を確認

## 4. hero-system.spec.ts 追加

- [x] 4.1 魔王配置テスト（勇者を呼ぶボタン→空セルクリック→demon-lord-cell出現）
- [x] 4.2 勇者スポーンテスト（魔王配置後、Tick進行→hero-cell出現）
- [x] 4.3 戦闘イベントテスト（モンスター隣接→イベントログ確認）
- [x] 4.4 ゲームオーバーテスト（魔王発見→帰還→game-over-banner表示）
- [x] 4.5 つるはし免疫テスト（勇者セルクリック→HP変化なし）
- [x] 4.6 全5テスト通過を確認

## 5. nijirigoke-scenario.spec.ts 追加

- [x] 5.1 フェーズ遷移観察テスト（各フェーズが複数tick持続）
- [x] 5.2 全フェーズ通過テスト（mobile→bud→flower→withered順序確認）
- [x] 5.3 全2テスト通過を確認

## 6. 全体検証

- [x] 6.1 全E2Eテスト（12件）一括通過を確認
- [x] 6.2 ユニットテスト（286件）に影響がないことを確認
- [x] 6.3 lint通過を確認
