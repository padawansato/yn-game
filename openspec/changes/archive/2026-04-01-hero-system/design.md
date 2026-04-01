## Context

yn-gameは2Dグリッドベースのダンジョン経営シミュレーション。現在、3種のモンスター（ニジリゴケ、ガジガジムシ、リザードマン）が生態系を形成している。`simulation.ts` の `tick()` が毎ティックの処理を順序実行し、`GameState` が全状態を保持する。

勇者システムは、このシミュレーションに「外敵」としての勇者を追加する初の大規模機能拡張となる。

## Goals / Non-Goals

**Goals:**

- 勇者エンティティをモンスターとは独立した型として導入し、既存コードへの影響を最小化する
- 自律AIによる探索→帰還の勇者行動ループを実装する
- 前方セル攻撃による勇者-モンスター間の戦闘システムを構築する
- 既存の `tick()` フローに勇者処理ステップを自然に統合する

**Non-Goals:**

- Wave制（複数パーティーの連続侵入）— 将来スコープ
- 勇者間の情報共有 — 将来スコープ（高レベル勇者向け）
- 勇者の装備・レベルアップシステム — 将来スコープ
- プレイヤーによる勇者の直接操作
- UI/表示の変更（コアロジックのみ）

## Decisions

### D1: エンティティモデル — Discriminated Union

**決定**: `Monster` と `Hero` を別インターフェースとし、`GameState` 上で別配列（`monsters[]`, `heroes[]`）として管理する。（当初 `Entity = Monster | Hero` の union 型を検討したが、既存コードへの影響最小化のため別配列方式を採用。）

**代替案**:
- A) MonsterType に `'hero'` を追加 — tick()がそのまま動くが、nestPosition等の不要フィールドを持つ。`if (type !== 'hero')` ガードが散在する
- B) 完全に独立したエンティティ — 衝突解決・セル占有判定の二重管理が必要

**理由**: Hero固有のフィールド（visitedCells, pathHistory, attackPattern）を型安全に持てる。同時に、position/direction/life/attack は共通なので、戦闘判定等で `Entity` として統一的に扱える。

```typescript
interface HeroEntity {
  kind: 'hero'
  id: string
  position: Position
  direction: Direction
  life: number
  maxLife: number
  attack: number
  attackPattern: HeroAttackPattern
  visitedCells: Set<string>      // 探索済みセル（"x,y" 形式）
  pathHistory: Position[]        // 移動経路（帰還時に逆順で辿る）
  state: HeroState               // 'exploring' | 'returning' | 'dead'
  targetFound: boolean           // 魔王を発見したか
}
```

### D2: GameState の拡張

**決定**: `GameState` に `heroes`, `entrancePosition`, `demonLordPosition`, `heroSpawnConfig` を追加する。

```typescript
interface GameState {
  // 既存フィールド...
  heroes: HeroEntity[]
  entrancePosition: Position           // グリッド上部中央
  demonLordPosition: Position          // 魔王フラグの位置
  heroSpawnConfig: HeroSpawnConfig     // スポーン設定
  nextHeroId: number
  isGameOver: boolean
}

interface HeroSpawnConfig {
  partySize: number                    // 1〜3
  spawnStartTick: number               // スポーン開始ティック
  spawnInterval: number                // 勇者間の出現間隔（tick）
  heroesSpawned: number                // 既にスポーンした勇者数
}
```

**理由**: 入口と魔王の位置はゲーム開始時に決定し変わらないため、`GameState` に直接保持する。Cell型を拡張するよりシンプル。

### D3: tick() への統合 — 既存フローの後に勇者ステップを追加

**決定**: 既存の7ステップ（move → conflict → predation → nutrient → lifeCost → phase）の**後に**勇者処理を追加する。

```
既存フロー:
  1. calculateAllMoves()
  2. resolveConflicts()
  3. applyMovements()
  4. processNestEstablishment()
  5. processPredation()
  6. processNutrientInteractions()
  7. decreaseLifeForMoved()
  8. processPhaseTransitions() + moyomoyoAttacks

勇者フロー（新規）:
  9. processHeroSpawns()        — スポーン条件チェック
  10. calculateHeroMoves()      — AI移動計算
  11. processHeroCombat()       — 前方セル攻撃（勇者→モンスター、モンスター→勇者）
  12. processHeroReturnCheck()  — 帰還判定 → GAME_OVER
```

**代替案**: 勇者とモンスターの移動を統合して同時解決 — 衝突解決の複雑化を避けるため却下

**理由**: モンスターが先に行動し、その結果に対して勇者が行動する。これにより既存のモンスターロジックに一切手を加えずに済む。

### D4: 戦闘システム — 前方セル攻撃

**決定**: 勇者とモンスターは毎tick、自分の向いている方向の前方1セルにいる対象に自動攻撃する。

```
攻撃判定:
  1. 各勇者について、前方1セルにモンスターがいれば hero.attack のダメージ
  2. 各モンスターについて、前方1セルに勇者がいれば monster.attack のダメージ
  3. ダメージは同時適用（同一tickで相討ちあり）
  4. life <= 0 で死亡処理
```

- 同一セルは原則攻撃判定なし（将来の特殊攻撃パターンで例外を追加）
- モンスターの attack=0（ニジリゴケ）は勇者に反撃できない

**`src/core/combat.ts`** として独立モジュール化し、勇者-モンスター間の戦闘ロジックを分離する。

### D5: 勇者AI — 深さ優先的ランダム探索

**決定**: 勇者は以下のアルゴリズムで移動する。

**探索モード (`state: 'exploring'`)**:
1. 前方セルが通行可能 かつ 未踏 → 前進
2. 前方が壁/踏破済み → 未踏の隣接セル（左・右・後）からランダム選択
3. 全隣接が踏破済み → pathHistoryを1つ戻る（バックトラック）
4. 魔王フラグのセルに到達 → `targetFound = true`, `state = 'returning'`

**帰還モード (`state: 'returning'`)**:
1. `pathHistory` を逆順に辿る（1tick = 1セル移動）
2. 途中でモンスターに阻まれても方向転換せず、戦闘しながら帰還を続行
3. 入口セルに到達 → `HERO_ESCAPED` → `GAME_OVER`

**`src/core/hero/ai.ts`** に実装。

### D6: ファイル構成

```
src/core/
├── hero/
│   ├── ai.ts         ← 探索・帰還AI
│   ├── spawn.ts      ← スポーン処理
│   └── types.ts      ← Hero固有の型定義
├── combat.ts          ← 前方セル攻撃の戦闘判定
├── simulation.ts      ← tick()に勇者ステップ統合
├── types.ts           ← Entity union型、GameState拡張
└── constants.ts       ← 勇者関連定数
```

## Risks / Trade-offs

**[tick順序依存]** モンスター→勇者の順序で処理するため、モンスターが若干有利（先に移動・攻撃）。
→ ゲームデザイン上、モンスター側（プレイヤー側）が有利なのは意図通り。

**[探索AIの性能]** 大きなグリッドでバックトラックが多発すると、勇者が長時間さまよう可能性。
→ 初期実装では許容。将来、A*等の高度なパスファインディングを高レベル勇者に導入する余地を残す。

**[GameState肥大化]** heroes配列、spawnConfig等が追加されGameStateが大きくなる。
→ 現時点では許容範囲。将来的にサブステート分割を検討。

**[visitedCells のメモリ]** Set<string> で全訪問セルを保持する。
→ グリッドサイズが有限（現状30×20程度）なので最大600エントリ。問題なし。

## Open Questions

- 勇者の初期ステータス（HP, 攻撃力）の具体的な数値バランス — specs で定義
- 魔王フラグの初期配置ルール（固定位置 or ランダム）— specs で定義
- 勇者が壁（soil）に遭遇した時の挙動（掘れる？迂回のみ？）— specs で定義
