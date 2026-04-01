## Context

yn-gameはコアメカニクス（掘る→育てる→配置→防衛→勝敗）が動作する状態だが、全パラメータが`constants.ts`にハードコードされ、`simulation.ts`が1208行に肥大化している。公開に向けてUGC・非同期対戦・LLM AIの3機能を追加するには、パラメータの外部化とファイル分割が前提条件となる。

現状の依存構造:
- `simulation.ts` → `constants.ts`（直接import、約20個の定数）
- `nutrient.ts` → `constants.ts`（3個の定数）
- `combat.ts` → `constants.ts`
- `hero/*.ts` → `constants.ts`
- テスト群 → `simulation.ts`（re-export経由）

## Goals / Non-Goals

**Goals:**
- 全ゲームパラメータを`GameConfig`型に集約し、実行時に差し替え可能にする
- `simulation.ts`を200-400行/ファイルに分割し、Claude Codeで1発読み書き可能にする
- 既存テストを壊さずに段階的移行する
- Phase 1-3の独自機能追加の土台を作る

**Non-Goals:**
- ECS（Entity Component System）等への根本的なアーキテクチャ変更
- ビジュアル/UI刷新（Phase 4+）
- モンスター名・世界観のリブランド（別changeで実施）
- ゲームバランス調整
- バックエンドサーバーの構築

## Decisions

### D1: GameConfigをGameStateに埋め込む

**選択:** `GameState.config: GameConfig`として保持する

**代替案:**
- (A) グローバル変数として保持 → テスト時のconfig差し替えが困難、複数ゲーム同時実行不可
- (B) 各関数の引数にconfigを渡す → シグネチャ変更が大量発生
- (C) GameStateに埋め込む → `tick(state)`のシグネチャ不変、serialize可能、テスト容易

**理由:** (C)は既存API互換性を保ちつつ、JSON serialize時にconfigごと保存/共有でき、Phase 2の非同期対戦に直結する。

### D2: simulation.tsの分割戦略

**選択:** tick()の処理フロー順に機能単位で分割する

| ファイル | 担当 | 推定行数 |
|---|---|---|
| `config.ts` | GameConfig型、createDefaultConfig() | ~80 |
| `tick.ts` | tick()オーケストレーション、ゲームオーバー判定 | ~120 |
| `movement-resolution.ts` | calculateAllMoves(), resolveConflicts(), applyMovements() | ~100 |
| `life-cycle.ts` | decreaseLifeForMoved(), processNestEstablishment() | ~200 |
| `phase-transitions.ts` | processPhaseTransitions(), 3種のphase関数, moyomoyo | ~250 |
| `dig.ts` | dig(), attackMonster(), isAdjacentToEmpty() | ~120 |
| `spawn.ts` | createGameState(), generateMonsterId(), getMonsterTypeByNutrient() | ~80 |
| `simulation.ts` | re-export（後方互換） | ~30 |

**代替案:**
- (A) ドメイン単位で分割（monster.ts, hero.ts, nutrient.ts） → 既にnutrient/predation/hero/combatは分離済み。残りはtick処理フローなので機能単位が自然
- (B) 1ファイルのまま関数を整理 → Claude Codeのトークン制限問題が解決しない

**理由:** 既存の分割済みファイル（predation.ts, nutrient.ts, combat.ts, hero/）はそのまま維持し、simulation.tsに残っている処理フロー関数群を分割する。

### D3: 後方互換性の維持方法

**選択:** `simulation.ts`をre-exportファイルとして残す

```typescript
// simulation.ts（分割後）
export { tick } from './tick'
export { dig, attackMonster, isAdjacentToEmpty } from './dig'
export { processPhaseTransitions, applyMoyomoyoAttacks } from './phase-transitions'
// ... 全public関数をre-export
```

**理由:** 既存テスト・App.vueの`import`文を変更せずに移行できる。将来的にsimulation.tsからの直接importを非推奨にし、個別ファイルimportに移行する。

### D4: constants.ts廃止の段取り

**選択:** 段階的に移行し、最終的にcreateDefaultConfig()の内部実装としてのみ残す

手順:
1. `GameConfig`型 + `createDefaultConfig()`を作成
2. `GameState`にconfigを追加
3. 各関数でconstants直接参照を`state.config.xxx`に1ファイルずつ置換
4. `constants.ts`のexportを削除、`createDefaultConfig()`内部でのみ使用

**理由:** 一括置換は危険。1ファイルずつ移行してテストを通すことで安全に進める。

### D5: 勇者AI抽象化

**選択:** Strategy patternでAI実装を差し替え可能にする

```typescript
export interface HeroAIStrategy {
  calculateMove(hero: HeroEntity, state: GameState): HeroMoveResult
}
```

- `RuleBasedAI`: 既存のcalculateHeroMove()をラップ
- `LlmAI`: GameStateをプロンプト化→API呼び出し→行動決定

**理由:** 既存AIを壊さず、Phase 3でLLM版を追加するだけで済む。configの`hero.aiType`で切替。

### D6: 非同期対戦のスコア定義

**選択:** 初期スコアは「勇者を何tick耐えたか（gameTime）」

**理由:** 最もシンプルで実装コストゼロ（既にGameStateにgameTimeがある）。将来的にスコア計算式をカスタマイズ可能にもできるが、1 pass目はこれで十分。

## Risks / Trade-offs

**[R1] GameState破壊的変更による既存テスト修正** → テストのGameState生成にconfigが必要になる。createDefaultConfig()を注入するヘルパーを用意し、修正量を最小化する。

**[R2] PhaseConfigの汎用化が困難** → 3種モンスターのフェーズ遷移条件はそれぞれ異なる（養分閾値、tick数、life条件の組み合わせ）。初期実装ではモンスター種ごとの固有ロジックをそのまま残し、条件値のみconfigから読む形にする。完全な汎用化は将来課題。

**[R3] LLM API呼び出しのレイテンシ** → tick毎にAPI呼び出しするとゲームが止まる。バッチ処理（数tick分の行動を一括計画）またはWebWorkerでの非同期実行で対応。詳細はPhase 3実装時に設計する。

**[R4] カスタムConfig の壊れた値** → ユーザーがlife=0やattack=-1を設定する可能性。バリデーション関数`validateConfig()`を用意し、最低限の整合性チェック（正数、predationTargetsが実在するtype等）を行う。
