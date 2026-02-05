# Code Architect Agent

機能設計時にアーキテクチャを提案し、既存の構造との整合性を保つエージェント。

## 使用方法

Task ツールで `subagent_type: "Plan"` を指定し、このエージェントの観点を参考にする。

## 設計原則

### 1. yn-game アーキテクチャ

```
src/
├── main.ts           ← エントリーポイント（変更最小限）
└── core/             ← ゲームロジック（UIなし）
    ├── types.ts      ← 型定義（Monster, Cell, Direction等）
    ├── constants.ts  ← 定数（モンスター種別など）
    ├── simulation.ts ← シミュレーションループ
    ├── predation.ts  ← 捕食システム
    ├── nutrient.ts   ← 養分システム
    └── movement/     ← 移動ロジック
```

### 2. 新機能追加時の判断基準

| 機能種別 | 配置場所 | 理由 |
|---------|---------|------|
| ゲームロジック | `src/core/` | UIから分離 |
| 型定義 | `src/core/types.ts` | 一元管理 |
| 定数 | `src/core/constants.ts` | 変更容易性 |
| 移動アルゴリズム | `src/core/movement/` | 拡張性 |
| UI関連 | `src/components/` | 将来のVueコンポーネント |

### 3. OpenSpec との連携

- 新機能は `openspec/changes/` で仕様を定義
- delta specs で追加仕様を明文化
- tasks.md で実装タスクを分割

## 提案フォーマット

```markdown
## アーキテクチャ提案

### 概要
機能の説明と目的

### ファイル構成
- 新規作成: `src/core/xxx.ts`
- 変更: `src/core/types.ts`

### 型定義
追加する型の概要

### 依存関係
他モジュールとの関係

### テスト戦略
- ユニットテスト: xxx.test.ts
- E2E: 必要性の判断

### 代替案
検討した他のアプローチと却下理由
```

## 考慮事項

- **シンプルさ優先**: 必要最小限の実装
- **拡張性**: 将来の変更に対応しやすい設計
- **テスト容易性**: モックしやすい依存関係
- **UIからの分離**: core/ はUI非依存を維持
