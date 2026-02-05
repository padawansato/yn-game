## Why

dig-power-system で掘りパワーの機能を実装したが、現在は UI に表示されていない。プレイヤーが残りの掘りパワーを確認できないと、戦略的な掘削計画が立てられない。画面に掘りパワーを表示することで、リソース管理の判断がしやすくなる。

## What Changes

- デバッグ UI に掘りパワー（digPower）の表示を追加
- 残り掘りパワーが 0 になった場合、掘削不可であることを視覚的に示す

## Capabilities

### New Capabilities

（なし - UI 層の変更のみ）

### Modified Capabilities

- `dig-power`: 掘りパワーの UI 表示要件を追加（実装は App.vue のみ）

## Impact

- **変更ファイル**: `src/App.vue` - ステータス表示エリアに digPower を追加
- **core ロジック**: 変更なし（UI 層のみ）
- **テスト**: E2E テストで表示確認（任意）
