## Context

現在の`dig`関数は常にニジリゴケを生成する。原作ゲームでは養分量に応じて異なるモンスターが生成される。

## Goals / Non-Goals

**Goals:**
- 養分量に応じて3種類のモンスターを生成できるようにする
- 閾値を定数として管理し、調整しやすくする
- 初期マップで各モンスターをテストできるようにする

**Non-Goals:**
- モンスターの進化システム（ツボミへの変態など）
- 魔分（mana）システムの実装

## Decisions

### 1. 閾値の定義（原作準拠）

`constants.ts` に新しい定数を追加：

```typescript
export const NUTRIENT_SPAWN_THRESHOLDS = {
  GAJIGAJIMUSHI: 10,  // 10以上でガジガジムシ
  LIZARDMAN: 17,      // 17以上でリザードマン
} as const
```

原作の閾値:
- 養分 1〜9: ニジリゴケ
- 養分 10〜16: ガジガジムシ
- 養分 17以上: リザードマン

### 2. モンスター選択ロジック

`dig`関数内でモンスタータイプを決定：

```typescript
function getMonsterTypeByNutrient(nutrientAmount: number): MonsterType {
  if (nutrientAmount >= NUTRIENT_SPAWN_THRESHOLDS.LIZARDMAN) {
    return 'lizardman'
  }
  if (nutrientAmount >= NUTRIENT_SPAWN_THRESHOLDS.GAJIGAJIMUSHI) {
    return 'gajigajimushi'
  }
  return 'nijirigoke'
}
```

### 3. 初期マップの高養分土

`App.vue`の`createInitialState`で特定のセルに高養分を設定：

```typescript
// エントリーポイント近くに高養分土を配置
grid[2][6].nutrientAmount = 20  // リザードマン用
grid[3][4].nutrientAmount = 12  // ガジガジムシ用
```

## Risks / Trade-offs

**リスク1**: 既存テストへの影響
- 対応: テストを新しい閾値システムに合わせて更新

**リスク2**: ゲームバランス
- 対応: 閾値は定数なので後から調整可能

## Open Questions

なし
