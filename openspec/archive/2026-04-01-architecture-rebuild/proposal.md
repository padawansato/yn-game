## Why

yn-gameを無料Webゲームとして公開するために、UGC（ユーザー生成コンテンツ）・非同期対戦・LLM勇者AIの3つの独自機能が必要。現状のアーキテクチャではゲームパラメータが`constants.ts`にハードコードされており、ユーザーによるカスタマイズや設定共有ができない。また`simulation.ts`が1208行に肥大化しており、開発効率（Claude Codeのコンテキスト制限含む）を阻害している。

## What Changes

- **BREAKING**: `GameState`に`GameConfig`フィールドを追加。全ゲームパラメータをconfigオブジェクト経由で参照するように変更
- `constants.ts`のハードコード値を`GameConfig`型に集約し、`createDefaultConfig()`で提供
- `simulation.ts`を機能単位で6ファイルに分割（tick / dig / phase-transitions / movement-resolution / life-cycle / spawn）
- `simulation.ts`はre-export用の薄いファイルとして後方互換性を維持
- ユーザーが`GameConfig`をUI経由で編集・JSON export/importできる機能を追加
- 設定テキストdumpによる非同期対戦（スコア競争）機能を追加
- 勇者AIをインターフェースで抽象化し、LLM版AIを追加

## Capabilities

### New Capabilities
- `game-config`: GameConfig型の定義、デフォルト値生成、バリデーション。全ゲームパラメータを1つのオブジェクトに集約する
- `config-editor`: ユーザーがGameConfigをUI上で編集し、プリセット保存（localStorage）・JSON export/importする機能
- `async-battle`: GameConfig + スコアをテキストdumpで共有し、同じ設定で遊んでスコアを競う非同期対戦機能
- `llm-hero-ai`: 勇者AIをインターフェースで抽象化し、LLMベースの勇者AI実装を追加する機能

### Modified Capabilities
- `game-loop`: GameStateにconfigフィールドを追加。tick()等の関数がconstants直接参照からstate.config参照に変更
- `monster-types`: モンスター種別定義がハードコードからGameConfig.monsters（Record型）に変更。ユーザーによるカスタムモンスター追加が可能に
- `monster-spawn-by-nutrient`: スポーン閾値がハードコードからGameConfig.spawn.thresholdsに変更
- `hero-ai`: calculateHeroMove()をAI戦略インターフェースで抽象化。rule-based（既存）とllmの切替を可能に

## Impact

- **コード**: `src/core/simulation.ts`を6ファイルに分割。`src/core/config.ts`新規作成。全core関数のconstants参照をconfig参照に移行
- **型**: `GameState`にconfig追加（破壊的変更だが、createDefaultConfig()でデフォルト注入するため既存コードは最小限の修正で対応可能）
- **テスト**: 既存テストはsimulation.tsのre-exportにより変更不要。config注入後は一部テストでcreateDefaultConfig()の明示的指定が必要になる可能性あり
- **UI**: App.vueにconfig編集UI、export/import、スコア表示を追加
- **依存関係**: LLM AI実装時にAPI呼び出しライブラリが必要（Phase 3で追加）
