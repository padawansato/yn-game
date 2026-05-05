## 1. composable 実装 (TDD)

- [x] **1.1** `src/composables/useKeyboardShortcuts.ts` 新規作成
- [x] **1.2** `src/composables/useKeyboardShortcuts.test.ts` 新規作成 (16 件)

## 2. ヘルプモーダル

- [x] **2.1** `src/components/KeyboardHelpModal.vue` 新規作成
- [x] **2.2** `src/components/KeyboardHelpModal.test.ts` 新規作成 (7 件)

## 3. App.vue 統合

- [x] **3.1** `useKeyboardShortcuts` を setup() で呼び出し、各 handler を bind
- [x] **3.2** `KeyboardHelpModal` を template に追加 (`isHelpOpen` で v-if)
- [x] **3.3** `?` UI ボタン追加 (Reset の隣)
- [x] **3.4** App.test.ts に integration test 追加 (5 件)
- [x] **3.5** `src/App.css` に `.help-btn` スタイル追加

## 4. 検証

- [x] **4.1** `pnpm test -- --run` で全テスト pass (419 件)
- [x] **4.2** `pnpm lint` で クリーン
- [x] **4.3** `pnpm exec vue-tsc -b` で 型エラー無し

## 5. spec / PR

- [x] **5.1** delta spec (`openspec/changes/keyboard-shortcuts/specs/keyboard-shortcuts/spec.md`) 作成
- [ ] **5.2** `openspec validate keyboard-shortcuts --strict` で pass
- [ ] **5.3** PR 更新 (commit 追加 + push)
- [ ] **5.4** CI green 確認 → manual merge → tag v0.6.0 → close #53 → archive
