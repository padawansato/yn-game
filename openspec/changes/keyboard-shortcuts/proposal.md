## Why

デバッグ UI のすべての操作 (Start/Pause、Tick、Reset、preset 切替、シナリオ起動、勇者呼び出し) はマウスクリック専用で、頻繁に検証する開発者体験が悪かった。Issue #53 で「キーボード操作を追加」が要望され、合わせてバインディングを思い出せる仕組み (ヘルプモーダル) も必要。

## What Changes

### 新 capability: `keyboard-shortcuts`

`useKeyboardShortcuts` composable を `src/composables/` に追加。各キーバインディングを optional handler として受け取り、`onMounted` で `window.keydown` listener を登録、`onUnmounted` で removeEventListener。

サポートするバインディング:
- `Space` → Start / Pause / Resume トグル
- `T` → 1 tick
- `R` → Reset
- `1` / `2` → 小 / 大プリセット切替
- `F1`〜`F4` → シナリオ 1〜4
- `D` / `H` → 勇者を呼ぶ (魔王配置モード突入)
- `?` → ヘルプモーダル開閉
- `Escape` → ヘルプ閉じ → 配置モード解除

### キーガード

`document.activeElement` が `INPUT` / `TEXTAREA` / contenteditable のときは全ショートカット無効。テキスト入力との衝突を回避。

### ヘルプモーダル

`src/components/KeyboardHelpModal.vue` を新規追加。バインディング一覧テーブル + overlay クリック / × ボタン / Escape で close。`?` キーまたは「`?`」UI ボタン (Reset の隣) で open。

### 既存 capability への影響

`game-config` / `grid-size-preset` などの既存仕様は **変更なし**。本 change は UI 入力レイヤの純粋な追加 (キーボード経路) で、既存のクリック経路は維持。

## Capabilities

### New Capabilities

- `keyboard-shortcuts`: グローバルキーボード入力のバインディング、ガード、ヘルプ提示の要件を定義する

### Modified Capabilities

なし

## Impact

- **コード (新規)**
  - `src/composables/useKeyboardShortcuts.ts`
  - `src/components/KeyboardHelpModal.vue`
- **コード (変更)**
  - `src/App.vue`: composable と modal を import + wire up (約 35 行追加)
  - `src/App.css`: `.help-btn` 用スタイル (約 12 行追加)
- **テスト**
  - `src/composables/useKeyboardShortcuts.test.ts` (16 件)
  - `src/components/KeyboardHelpModal.test.ts` (7 件)
  - `src/App.test.ts` keyboard integration (5 件)
- **ユーザー視点の変化**
  - キーボードのみで全操作可能 (検証速度向上)
  - 「`?`」ヘルプボタンが Reset の隣に追加 (バインディング離散性の解消)
- **後続 change**
  - 将来の機能追加時にバインディングを追加する場合は `useKeyboardShortcuts` の `ShortcutHandlers` interface を拡張する
