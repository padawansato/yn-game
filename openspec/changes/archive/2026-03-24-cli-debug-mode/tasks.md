## 1. 共有ユーティリティの切り出し

- [x] 1.1 `createSeededRandom()` を `src/core/random.ts` に移動（debug.tsから抽出）
- [x] 1.2 `src/core/index.ts` からexport
- [x] 1.3 debug.ts を新モジュールのimportに切り替え

## 2. 表示モジュール (`src/cli/display.ts`)

- [x] 2.1 `renderGrid()`: 半角2文字/セル、ANSI色対応のグリッド文字列生成
- [x] 2.2 セル記号マップ: `##`(壁), `..`(土), `  `(空)
- [x] 2.3 モンスター記号マップ: Nj/Nb/Nf/Nw, Gj/Gp/Ga, Lz/Ll/Eg
- [x] 2.4 ANSI色: green=nijirigoke, blue=gajigajimushi, red=lizardman
- [x] 2.5 重なり表示: 同セル複数体は数字+最優先モンスターの色
- [x] 2.6 `renderMonsterList()`: モンスター一覧のカラム整列表示
- [x] 2.7 `renderMonsterDetail()`: 単体モンスターの詳細表示
- [x] 2.8 `renderEvents()`: イベントのフォーマット表示
- [x] 2.9 `renderStatus()`: ゲーム状態サマリ（時間, 養分, 掘力, 魔物数）

## 3. シナリオモジュール (`src/cli/scenarios.ts`)

- [x] 3.1 App.vue と debug.ts のシナリオ定義を共通モジュールに切り出し
- [x] 3.2 `getScenarios()`: シナリオ一覧を返す
- [x] 3.3 `loadScenario(name)`: 名前指定でGameStateを生成

## 4. コマンドパーサー (`src/cli/commands.ts`)

- [x] 4.1 コマンド文字列のパース: コマンド名 + 引数の分離
- [x] 4.2 `dig <x>,<y>` パース（座標バリデーション含む）
- [x] 4.3 `tick [N]` パース（デフォルト1、数値バリデーション）
- [x] 4.4 `monsters [type]` パース
- [x] 4.5 `monster <id>` パース
- [x] 4.6 `scenario <name>` パース
- [x] 4.7 `seed <N>` パース

## 5. REPL本体 (`src/cli.ts`)

- [x] 5.1 readline REPL起動、プロンプト `yn> `
- [x] 5.2 `--seed <N>` コマンドライン引数パース
- [x] 5.3 初期状態: デフォルトゲーム作成 + グリッド表示 + ステータス表示
- [x] 5.4 `dig` コマンド: dig実行 → 結果表示 → グリッド再表示
- [x] 5.5 `tick` コマンド: tick実行 → イベント表示
- [x] 5.6 `run` / `stop` コマンド: setInterval自動tick + イベント表示
- [x] 5.7 `status` コマンド: renderStatus呼び出し
- [x] 5.8 `grid` コマンド: renderGrid呼び出し
- [x] 5.9 `monsters` / `monster` コマンド: 一覧/詳細表示
- [x] 5.10 `scenario` コマンド: シナリオロード + 表示
- [x] 5.11 `seed` コマンド: PRNG再初期化
- [x] 5.12 `reset` コマンド: 初期状態に戻す
- [x] 5.13 `help` コマンド: コマンド一覧表示
- [x] 5.14 `quit` / `exit` コマンド: プロセス終了
- [x] 5.15 不明コマンドのエラーメッセージ

## 6. 動作確認

- [x] 6.1 `docker compose run --rm app pnpm exec npx tsx src/cli.ts` で起動確認
- [x] 6.2 dig → モンスター生成 → tick → ライフサイクル進行の一連フロー確認
- [x] 6.3 scenario lizardman-egg → tick 40 → 孵化確認
- [x] 6.4 lint / 型チェック通過
