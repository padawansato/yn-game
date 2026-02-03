## 1. ネスト確立条件の修正

- [x] 1.1 `canEstablishNest`関数を2×3マス条件に変更（stationary.ts）
- [x] 1.2 `has2x3Space`ヘルパー関数を追加（縦2×横3、または縦3×横2をチェック）
- [x] 1.3 ネスト確立のテストを更新（stationary.test.ts）

## 2. パトロール動作の修正

- [x] 2.1 `getAdjacentPositions`関数を追加（現在位置から4方向または8方向の隣接セル取得）
- [x] 2.2 `isWithinPatrolRange`関数を追加（ネストから2マス以内かチェック）
- [x] 2.3 `calculateStationaryMove`を1マスずつ移動に修正
- [x] 2.4 パトロール動作のテストを更新

## 3. 獲物追跡の修正

- [x] 3.1 `calculateStationaryMove`に`monsters`引数を追加
- [x] 3.2 パトロール位置選択時に獲物方向を優先するロジック追加
- [x] 3.3 `movement/index.ts`でstationaryパターンの共通獲物追跡をスキップ
- [x] 3.4 獲物追跡のテストを追加

## 4. 統合テストの修正

- [x] 4.1 integration.test.tsのモンスタースポーンテストを修正（nutrient閾値対応）
- [x] 4.2 全テストがパスすることを確認
