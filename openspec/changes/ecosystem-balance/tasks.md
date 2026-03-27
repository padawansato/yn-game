## 1. 定数変更

- [x] 1.1 `src/core/constants.ts`: MONSTER_CONFIGS.nijirigoke.life を 16 → 24 に変更
- [x] 1.2 `src/core/constants.ts`: PUPA_DURATION を 10 → 6 に変更
- [x] 1.3 `src/core/constants.ts`: GAJI_REPRO_LIFE_THRESHOLD を 10 → 6 に変更

## 2. ロジック変更

- [x] 2.1 `src/core/simulation.ts`: flower相のlife減少を 2/tick → 1/tick（MOVEMENT_LIFE_COST）に変更

## 3. テスト更新

- [x] 3.1 定数変更に依存するテストの期待値を更新（nijirigoke.life=24, PUPA_DURATION=6, GAJI_REPRO_LIFE_THRESHOLD=6）
- [x] 3.2 flower相のlife減少テストを 2→1 に更新
- [x] 3.3 全テスト通過確認: `docker compose run --rm app pnpm test`

## 4. 動作確認

- [ ] 4.1 ブラウザでシミュレーション実行し、ニジリゴケが繁殖フェーズに到達することを確認
- [ ] 4.2 ガジガジムシがpupa→adult→繁殖サイクルを回すことを確認
