## Context

ニジリゴケの初期life値は `src/core/constants.ts` の `MONSTER_CONFIG.nijirigoke.life` で定義されている。現在の値は10。

## Goals / Non-Goals

**Goals:**
- ニジリゴケのlife値を16に変更
- 関連テストの期待値を更新

**Non-Goals:**
- 他のモンスターのステータス変更
- ゲームバランス全体の調整

## Decisions

### 定数値の直接変更
`MONSTER_CONFIG.nijirigoke.life` を `10` から `16` に変更する。

理由: 単一箇所の定数変更で完結し、他の計算ロジックへの影響はない。

## Risks / Trade-offs

- [リスク] テストの期待値がハードコードされている箇所がある → テストファイルも更新
