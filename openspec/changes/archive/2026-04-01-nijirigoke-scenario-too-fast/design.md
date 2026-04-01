## Context

App.vueの「ニジリゴケ変態」シナリオが閾値ぴったりの初期値を使っているため、1〜2tickで全遷移が完了してしまう。

現在の初期値:
- `carryingNutrient: BUD_NUTRIENT_THRESHOLD (4)` → 即bud遷移
- `life: BUD_LIFE_THRESHOLD (16)` → flower後16tickで枯死
- 周囲9セル × 養分5 = 45 → bud吸収で即flower到達

## Goals / Non-Goals

**Goals:**
- 各フェーズ（mobile→bud→flower→withered→繁殖）を数秒ずつ観察可能にする

**Non-Goals:**
- ゲームロジックやフェーズ遷移閾値の変更
- 他シナリオの調整

## Decisions

| # | 決定 | 根拠 |
|---|------|------|
| D1 | carryingNutrient: 0から開始 | 吸収→蓄積→遷移の過程を観察できる |
| D2 | life: maxLife (24) | 寿命で急死せず、witheredまでの流れを見られる |
| D3 | 周囲養分を4セル×3に削減 | 9セル×5だと吸収が速すぎてbudからflowerへ即遷移。4セル×3=12なら吸収に数tick必要 |

## Risks / Trade-offs

- 養分が少なすぎるとflower閾値(8)に到達できない可能性 → 4セル×3=12で十分到達可能（carryCapacity=10なので最大10まで保持）
