## Context

現在のニジリゴケは移動するたびに`life`が1減少する（`MOVEMENT_LIFE_COST = 1`）。`maxLife`は10なので、最大でも10ターンで餓死する。

養分システムでは`absorbNutrient`で土から養分を吸収し、`carryingNutrient`に蓄える。しかし、この養分は運搬用であり、ライフ回復には使われていない。

## Goals / Non-Goals

**Goals:**
- ニジリゴケが`carryingNutrient`を消費してライフを維持できるようにする
- 養分が豊富なエリアでは長く生存できるようにする
- 原作ゲームの挙動に近づける

**Non-Goals:**
- ライフの「回復」は行わない（消耗の回避のみ）
- 他のモンスター種（ガジガジムシ、リザードマン）への適用
- 新しい定数の追加

## Decisions

### 1. 実装箇所: `decreaseLifeForMoved`関数

**選択肢A**: `decreaseLifeForMoved`関数内で養分消費を処理 ✅採用
- 理由: 移動コスト処理が一箇所にまとまっている
- ライフ減少ロジックの直前に養分チェックを追加

**選択肢B**: 新しい関数`consumeNutrientForSurvival`を作成
- 不採用: 処理が分散し、呼び出し順序の管理が複雑になる

### 2. 養分消費の優先度

養分消費 > 養分リリース の順で処理する。

```
移動後の処理順序:
1. 養分吸収（absorbNutrient）
2. 移動コスト処理（decreaseLifeForMoved）← ここで養分消費
3. 養分リリース（releaseNutrient）← 閾値以下なら発動しない
```

### 3. イベント発行

養分消費時に`NUTRIENT_CONSUMED`イベントは発行しない。
- 理由: 毎ターン発生するためログが冗長になる
- 既存の`MONSTER_DIED`イベントで餓死は追跡可能

## Risks / Trade-offs

**リスク1**: 養分リリースとの競合
- 状況: `carryingNutrient = 2`で移動時、養分消費でcarryingNutrient=1になり、リリース閾値以下になる
- 対応: 仕様として許容。生存が優先される設計

**リスク2**: 無限生存の可能性
- 状況: 養分が豊富なエリアでニジリゴケが永遠に生き続ける
- 対応: これは意図した挙動。原作でも養分がある限り生存する

## 実装の疑似コード

```typescript
// src/core/simulation.ts の decreaseLifeForMoved 内

if (hasMoved) {
  if (monster.type === 'nijirigoke' && monster.carryingNutrient > 0) {
    // 養分を消費してライフを維持
    newMonster = {
      ...monster,
      carryingNutrient: monster.carryingNutrient - 1
    }
    // ライフは減らない
  } else {
    // 通常通りライフを減少
    newMonster = {
      ...monster,
      life: monster.life - MOVEMENT_LIFE_COST
    }
  }
}
```

## Open Questions

なし - 調査とプロトタイプで解決済み
