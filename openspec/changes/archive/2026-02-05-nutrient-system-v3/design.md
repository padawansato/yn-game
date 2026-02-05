## Context

現在の実装は養分を独立したエンティティ（Nutrient型）として扱っているが、オリジナルゲームでは養分は土ブロックの内部パラメータである。この根本的な設計ミスを修正する。

**現在の構造（間違い）：**
```typescript
interface Nutrient {
  id: string
  position: Position
  amount: number
  carriedBy: string | null  // monster id
}

interface GameState {
  nutrients: Nutrient[]  // 独立エンティティとして管理
}

interface Monster {
  carryingNutrient: string | null  // nutrient id
}
```

**正しい構造：**
```typescript
// Nutrient型を削除

interface GameState {
  // nutrients配列を削除
}

interface Monster {
  carryingNutrient: number  // 運搬中の養分量（0以上の整数）
}

interface Cell {
  nutrientAmount: number  // 土ブロックのみ有効（0-100）
}
```

## Goals / Non-Goals

**Goals:**
- Nutrientエンティティを完全削除
- 養分を土ブロックの内部パラメータとして管理
- ニジリゴケの吸収/吐き出しロジックを実装
- 既存テストを新仕様に対応

**Non-Goals:**
- 高度な吸収/吐き出しAIの実装（基本ロジックのみ）
- 養分の可視化（土の色変化等）
- ニジリバナへの進化

## Decisions

### Decision 1: Nutrient型の完全削除

**選択**: types.tsからNutrient型を削除、GameState.nutrientsを削除

**代替案**:
- A) Nutrient型を残して内部的に使用 → 混乱の原因、削除が明確
- B) 段階的移行 → 複雑性が増す、一括変更が望ましい

**理由**: 根本的な設計ミスなので、完全に削除して正しい構造に作り直す

### Decision 2: carryingNutrientの型変更

**選択**: `string | null` → `number`（運搬中の養分量）

**初期値**: 0（何も運んでいない状態）
**最大値**: NUTRIENT_CARRY_CAPACITY（定数、デフォルト10）

**理由**: 養分はIDで参照するものではなく、量として管理するもの

### Decision 3: 吸収/吐き出しタイミング

**選択**: 移動時に隣接セルをチェックして自動実行

```
移動後の処理順序:
1. 新位置に移動
2. 隣接する土ブロックをチェック
3. 吸収条件を満たせば吸収（carryingNutrient < capacity かつ 隣接土に養分あり）
4. 吐き出し条件を満たせば吐き出し（carryingNutrient >= 2 かつ 隣接土あり）
```

**代替案**:
- A) 別々のtickで処理 → 複雑、同一tick内で完結が自然
- B) ランダムで吸収/吐き出し → 予測不能、条件ベースが明確

### Decision 4: 死亡時の養分散布

**選択**: 隣接する土ブロックに均等分配、土がなければ消失

```typescript
function releaseNutrientsOnDeath(monster: Monster, grid: Cell[][]): Cell[][] {
  const adjacentSoil = getAdjacentSoilCells(monster.position, grid)
  if (adjacentSoil.length === 0) {
    // 養分消失（エントロピー）
    return grid
  }
  const perCell = Math.floor(monster.carryingNutrient / adjacentSoil.length)
  // 各土ブロックに分配
}
```

## Risks / Trade-offs

**[Risk] 大規模なコード変更による既存テスト失敗**
→ Mitigation: テストを先に修正し、新仕様に合わせる

**[Risk] 養分の吸収/吐き出しが複雑で予測困難**
→ Mitigation: シンプルなルール（2以上で吐き出し、進行方向優先）を採用

**[Trade-off] 養分の視覚化がなくなる**
→ 土ブロックの色で養分量を表現する機能は将来の拡張として保留

**[Trade-off] Nutrient関連の既存コードを全て削除**
→ 正しい設計のために必要な犠牲
