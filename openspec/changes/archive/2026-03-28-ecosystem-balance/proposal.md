## Why

ニジリゴケが早く死にすぎて繁殖に至らず、結果としてガジガジムシの餌が不足し増殖できない。生態系の食物連鎖が持続しない。調査の結果、定数設定とflower相のlife消費速度が根本原因と判明。

## What Changes

- **ニジリゴケのlife増加**: 16 → 24（繁殖フェーズに到達する余裕を確保）
- **flower相のlife消費緩和**: 2/tick → 1/tick（通常の移動コストと同じに統一）
- **pupa期間短縮**: 10 → 6 tick（ガジガジムシの成長待機リスクを軽減）
- **ガジガジムシ繁殖life閾値引き下げ**: 10 → 6（adult後の繁殖機会を増やす）

## Capabilities

### New Capabilities

なし

### Modified Capabilities

- `monster-lifecycle`: ニジリゴケのflower相life消費を2→1に変更、pupa期間を10→6に変更
- `monster-types`: ニジリゴケのmaxLifeを16→24に変更

## Impact

- **定数**: `src/core/constants.ts` — MONSTER_CONFIGS.nijirigoke.life, PUPA_DURATION, GAJI_REPRO_LIFE_THRESHOLD
- **シミュレーション**: `src/core/simulation.ts` — flower相のlife減少ロジック（2→1）
- **テスト**: 定数変更に依存するテストの期待値更新
