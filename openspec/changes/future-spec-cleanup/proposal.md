## Why

main specに(FUTURE)マークされた未実装機能が残っている。これらを実装してspecと実装の一貫性を確保する。また不要になったFUTURE specを削除する。

## What Changes

1. **Flower attack (moyomoyo)**: ニジリゴケのflower phaseで周囲の敵に範囲攻撃する仕組み
2. **Shared nests**: リザードマンが他のリザードマンの巣を共有して産卵できる仕組み
3. **Gaji reproduction constants**: ガジガジムシ繁殖のマジックナンバーを名前付き定数に置換
4. **Laying interruption削除**: 不要（原作でも産卵中に戦闘ダメージを受けても産卵継続）

## Capabilities

### New Capabilities
（なし）

### Modified Capabilities
- `monster-lifecycle`: flower attack (moyomoyo) 実装、shared nests 実装、laying interruption 削除
- `monster-reproduction`: ガジガジムシ繁殖の定数化

## Impact

- `src/core/simulation.ts`: moyomoyo攻撃処理、共有巣の産卵ロジック
- `src/core/constants.ts`: GAJI_REPRO定数、moyomoyo定数追加
- `src/core/movement/stationary.ts`: 共有巣の検出ロジック
- `openspec/specs/monster-lifecycle/spec.md`: FUTURE削除・更新
- `openspec/specs/monster-reproduction/spec.md`: 定数名更新
