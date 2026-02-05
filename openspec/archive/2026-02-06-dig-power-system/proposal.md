## Why

現在の実装では掘削操作に制限がなく、プレイヤーは無制限に土を掘ることができる。オリジナルの勇なまでは「掘りパワー」という有限のリソースが存在し、プレイヤーの行動回数を制限している。これにより戦略的な掘削計画が必要となり、ゲームとしての面白さが生まれる。

## What Changes

- 新しいリソース「掘りパワー（digPower）」を `GameState` に追加
- 掘削操作時に掘りパワーを1消費
- 掘りパワーが0の場合、掘削操作を拒否
- 初期掘りパワーの設定（定数として管理）

## Capabilities

### New Capabilities

- `dig-power`: 掘りパワーリソースの管理。掘削時のリソース消費、残量チェック、初期値設定を含む。

### Modified Capabilities

（なし - 掘削のコアロジックは変更せず、リソースチェックのみ追加）

## Impact

- **変更ファイル**:
  - `src/core/types.ts` - `GameState` に `digPower` フィールド追加
  - `src/core/constants.ts` - 初期掘りパワー定数追加
  - `src/core/simulation.ts` - `dig()` 関数に掘りパワーチェック追加、`createGameState()` 更新
- **API変更**: `dig()` 関数が新しいエラー `"insufficient dig power"` を返す可能性
- **既存テストへの影響**: `dig()` を使用するテストで `digPower` の初期化が必要になる可能性
