# 数据库 ER 图

> 版本: v1.0 | 日期: 2026-06-26 | 状态: Draft

---

## 1. ER 图

```mermaid
erDiagram
    DISCUSSION ||--o{ PANELIST : has
    DISCUSSION ||--o{ TRANSCRIPT : contains
    DISCUSSION ||--o{ DISCUSSION_EVENT : generates
    DISCUSSION ||--o{ CONSENSUS : produces
    DISCUSSION ||--o{ CONFLICT : produces
    DISCUSSION ||--|| SUMMARY : concludes
    PANELIST ||--o{ TRANSCRIPT : speaks
    PANELIST ||--o{ DISCUSSION_EVENT : triggers

    DISCUSSION {
        TEXT id PK "UUID"
        TEXT topic "讨论话题"
        INTEGER expert_count "专家人数"
        TEXT status "讨论状态"
        TEXT created_at "ISO 8601"
        TEXT updated_at "ISO 8601"
    }

    PANELIST {
        TEXT id PK "UUID"
        TEXT discussion_id FK "FK→Discussion"
        TEXT role "moderator|expert"
        TEXT name "姓名"
        TEXT title "职业/Title"
        TEXT stance "立场简述"
        TEXT color "HEX颜色"
        INTEGER is_moderator "0|1"
        TEXT created_at "ISO 8601"
    }

    TRANSCRIPT {
        TEXT id PK "UUID"
        TEXT discussion_id FK "FK→Discussion"
        TEXT panelist_id FK "FK→Panelist"
        TEXT content "发言内容"
        INTEGER sequence "发言序号"
        INTEGER round "讨论轮次"
        TEXT created_at "ISO 8601"
    }

    DISCUSSION_EVENT {
        TEXT id PK "UUID"
        TEXT discussion_id FK "FK→Discussion"
        TEXT event_type "EventType枚举"
        TEXT payload "JSON"
        INTEGER sequence "事件序号"
        TEXT created_at "ISO 8601"
    }

    CONSENSUS {
        TEXT id PK "UUID"
        TEXT discussion_id FK "FK→Discussion"
        TEXT content "共识内容"
        INTEGER round "产生轮次"
        TEXT created_at "ISO 8601"
    }

    CONFLICT {
        TEXT id PK "UUID"
        TEXT discussion_id FK "FK→Discussion"
        TEXT content "分歧内容"
        INTEGER round "产生轮次"
        TEXT created_at "ISO 8601"
    }

    SUMMARY {
        TEXT id PK "UUID"
        TEXT discussion_id FK "FK→Discussion"
        TEXT content "总结文本"
        TEXT generated_at "ISO 8601"
    }
```

---

## 2. 表结构速查

| 表名 | 主键 | 外键 | 索引建议 |
|---|---|---|---|
| `discussion` | id (UUID) | — | status, created_at |
| `panelist` | id (UUID) | discussion_id | discussion_id |
| `transcript` | id (UUID) | discussion_id, panelist_id | discussion_id, sequence |
| `discussion_event` | id (UUID) | discussion_id | discussion_id, sequence |
| `consensus` | id (UUID) | discussion_id | discussion_id, round |
| `conflict` | id (UUID) | discussion_id | discussion_id, round |
| `summary` | id (UUID) | discussion_id | discussion_id (UNIQUE) |

---

<!-- TODO: 后续根据实际建表语句微调字段类型，确保与 SQLite 兼容 -->
