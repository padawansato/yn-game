## Context

Lizardmanの移動がブラウザでワープのように見えるバグが発生している。

Wiki（勇なま）によるトカゲ類の仕様:
- 通常は直進（壁で曲がらない）
- **2×3マス以上のスペースで巣を作る**
- 巣があると**その周囲をうろうろする**
- 獲物を感知すると移動速度が上がる

### 現行の実装の問題

1. **ネスト確立条件**: 3×3エリアで5セル以上オープン → 2×3マス以上が正しい
2. **パトロール動作**: 周囲8マスにランダムテレポート → 1マスずつうろうろが正しい
3. **獲物追跡時のバグ**: `monster.position`（元の位置）から計算するため、パトロール移動後にワープする

## Goals / Non-Goals

**Goals:**
- ネスト確立条件を2×3マス以上に修正
- パトロール動作を1マスずつの移動に修正（テレポートではなく）
- ワープバグの解消

**Non-Goals:**
- 移動速度上昇（今回は対象外、別changeで対応）

## Decisions

### 1. ネスト確立条件の変更

現在:
```typescript
// 3×3エリアで5セル以上オープン
return openCount >= 5
```

変更後:
```typescript
// 2×3以上の連続したオープンスペースがあるか確認
function canEstablishNest(position: Position, grid: Cell[][]): boolean {
  // 縦2×横3、または縦3×横2のスペースをチェック
  return has2x3Space(position, grid)
}
```

### 2. パトロール動作の変更

**現在の問題**: ネスト周囲8マスからランダムに1つを選び、そこに直接移動（テレポート）

**修正方針**: 1マスずつ移動してネスト周辺をうろうろする

実装案:
```typescript
function calculateStationaryMove(monster, grid, randomFn) {
  // ネストがない場合は直進（fallback）
  if (!monster.nestPosition) {
    if (canEstablishNest(monster.position, grid)) {
      // ネスト確立、その場にとどまる
      return { position: monster.position, nestPosition: monster.position }
    }
    return straightFallback(monster, grid, randomFn)
  }

  // ネストあり → 1マスずつパトロール
  // ネストから離れすぎないよう、ネスト周辺にとどまる
  const adjacentPositions = getAdjacentPositions(monster.position, grid)
  const patrolOptions = adjacentPositions.filter(pos =>
    isWithinPatrolRange(pos, monster.nestPosition)
  )

  if (patrolOptions.length === 0) {
    // 移動先がない場合はその場にとどまる
    return { position: monster.position, nestPosition: monster.nestPosition }
  }

  // ランダムに1マス移動
  const idx = Math.floor(randomFn() * patrolOptions.length)
  return {
    position: patrolOptions[idx],
    direction: getDirectionToward(monster.position, patrolOptions[idx]),
    nestPosition: monster.nestPosition
  }
}
```

### 3. パトロール範囲の定義

ネストから2マス以内をパトロール範囲とする（2×3スペースをカバー）:
```typescript
function isWithinPatrolRange(pos: Position, nestPos: Position): boolean {
  const dx = Math.abs(pos.x - nestPos.x)
  const dy = Math.abs(pos.y - nestPos.y)
  return dx <= 2 && dy <= 2
}
```

### 4. 獲物追跡時の修正

`movement/index.ts`の獲物追跡処理は、stationaryパターンでは無効化。
代わりに`calculateStationaryMove`内で獲物方向を優先するロジックを追加:

```typescript
// パトロール位置選択時に獲物がいる方向を優先
if (isHungry(monster) && monster.predationTargets.length > 0) {
  const preyOptions = patrolOptions.filter(pos =>
    isTowardPrey(monster.position, pos, monsters, monster.predationTargets)
  )
  if (preyOptions.length > 0) {
    // 獲物方向のパトロール位置を優先選択
  }
}
```

## Risks / Trade-offs

**[リスク] 既存テストの変更が必要**
→ `canEstablishNest`の条件変更、`calculateStationaryMove`の動作変更でテスト更新必要

**[トレードオフ] パトロール動作がシンプルに**
→ 8マス即時移動より自然だが、動きが遅く見える可能性あり
