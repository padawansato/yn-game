## 1. 型定義の変更

- [x] 1.1 types.tsからNutrient型を削除
- [x] 1.2 GameStateからnutrients配列を削除
- [x] 1.3 Monster.carryingNutrientを`string | null`から`number`に変更
- [x] 1.4 constants.tsにNUTRIENT_CARRY_CAPACITY追加（デフォルト10）

## 2. nutrient.ts の再実装

- [x] 2.1 Nutrient関連の関数を削除（pickupNutrient, depositNutrient, createNutrient, canPlaceNutrient, generateNutrientId, resetNutrientIdCounter）
- [x] 2.2 `absorbNutrient`関数を実装：土から養分を吸収
- [x] 2.3 `releaseNutrient`関数を実装：土へ養分を吐き出し
- [x] 2.4 `releaseNutrientsOnDeath`関数を実装：死亡時に隣接土へ分配
- [x] 2.5 `getAdjacentSoilCells`ヘルパー関数を実装
- [x] 2.6 getTotalNutrientsを修正：nutrients配列ではなくmonster.carryingNutrientを集計

## 3. movement の修正

- [x] 3.1 straight.tsのcalculateStraightMoveからnutrientInteraction関連を削除
- [x] 3.2 移動後の吸収/吐き出しロジックを追加（simulation.tsで実装）
- [x] 3.3 MoveResult型からnutrientInteraction, nutrientIdを削除

## 4. simulation.ts の修正

- [x] 4.1 applyMovementsからNutrient関連コードを削除
- [x] 4.2 dig関数からNutrientエンティティ生成を削除
- [x] 4.3 tick関数に吸収/吐き出し処理を追加（processNutrientInteractions）
- [x] 4.4 死亡時の養分散布処理を追加（decreaseLifeForMoved, processPredation）

## 5. index.ts の修正

- [x] 5.1 Nutrient関連のexportを削除
- [x] 5.2 新しい関数のexportを追加

## 6. UI の修正

- [x] 6.1 App.vueからNutrient表示を削除
- [x] 6.2 getEntitiesAtCellからnutrient関連を削除
- [x] 6.3 EntityType型からnutrientを削除
- [x] 6.4 重なりカウントをモンスターのみに変更

## 7. テストの修正

- [x] 7.1 nutrient.test.tsを新仕様に書き換え
- [x] 7.2 simulation.test.tsからNutrient関連テストを削除/修正
- [x] 7.3 integration.test.tsを新仕様に修正
- [x] 7.4 movement関連テストからnutrientInteractionを削除

## 8. 検証

- [x] 8.1 全テスト実行・パス確認（124テスト全パス）
