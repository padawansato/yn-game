## Context

main specに(FUTURE)マークされた未実装機能を片付ける。3機能の実装 + 1件の削除。

## Goals / Non-Goals

**Goals:**
- Flower attack (moyomoyo): 花ニジリゴケが周囲のガジガジムシにダメージ
- Shared nests: リザードマンが他のリザードマンの巣を利用可能に
- Gaji reproduction constants: マジックナンバーを定数化
- Laying interruption spec削除

**Non-Goals:**
- 勇者の実装（moyomoyoの対勇者攻撃は勇者実装時に追加）
- つるはし攻撃UI / laying pickaxe immunity（別change）

## Decisions

### 1. Moyomoyo攻撃

**仕組み**: flower phaseのニジリゴケが、毎tickで周囲9マス内のガジガジムシにダメージ。

- 攻撃力: `MOYOMOYO_DAMAGE = 2`（flower自身の加速ライフ減少と同じ速度）
- 範囲: 周囲9マス（8方向+自セル）— bud吸収と同じ`getSurroundingCells()`を流用
- 対象: ガジガジムシ（将来は勇者も追加）
- 処理タイミング: `processPhaseTransitions()`内のflower処理で実行
- イベント: `MOYOMOYO_ATTACK` イベントを追加

**代替案:** 新しい`processMoyomoyo()`関数を別ステップにする → tick処理順が複雑になるだけ。flower処理内で完結する方がシンプル。

### 2. 共有巣

**仕組み**: 巣なしリザードマンが、他のリザードマンの巣を検出して利用。

- `calculateStationaryMove()`で `monster.nestPosition === null` の場合
- `monsters`リストから他のリザードマンの`nestPosition`を検索
- 見つかったら、その巣を自分の巣として採用（`nestPosition`と`nestOrientation`をコピー）
- 巣コストは不要（既存の巣を使うだけ）
- 自分で巣を作れる場合は自分の巣を優先

**代替案:** 巣をGameState上の独立エンティティにする → 過剰設計。モンスターの属性で十分。

### 3. Gaji reproduction constants

`constants.ts`に追加:
```
GAJI_REPRO_LIFE_THRESHOLD = 10
GAJI_REPRO_LIFE_COST = 5
```

nutrient条件は`PUPA_NUTRIENT_THRESHOLD`を正式に流用（別名定数は作らない）。子への養分は`floor(parent.carryingNutrient / 2)`のまま（定数化不要、比率ベースで自然）。

## Risks / Trade-offs

- **[Risk] moyomoyoが強すぎる** → MOYOMOYO_DAMAGE=2は控えめ。ガジガジムシのlife=30なので15tick耐えられる。
- **[Risk] 共有巣でリザードマン密集** → 巣コスト(14養分)が不要なため増殖しやすくなる。ただし原作通りの仕様。
