## Why

現在の養分システムは「勇者のくせになまいきだ」の仕様と根本的に異なっている：

**間違った実装（現在）：**
- 養分を独立したエンティティ（Nutrient）として空洞セルに配置
- ニジリゴケが養分エンティティをピックアップ/ドロップ

**正しい仕様（オリジナルゲーム）：**
- 養分は**土ブロックの内部パラメータ**として存在
- ニジリゴケは土から養分を**吸収**し、別の土に**吐き出す**
- 空洞セルには養分は存在しない
- 養分が蓄積した土を掘ると強いモンスターが生まれる

## What Changes

- **BREAKING**: `Nutrient`エンティティを完全削除
- **BREAKING**: `GameState.nutrients`配列を削除
- ニジリゴケの`carryingNutrient`を`string | null`から`number`に変更（運搬中の養分量）
- ニジリゴケの移動ロジックを変更：隣接する土ブロックと養分をやり取り
- 養分の吸収/吐き出しルール実装
- UI重なり表示をモンスターのみに変更（養分エンティティがなくなるため）

## Capabilities

### New Capabilities
なし

### Modified Capabilities
- `nutrient-system`: 養分を土ブロックの内部パラメータとして再定義、Nutrientエンティティ削除、ニジリゴケの吸収/吐き出しロジック

## Impact

- `src/core/types.ts`: Nutrient型削除、GameState.nutrients削除、Monster.carryingNutrient型変更
- `src/core/nutrient.ts`: pickupNutrient/depositNutrient削除、absorb/releaseNutrient追加
- `src/core/movement/straight.ts`: 養分やり取りロジック追加
- `src/core/simulation.ts`: Nutrient関連コード削除
- `src/App.vue`: 養分エンティティ表示削除、重なりカウントをモンスターのみに
- 全テスト: Nutrient関連テストの大幅修正
