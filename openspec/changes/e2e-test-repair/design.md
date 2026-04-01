## Context

E2Eテストが作成時から壊れている。原因は2つ:
1. テストコードが実在しないCSSセレクタを使用（`.game-container`等）
2. Docker Compose の e2e サービスがPlaywrightバージョン不一致・npm使用

現在のUI (`src/App.vue`) はシングルコンポーネントで、全要素がCSS classで識別可能。
Playwrightは `@playwright/test: ^1.58.1` を使用中。

## Goals / Non-Goals

**Goals:**
- E2Eテストが `docker compose --profile e2e run --rm e2e` で実行可能になる
- nutrient-system / hero-system / nijirigoke-scenario の3分野でE2Eテストが通る
- セレクタ変更時の修正箇所を最小化する（Page Object Model）

**Non-Goals:**
- CI (GitHub Actions) へのE2E統合（別PR）
- 全仕様の網羅的E2Eカバレッジ（最小限で十分）
- Playwright Component Testing の導入
- App.vue のUI構造変更（テスト容易性のためのdata-testid追加等）

## Decisions

### D1: Page Object Model でセレクタを一元管理

`e2e/helpers/game-page.ts` にセレクタとアクションを集約する。

**理由**: App.vueはシングルコンポーネントでクラス名が変わりやすい。セレクタをテスト全体に散在させると、UI変更時に全テスト修正が必要になる。

**代替案**: data-testid属性の追加 → App.vueへの変更が必要になるため却下。現在のclass/title属性で十分特定可能。

### D2: セル特定にtitle属性を使用

各セルの `title="(x,y) 養分:N"` 属性でグリッド座標を特定する。

**理由**: CSSクラスはセルの種別を示すが座標情報を持たない。title属性は座標と養分量の両方を含み、安定している。

### D3: Tickボタンによる deterministic テスト制御

自動再生（Start/Stop）ではなく、Tickボタンの繰り返しクリックでゲームを進行させる。

**理由**: `waitForTimeout` ベースのテストはタイミング依存でflakyになる。Tickボタン1クリック = 1ゲームtickで決定論的に制御できる。

### D4: Docker Compose e2e サービスは Playwright公式イメージを使用

アプリのDockerfile拡張ではなく、`mcr.microsoft.com/playwright` イメージにpnpmをインストールして使う。

**理由**: Playwright公式イメージにはブラウザとシステム依存が全て含まれている。アプリのDockerfileにブラウザ依存を追加すると開発用イメージが肥大化する。

**代替案**: Dockerfile.e2e を別途作成 → イメージビルドのメンテコストが増えるため却下。

### D5: シナリオボタンを活用して既知の初期状態を作る

hero-system や nijirigoke-scenario のテストでは、App.vueのシナリオボタン（「ニジリゴケ変態」等）を使って初期状態をセットアップする。

**理由**: E2Eテストでは内部APIを直接呼べないため、UIから到達可能な初期状態が必要。シナリオボタンはデバッグUI用に既に存在する。

## Risks / Trade-offs

- **[Playwrightイメージバージョン]** → `pnpm exec playwright --version` の出力に合わせたイメージバージョンを使用。pnpm-lock.yamlの更新時にイメージも更新が必要
- **[シナリオ依存テスト]** → シナリオの初期値が変更されるとE2Eが壊れる。ただしそれは意図した検知であり、リスクではなく利点
- **[hero-system E2Eの複雑性]** → 勇者AI探索は非決定論的要素がある（ランダム方向選択）。特定の位置到達ではなく「勇者セルが存在する」「イベントが発生する」レベルのアサーションに留める
