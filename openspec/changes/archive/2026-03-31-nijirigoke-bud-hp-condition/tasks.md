## 1. bud遷移にminMobileTicks条件追加

- [x] 1.1 phase-transitions.tsのprocessNijirigokePhase: mobileフェーズでphaseTickCounterを毎tick増加、bud遷移条件に `phaseTickCounter >= minMobileTicks` を追加
- [x] 1.2 config.tsのMonsterTypeConfigに `minMobileTicks` フィールド追加（デフォルト: 8）
- [x] 1.3 simulation.test.tsのbud遷移テストを更新（minMobileTicks条件を反映）
- [x] 1.4 integration.test.tsにminMobileTicks E2Eテスト追加
- [x] 1.5 全テスト通過を確認（286通過）
