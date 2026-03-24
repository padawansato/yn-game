## Why

現在の養分システムには掘削時の30%喪失や死亡時の養分消失など、養分が系外に漏出するポイントが複数存在する。
ゲーム内生態系の安定性と予測可能性を高めるために、養分の保存則を確立する必要がある。
また、モンスターが単調な移動・捕食のみで変化に乏しいため、変態・繁殖によるライフサイクルを導入し、
プレイヤーのダンジョン管理にインタラクション（つるはし操作）を追加する。

## What Changes

### 養分保存則
- **BREAKING** 掘削時の養分30%喪失（`NUTRIENT_DEPLETION_RATIO`）を廃止。土壌養分100%が保存される
- 空洞セル（`type: 'empty'`）にも `nutrientAmount` を保持可能にする（隠しパラメータ）
- モンスター死亡時の養分放出範囲を上下左右4マスから周囲8マス+中心の9マスに拡大
- 隣接土壌がない場合でも、空洞セルに養分を保存して消失を防ぐ
- 将来の魔分（`magicAmount`）追加に備えた Cell 構造の拡張準備

### つるはし機能
- 左クリック: モンスターに固定ダメージを与える（digPower消費なし、勇者は対象外）
- 右クリック: モンスターのパラメータ（type, life, carryingNutrient）をポップアップ表示
- モンスターがダメージで死亡した場合、保存則に従った養分放出を実行

### モンスター変態・繁殖
- **ニジリゴケ（コケ類）**: 移動期 → つぼみ（固定化、広範囲吸収）→ 花（攻撃能力）→ 枯死 → 子コケ生成（最大5匹）
- **ガジガジムシ（ムシ類）**: 幼虫 → 蛹（固定化、無消費）→ 成虫/羽ガジガジムシ → 繁殖（幼虫生成）
- **リザードマン（トカゲ類）**: 通常体 → 巣作り（既存）→ 産卵（固定化）→ 孵化 → 子リザードマン生成
- 全ての変態・繁殖プロセスで養分保存則を遵守

## Capabilities

### New Capabilities
- `nutrient-conservation`: 養分保存則の確立。掘削喪失廃止、空洞セルへの養分保存、9マス放出
- `pickaxe-interaction`: つるはし操作によるモンスターへのダメージ付与とパラメータ表示
- `monster-lifecycle`: モンスターの変態段階（phase）管理と遷移条件の定義
- `monster-reproduction`: 変態最終段階での繁殖（子モンスター生成）メカニズム

### Modified Capabilities
- `nutrient-system`: 保存則の適用、空洞セルへの養分保存、放出範囲の拡大（4方向→9マス）
- `monster-types`: 変態段階（phase）フィールドの追加、各段階での能力変化
- `predation-system`: 死亡時の養分放出ルール変更（9マス放出、空洞セル対応）
- `monster-movement`: 変態段階に応じた移動パターンの切替（つぼみ・蛹は固定化）
- `monster-spawn-by-nutrient`: 掘削時の養分喪失廃止に伴う生成ロジック変更

## Impact

### コード変更
- `src/core/types.ts`: Cell に magicAmount 準備、Monster に phase フィールド追加
- `src/core/constants.ts`: NUTRIENT_DEPLETION_RATIO 廃止、変態閾値の追加
- `src/core/nutrient.ts`: 保存則対応、放出範囲拡大、空洞セル養分保存
- `src/core/simulation.ts`: つるはしダメージ関数、変態遷移ロジック、繁殖処理
- `src/core/predation.ts`: 死亡時養分放出の9マス対応
- `src/core/movement/`: 変態段階に応じた移動制御

### 参考資料
- [コケ類 - 勇者のくせになまいきだ Wiki](https://wikiwiki.jp/yuunama/コケ類)
- [ムシ類 - 勇者のくせになまいきだ Wiki](https://wikiwiki.jp/yuunama/ムシ類)
- [トカゲ類 - 勇者のくせになまいきだ Wiki](https://wikiwiki.jp/yuunama/トカゲ類)
