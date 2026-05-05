## Why

ユーザー指摘により、入口セル (entrance) はゆうなま原作と同じく「**勇者は通過できるが、モンスターは進入できない**」セマンティクスが期待されていることが判明した。

現状の実装と spec (`hero-spawn` capability `Entrance cell type` scenario) は entrance を `type: 'empty'` で生成しており、結果としてモンスターは entrance を素通り可能になっている。spec ・実装ともに修正が必要。

## What Changes

### CellType の拡張

- `src/core/types.ts` の `CellType` に `'entrance'` を追加 (`'soil' | 'empty' | 'wall' | 'entrance'`)
- 入口セル (`entrancePosition`) は初期化時に `type: 'entrance'` で生成される (従来は `'empty'`)

### モンスターの進入禁止 (実装変更ゼロで成立)

`src/core/movement/straight.ts:23-27` の `isValidMove()` は `type === 'empty'` のみを通過可と判定する。本 change で `'entrance'` という新しい型を導入することで、上記ガードにより自動的にモンスターの進入を block する。**移動ロジック側の変更は不要**。

### 勇者の挙動 (変更不要)

勇者の spawn (`src/core/hero/spawn.ts`) と return path (`src/core/hero/ai.ts`) は `entrancePosition` を Position として直接参照しており、cell type のチェックを経由しない:
- spawn: `hero.position = entrancePosition` (cell type 不問)
- exploration: 勇者は entrance を visited から開始するため、自分から entrance に入ろうとしない
- return: pathHistory を popping し、`hasMonsterAt` のみチェック (`isPassable` 不通過)

つまり勇者の出入りは従来通り機能する。

### 表示 (最小調整)

- `src/components/grid-view-helpers.ts` の `getCellDisplay()` の switch 文は exhaustive。`case 'entrance': return '門'` を追加する (実際は `isEntranceCell` Position-based check が先に hit するため到達しないが、TypeScript 網羅性のため)
- 既存の `entrance-cell` クラス (Position-based) と `.entrance-cell` スタイルはそのまま機能する

### spec 変更 (MODIFIED)

- `openspec/specs/hero-spawn/spec.md` の `Entrance cell type` scenario:
  - 変更前: "the entrance cell SHALL be of type 'empty' (passable)"
  - 変更後: "the entrance cell SHALL be of type 'entrance' (passable for heroes, impassable for monsters)"
- 同 capability に新 Scenario を追加: `Monsters cannot enter entrance cell`

### テスト

- `src/core/movement/straight.test.ts`: `isValidMove` が `'entrance'` セルに対して false を返すユニットテストを追加
- `src/components/GridView.test.ts`: parametric test に entrance cell の type=='entrance' 検証 + '門' 表示テストを追加
- 既存 `simulation.test.ts` の `entrance cell is empty` test は新仕様に合わせ rename + 期待値更新済み (uncommitted で先行修正)

## Capabilities

### Modified Capabilities

- `hero-spawn`: `Entrance cell type` requirement を **`'empty'` → `'entrance'`** に変更し、新 scenario `Monsters cannot enter entrance cell` を追加

### New Capabilities

なし

## Impact

- **コード**
  - `src/core/types.ts`: CellType に 'entrance' 追加 (1 行)
  - `src/core/spawn.ts:75-76`: 入口セル初期化を `type: 'entrance'` に (2 行)
  - `src/components/grid-view-helpers.ts`: switch に 'entrance' case 追加 (2 行)
  - `src/core/movement/`, `src/core/predation.ts`, `src/core/hero/`, `src/App.vue` style: **変更不要**
- **テスト**
  - 追加: `straight.test.ts` の isValidMove (entrance) test 1 件
  - 追加: `GridView.test.ts` parametric test 1 件
  - 修正: `simulation.test.ts:911-912` の test 名 + 期待値 (uncommitted で先行)
- **ユーザー視点の変化**
  - large 30×40 などで生態系が画面上方の entrance に到達したとき、entrance に「居座って外に出る」モンスターが出なくなる
  - 表示は変更なし (門 アイコン継続)
- **後続 change**
  - 既存 `hero-spawn` capability spec を本 change で MODIFIED するため、archive 後 main spec が更新される
