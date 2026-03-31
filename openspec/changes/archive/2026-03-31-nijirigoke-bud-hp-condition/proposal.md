## Why

通常プレイでニジリゴケのmobile→bud遷移が即座に発生する。養分28以上の土を掘るとcarryingNutrient>=4でスポーン直後にbud化する。原作では「養分を溜め込んだ状態でHPが減るとつぼみになる」というHP条件があり、これを追加することで自然な成長過程を実現する。

## What Changes

- ニジリゴケのmobile→bud遷移条件に `life < maxLife` を追加
- スポーン直後（life=maxLife）では養分があっても蕾化しない
- 移動によるlife消耗後に自然に蕾化する（原作準拠）

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `monster-lifecycle`: bud遷移条件にHP条件を追加

## Impact

- `src/core/phase-transitions.ts` の蕾遷移条件1行追加
- `src/core/config.ts` のMonsterTypeConfig（budLifeThreshold既存）
- 既存テストの一部修正（bud遷移テストにlife条件追加）
