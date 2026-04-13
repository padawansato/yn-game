---
paths:
  - "src/**/*.ts"
  - "src/**/*.vue"
  - "openspec/specs/**/*.md"
---

# 単一ソース・オブ・トゥルース (SSoT)

## 原則

設定値・定数は **単一箇所** に定義し、全ての利用箇所からそれを参照する。同じ値を複数の場所に書かない。

## ハードコード禁止

- `src/core/constants.ts` や `GameConfig`、`openspec/specs/` で既に定義されている値を、他ファイルで独自リテラルとして書かない
- 特にゲームパラメータ（`grid.defaultWidth/Height`、モンスター定数、しきい値など）は `GameConfig` 経由で参照する
- シナリオなど「固有の値を使いたい」ケースも、base config を spread で override する形に統一する

```ts
// NG: ハードコード
const state = createGameState(10, 8, 1.0)

// NG: シナリオごとにリテラルを書く
const grid = makeEmptyArena(12, 10)

// OK: config 経由
const state = createGameState(
  config.grid.defaultWidth,
  config.grid.defaultHeight,
  1.0,
)

// OK: シナリオ固有サイズは base を override
const scenarioConfig = {
  ...baseConfig,
  grid: { ...baseConfig.grid, defaultWidth: 12, defaultHeight: 10 },
}
```

## 仕様と実装の整合チェック

spec で定義した型・構造は **実装で実際に使われていなければならない**。

- `openspec verify` では「実装が spec 通りか」は検証されるが、「spec の構造が実装に使われているか」の逆向きは検証されない
- PR レビュー時 / change 完了時に、spec で追加した型・field が実装のどこで消費されているか確認する
- 「spec は定義しているが実装が無視している」ケースは **実質的な乖離**

### 教訓

`GameConfig.grid.defaultWidth/Height` は spec・型で定義済みだったが、`src/App.vue` がそれを無視して `createGameState(10, 8, 1.0)` とハードコードしていた。さらに 4 つのシナリオが `makeEmptyArena(12, 10)` と別のリテラルを持ち、結果として **同じ概念が 3 通りの値で散在** する状態だった（2026-04 Issue #47 で発覚）。

## レビュー時のチェックリスト

- [ ] 同じリテラル値が複数ファイルに出現していないか
- [ ] config / constants / spec で既に定義済みの値を bypass していないか
- [ ] spec で追加した型・field が実装のどこで消費されているか確認したか
