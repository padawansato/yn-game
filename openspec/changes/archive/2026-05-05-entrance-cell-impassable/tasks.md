## 1. 実装

- [x] **1.1** `src/core/types.ts`: CellType に `'entrance'` を追加
- [x] **1.2** `src/core/spawn.ts:75-76`: 入口セル初期化を `type: 'entrance'` に変更
- [x] **1.3** `src/components/grid-view-helpers.ts`: `getCellDisplay` の switch に `case 'entrance': return '門'` を追加
- [x] **1.4** `src/core/simulation.test.ts:905-912`: 既存 `entrance cell is empty` テストを `entrance cell has type 'entrance'` に修正

## 2. テスト追加

- [x] **2.1** `src/core/movement/straight.test.ts`: `isValidMove` が `'entrance'` セルで false を返すテストを追加
- [x] **2.2** `src/components/GridView.test.ts`: 各 grid サイズで entrance セルが `type === 'entrance'` を持ち '門' を表示するテストを追加 (parametric test 内)

## 3. 検証

- [x] **3.1** `pnpm test -- --run` で全テスト pass を確認 (342 件)
- [x] **3.2** `pnpm lint` で lint クリーン
- [x] **3.3** `pnpm exec vue-tsc -b` で型エラー無し

## 4. spec 更新

- [x] **4.1** delta spec (`openspec/changes/entrance-cell-impassable/specs/hero-spawn/spec.md`) 作成
- [ ] **4.2** `openspec change validate entrance-cell-impassable` で validate

## 5. PR / merge / tag / archive

- [ ] **5.1** commit + push
- [ ] **5.2** PR 作成 (closes #56)
- [ ] **5.3** CI green 確認
- [ ] **5.4** `gh pr merge --squash --delete-branch` で manual merge
- [ ] **5.5** main pull → `git tag v0.5.1` → `git push --tags`
- [ ] **5.6** `gh issue close 56`
- [ ] **5.7** archive change (spec/archive ブランチ → archive PR → manual merge)
- [ ] **5.8** worktree 削除
