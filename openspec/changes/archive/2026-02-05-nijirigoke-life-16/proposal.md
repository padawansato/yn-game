## Why

ニジリゴケの初期life値10では生存時間が短すぎるため、16に引き上げてバランスを調整する。

## What Changes

- ニジリゴケの初期life値を10から16に変更

## Capabilities

### New Capabilities

なし

### Modified Capabilities

- `monster-types`: ニジリゴケのlife値を10から16に変更

## Impact

- `src/core/constants.ts`: MONSTER_CONFIG.nijirigoke.life の値変更
- 関連テストの期待値更新
