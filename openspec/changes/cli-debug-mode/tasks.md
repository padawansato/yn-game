## 1. 共有ユーティリティの切り出し

- [ ] 1.1 `createSeededRandom()` を `src/core/random.ts` に移動（debug.tsから抽出）
- [ ] 1.2 `src/core/index.ts` からexport
- [ ] 1.3 debug.ts を新モジュールのimportに切り替え

## 2. 表示モジュール (`src/cli/display.ts`)

- [ ] 2.1 `renderGrid()`: 半角2文字/セル、ANSI色対応のグリッド文字列生成
- [ ] 2.2 セル記号マップ: `##`(壁), `..`(土), `  `(空)
- [ ] 2.3 モンスター記号マップ: Nj/Nb/Nf/Nw, Gj/Gp/Ga, Lz/Ll/Eg
- [ ] 2.4 ANSI色: green=nijirigoke, blue=gajigajimushi, red=lizardman
- [ ] 2.5 重なり表示: 同セル複数体は数字+最優先モンスターの色
- [ ] 2.6 `renderMonsterList()`: モンスター一覧のカラム整列表示
- [ ] 2.7 `renderMonsterDetail()`: 単体モンスターの詳細表示
- [ ] 2.8 `renderEvents()`: イベントのフォーマット表示
- [ ] 2.9 `renderStatus()`: ゲーム状態サマリ（時間, 養分, 掘力, 魔物数）

## 3. シナリオモジュール (`src/cli/scenarios.ts`)

- [ ] 3.1 App.vue と debug.ts のシナリオ定義を共通モジュールに切り出し
- [ ] 3.2 `getScenarios()`: シナリオ一覧を返す
- [ ] 3.3 `loadScenario(name)`: 名前指定でGameStateを生成

## 4. コマンドパーサー (`src/cli/commands.ts`)

- [ ] 4.1 コマンド文字列のパース: コマンド名 + 引数の分離
- [ ] 4.2 `dig <x>,<y>` パース（座標バリデーション含む）
- [ ] 4.3 `tick [N]` パース（デフォルト1、数値バリデーション）
- [ ] 4.4 `monsters [type]` パース
- [ ] 4.5 `monster <id>` パース
- [ ] 4.6 `scenario <name>` パース
- [ ] 4.7 `seed <N>` パース

## 5. REPL本体 (`src/cli.ts`)

- [ ] 5.1 readline REPL起動、プロンプト `yn> `
- [ ] 5.2 `--seed <N>` コマンドライン引数パース
- [ ] 5.3 初期状態: デフォルトゲーム作成 + グリッド表示 + ステータス表示
- [ ] 5.4 `dig` コマンド: dig実行 → 結果表示 → グリッド再表示
- [ ] 5.5 `tick` コマンド: tick実行 → イベント表示
- [ ] 5.6 `run` / `stop` コマンド: setInterval自動tick + イベント表示
- [ ] 5.7 `status` コマンド: renderStatus呼び出し
- [ ] 5.8 `grid` コマンド: renderGrid呼び出し
- [ ] 5.9 `monsters` / `monster` コマンド: 一覧/詳細表示
- [ ] 5.10 `scenario` コマンド: シナリオロード + 表示
- [ ] 5.11 `seed` コマンド: PRNG再初期化
- [ ] 5.12 `reset` コマンド: 初期状態に戻す
- [ ] 5.13 `help` コマンド: コマンド一覧表示
- [ ] 5.14 `quit` / `exit` コマンド: プロセス終了
- [ ] 5.15 不明コマンドのエラーメッセージ

## 6. 動作確認

- [ ] 6.1 `docker compose run --rm app pnpm exec npx tsx src/cli.ts` で起動確認
- [ ] 6.2 dig → モンスター生成 → tick → ライフサイクル進行の一連フロー確認
- [ ] 6.3 scenario lizardman-egg → tick 40 → 孵化確認
- [ ] 6.4 lint / 型チェック通過
