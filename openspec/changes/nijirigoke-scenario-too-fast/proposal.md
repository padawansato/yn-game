## Why

App.vueの「ニジリゴケ変態」シナリオで、mobile→bud→flower→withered の遷移が1〜2tickで完了し、ユーザーが各フェーズを観察できない。初期値がフェーズ遷移閾値ぴったりに設定されているため。(GitHub issue #24)

## What Changes

- 「ニジリゴケ変態」シナリオの初期パラメータを調整し、各フェーズを数秒間観察可能にする
  - `carryingNutrient: 0`（ゼロから吸収過程を見せる）
  - `life: maxLife`（長く生存させる）
  - 周囲養分を減らす（9セル全面→一部セルのみ）

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

（なし — シナリオ初期値の調整のみ。仕様レベルの変更はなし）

## Impact

- `src/App.vue` のシナリオ定義部分のみ
- ゲームロジックの変更なし
