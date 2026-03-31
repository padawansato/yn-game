## Context

現在のbud遷移条件は `carryingNutrient >= budNutrientThreshold` のみ。原作では「HPが減った状態」も必要。

## Goals / Non-Goals

**Goals:**
- bud遷移にmobileフェーズ最低滞在時間を追加し、即遷移を防ぐ

**Non-Goals:**
- 閾値の数値変更

## Decisions

| # | 決定 | 根拠 |
|---|------|------|
| D1 | `phaseTickCounter >= minMobileTicks` を条件に追加 | E2E実験で `life < maxLife` はデッドロック（養分で移動コスト支払い→life不変）と掘削スポーン時の無効化が判明。時間ベースが最もシンプルで確実 |
| D2 | デフォルト `minMobileTicks: 8` | 実験結果からtick 8でbud化（約1.5秒の猶予）。プレイ感として自然 |
| D3 | mobileフェーズでphaseTickCounterを毎tick増加 | 既存のphaseTickCounterフィールドを活用。他フェーズ（pupa, laying, egg）と同じパターン |

## Risks / Trade-offs

- minMobileTicksが長すぎると、養分豊富な環境でも蕾化が遅れてテンポが悪くなる → 8tickは実験で適切と確認
