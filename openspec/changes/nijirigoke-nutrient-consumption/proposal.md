## Why

ニジリゴケが養分を吸収しても長生きできない問題がある。現状では移動するたびにライフが減少し、養分を持っていても10ターン程度で餓死してしまう。原作ゲームでは養分が豊富なエリアにいれば長く生き延びられる仕様であり、これを再現する必要がある。

## What Changes

- ニジリゴケが移動時に養分を消費してライフを維持できるようになる
- 養分がない場合は従来通りライフが減少する
- 養分リリース閾値（2）以下になってもライフ維持のために消費可能

## Capabilities

### New Capabilities

- `nijirigoke-survival`: ニジリゴケが運搬中の養分を消費してライフを維持する仕組み

### Modified Capabilities

- `nutrient-system`: 養分消費によるライフ維持の仕様を追加

## Impact

- `src/core/simulation.ts`: `decreaseLifeForMoved`関数の修正
- `src/core/simulation.test.ts`: 養分消費テストの追加
- 既存の養分システムとの整合性確認が必要
