<!-- Based on: v0.4.2 -->
# 食物連鎖

## 捕食関係

```mermaid
graph TD
    LZ["🦎 リザードマン\n(最上位捕食者)"]
    GJ["🐛 ガジガジムシ\n(中位捕食者)"]
    NJ["🌿 ニジリゴケ\n(生産者)"]
    EGG["🥚 卵\n(リザードマンの卵)"]

    LZ -->|捕食| GJ
    LZ -->|捕食| NJ
    GJ -->|捕食| NJ
    GJ -->|捕食| EGG

    style LZ fill:#e74c3c,color:#fff
    style GJ fill:#f39c12,color:#fff
    style NJ fill:#27ae60,color:#fff
    style EGG fill:#ecf0f1,color:#333
```

## 捕食メカニクス

```mermaid
flowchart LR
    A[同一セルに\n捕食者と被食者] --> B{捕食関係\nあり?}
    B -->|Yes| C[被食者を除去]
    C --> D[被食者のlife →\n捕食者のlife回復\nmaxLifeで上限]
    C --> E[被食者のcarryingNutrient →\n捕食者に移転\nグリッドに放出しない]
    B -->|No| F[共存\n攻撃なし]
```

## 捕食可能マトリクス

| 捕食者 ＼ 被食者 | ニジリゴケ | ガジガジムシ | リザードマン | 卵 |
|:---:|:---:|:---:|:---:|:---:|
| **リザードマン** | ✅ | ✅ | - | ❌ |
| **ガジガジムシ** | ✅ | - | ❌ | ✅ |
| **ニジリゴケ** | - | ❌ | ❌ | ❌ |

- 不動フェーズ（bud, pupa, egg）のモンスターも捕食対象
- 種族の全滅時に `FOOD_CHAIN_BROKEN` イベント発火
