## Context

現在の養分システムは以下の構造を持つ：
- `Cell.nutrientAmount`: 各セルに埋め込まれた養分量
- `Nutrient` entity: 独立した養分オブジェクト（位置、量、運搬者を持つ）
- `initializeNutrients()`: 全土セルに均等分配

問題点：
1. 空洞/壁セルにもnutrientAmountが存在しうる
2. Nutrient entityが土セル上に配置されうる
3. 初期分布が均等で、ゲームバランス上の変化が乏しい

## Goals / Non-Goals

**Goals:**
- 養分の2形態（埋め込み型 vs 放出型）を明確に分離
- 初期分布をまばらな指数分布的パターンに変更
- 同一セルの重なり数をUI表示

**Non-Goals:**
- ゲームバランスの完全な調整（後続の調整で対応）
- 養分のビジュアルエフェクト（グラデーション表示等）
- モンスター生成ロジックの変更（既存の70%ルールは維持）

## Decisions

### Decision 1: 養分の2形態モデル

**選択**: Cell.nutrientAmount（土専用）+ Nutrient entity（空洞専用）の明確な分離

**代替案**:
- A) nutrientAmountを削除しNutrient entityのみにする → 土の「埋め込み養分」概念が表現できない
- B) Nutrient entityを削除しnutrientAmountのみにする → 運搬・移動の表現が困難

**理由**: オリジナルゲームの「土を掘ると養分が放出される」メカニクスを忠実に再現するため

### Decision 2: 初期分布アルゴリズム

**選択**: 指数分布的なランダム分布（`-ln(random) * scale`）

**代替案**:
- A) 一様乱数 → 高養分セルが多くなりすぎる
- B) パーリンノイズ → 実装が複雑、今回のスコープ外
- C) 固定パターン → 毎回同じゲーム展開になる

**理由**: 「多くのセルは低養分、少数のセルが高養分」というまばらな分布を簡潔に実現

### Decision 3: 重なり表示の実装方式

**選択**: CSS疑似要素（::after）でカウントバッジを表示

**代替案**:
- A) 別DOM要素でオーバーレイ → z-index管理が複雑
- B) Canvas描画 → Vueのリアクティブと相性が悪い

**理由**: 既存のグリッドセル構造を変更せず、CSSのみで実装可能

### Decision 4: 表示優先度の実装

**選択**: モンスターをtype順でソートし、最初の要素を表示

優先度定数: `{ lizardman: 0, gajigajimushi: 1, nijirigoke: 2, nutrient: 3 }`

**理由**: 単純な数値比較で決定でき、拡張性も確保

## Risks / Trade-offs

**[Risk] 指数分布の乱数が極端な値を生む可能性**
→ Mitigation: clamp(0, 100)で範囲を制限、totalNutrientsから逆算して正規化

**[Risk] 既存テストが大量に失敗する可能性**
→ Mitigation: initializeNutrientsのシグネチャは維持、分布ロジックのみ変更

**[Risk] 重なりカウント計算のパフォーマンス**
→ Mitigation: computed propertyでキャッシュ、グリッドサイズが小さいため影響軽微

**[Trade-off] Cell.nutrientAmountを土以外でも0として保持**
→ 型変更を最小限に抑えるため、実行時検証で制約を担保
