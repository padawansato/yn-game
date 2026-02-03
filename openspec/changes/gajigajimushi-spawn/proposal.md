## Why

現在、土を掘ると常にニジリゴケが生成される。原作ゲームでは養分レベルに応じて異なるモンスターが生成される仕組みがあり、これを再現することで食物連鎖のゲームプレイが豊かになる。

## What Changes

- 土の養分量に応じて生成されるモンスターが変わる（原作準拠）
  - 養分 1〜9: ニジリゴケ（現状通り）
  - 養分 10〜16: ガジガジムシ（新規）
  - 養分 17以上: リザードマン（新規）
- 初期マップに高養分の土を配置してテストしやすくする

## Capabilities

### New Capabilities

- `monster-spawn-by-nutrient`: 養分量に応じたモンスター生成システム

### Modified Capabilities

- `nutrient-system`: dig時のモンスター生成ロジックを養分閾値ベースに変更

## Impact

- `src/core/simulation.ts`: `dig`関数のモンスター生成ロジックを修正
- `src/core/constants.ts`: 養分閾値の定数を追加
- `src/App.vue`: 初期マップに高養分土を配置
- 既存のdigテストに影響する可能性あり
