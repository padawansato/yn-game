## Context

生態系バランス調査により、ニジリゴケ（食物連鎖の基盤）の寿命が短すぎて繁殖サイクルが回らないことが判明。これによりガジガジムシの餌不足→増殖停止の連鎖が発生。定数調整のみで改善可能。

## Goals / Non-Goals

**Goals:**

- ニジリゴケが繁殖フェーズ（mobile→bud→flower→withered→offspring）を完走できる寿命を確保
- ガジガジムシが成長→繁殖サイクルを回せる条件を緩和
- 既存のゲームバランス（捕食関係、養分保存則）を壊さない

**Non-Goals:**

- 捕食ロジックの変更
- tick順序の変更（predation→nutrient absorptionの順序はそのまま）
- 新しいフェーズやメカニクスの追加

## Decisions

### D1: 定数変更のみで対処

**決定**: ロジック変更は flower 相の life 減少を 2→1 にする1箇所のみ。他は全て constants.ts の定数変更。

**理由**: 最小限の変更でリスクを抑える。定数調整で効果を見てからロジック変更を検討する。

### D2: ニジリゴケ maxLife 16→24

**理由**: 繁殖パス最短計算:
- mobile（養分集め）: ~8tick
- bud（吸収待ち）: ~4tick
- flower（開花）: ~4tick (1/tick消費に変更後)
- withered（繁殖）: 1tick
- 合計: ~17tick → maxLife=24なら余裕あり

### D3: flower相 life消費 2→1

**理由**: 2/tickでは flower+withered で約4tickしか持たない。1/tickなら8tick持ち、吸収のチャンスが増える。移動コストと統一されて直感的。

### D4: PUPA_DURATION 10→6

**理由**: 10tickのpupa期間でlife10消費。life30のガジガジムシがpupa化してadultになった時点でlife=20。6tickなら life=24で繁殖条件（life>6）を楽に満たせる。

### D5: GAJI_REPRO_LIFE_THRESHOLD 10→6

**理由**: adult後にlife>10は厳しい。6なら捕食1回でlife回復→繁殖可能。

## Risks / Trade-offs

**[ニジリゴケ過増殖]** maxLife増加で繁殖しやすくなり、ニジリゴケが増えすぎる可能性。
→ 捕食関係（ガジガジムシ・リザードマン）が自然に制御する。問題があれば次の調整で対応。

**[ガジガジムシ過増殖]** 繁殖条件緩和で増えすぎる可能性。
→ リザードマンによる捕食で制御。GAJI_REPRO_LIFE_COST=5は維持。
