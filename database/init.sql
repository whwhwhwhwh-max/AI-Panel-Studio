-- ============================================
-- AI Panel Studio — 数据库初始化脚本 (DDL)
-- ============================================
-- 数据库: SQLite (sql.js)
-- 编码:   UTF-8
-- ============================================

PRAGMA foreign_keys = ON;

-- ============================================
-- 1. discussion — 讨论聚合根
-- ============================================
CREATE TABLE discussion (
    id           TEXT PRIMARY KEY NOT NULL,  -- UUID
    topic        TEXT NOT NULL,              -- 讨论话题
    expert_count INTEGER NOT NULL DEFAULT 4
                 CHECK(expert_count BETWEEN 2 AND 6),
    status       TEXT NOT NULL DEFAULT 'created'
                 CHECK(status IN (
                     'created','generating','ready',
                     'running','finished','failed'
                 )),
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_discussion_status     ON discussion(status);
CREATE INDEX idx_discussion_created_at ON discussion(created_at);

-- ============================================
-- 2. panelist — 参会嘉宾（主持人 + 专家，统一建模）
-- ============================================
CREATE TABLE panelist (
    id            TEXT PRIMARY KEY NOT NULL,  -- UUID
    discussion_id TEXT NOT NULL,              -- FK → discussion
    role          TEXT NOT NULL
                  CHECK(role IN ('moderator','expert')),
    name          TEXT NOT NULL,              -- 姓名
    title         TEXT NOT NULL,              -- 职业 / Title
    stance        TEXT NOT NULL,              -- 立场简述
    color         TEXT NOT NULL,              -- HEX 颜色标识
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (discussion_id) REFERENCES discussion(id) ON DELETE CASCADE
);

CREATE INDEX idx_panelist_discussion ON panelist(discussion_id);

-- ============================================
-- 3. transcript — 发言记录
-- ============================================
CREATE TABLE transcript (
    id            TEXT PRIMARY KEY NOT NULL,  -- UUID
    discussion_id TEXT NOT NULL,              -- FK → discussion
    panelist_id   TEXT NOT NULL,              -- FK → panelist
    content       TEXT NOT NULL,              -- 发言内容
    sequence      INTEGER NOT NULL,           -- 全局递增发言序号
    round         INTEGER NOT NULL DEFAULT 1, -- 所在轮次
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (discussion_id) REFERENCES discussion(id) ON DELETE CASCADE,
    FOREIGN KEY (panelist_id)   REFERENCES panelist(id)   ON DELETE CASCADE,
    UNIQUE(discussion_id, sequence)
);

CREATE INDEX idx_transcript_discussion ON transcript(discussion_id);
CREATE INDEX idx_transcript_sequence   ON transcript(discussion_id, sequence);
CREATE INDEX idx_transcript_round      ON transcript(discussion_id, round);

-- ============================================
-- 4. discussion_event — SSE 事件日志（混合持久化）
-- ============================================
-- persisted = 1 的事件用于断线重连回放
--   discussion_started / speech_delivered / consensus_updated
--   conflict_updated / round_ended / summary_generated
--   discussion_completed
-- persisted = 0 的事件仅运行时推送（runtime-only 不在此表）
-- ============================================
CREATE TABLE discussion_event (
    id            TEXT PRIMARY KEY NOT NULL,  -- UUID
    discussion_id TEXT NOT NULL,              -- FK → discussion
    event_type    TEXT NOT NULL
                  CHECK(event_type IN (
                      'discussion_started',
                      'speech_delivered',
                      'consensus_updated',
                      'conflict_updated',
                      'round_ended',
                      'summary_generated',
                      'discussion_completed'
                  )),
    payload       TEXT NOT NULL DEFAULT '{}', -- JSON 字符串
    sequence      INTEGER NOT NULL,           -- 事件序号，用于 Last-Event-ID
    persisted     INTEGER NOT NULL DEFAULT 1
                  CHECK(persisted IN (0,1)),
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (discussion_id) REFERENCES discussion(id) ON DELETE CASCADE,
    UNIQUE(discussion_id, sequence)
);

CREATE INDEX idx_event_discussion ON discussion_event(discussion_id);
CREATE INDEX idx_event_sequence   ON discussion_event(discussion_id, sequence);

-- ============================================
-- 5. consensus — 共识条目
-- ============================================
CREATE TABLE consensus (
    id            TEXT PRIMARY KEY NOT NULL,  -- UUID
    discussion_id TEXT NOT NULL,              -- FK → discussion
    content       TEXT NOT NULL,              -- 共识内容
    round         INTEGER NOT NULL DEFAULT 1, -- 产生于第几轮
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (discussion_id) REFERENCES discussion(id) ON DELETE CASCADE
);

CREATE INDEX idx_consensus_discussion ON consensus(discussion_id);
CREATE INDEX idx_consensus_round      ON consensus(discussion_id, round);

-- ============================================
-- 6. conflict — 分歧条目
-- ============================================
CREATE TABLE conflict (
    id            TEXT PRIMARY KEY NOT NULL,  -- UUID
    discussion_id TEXT NOT NULL,              -- FK → discussion
    content       TEXT NOT NULL,              -- 分歧内容
    round         INTEGER NOT NULL DEFAULT 1, -- 产生于第几轮
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (discussion_id) REFERENCES discussion(id) ON DELETE CASCADE
);

CREATE INDEX idx_conflict_discussion ON conflict(discussion_id);
CREATE INDEX idx_conflict_round      ON conflict(discussion_id, round);

-- ============================================
-- 7. summary — 讨论总结（每讨论仅一条）
-- ============================================
CREATE TABLE summary (
    id            TEXT PRIMARY KEY NOT NULL,  -- UUID
    discussion_id TEXT NOT NULL UNIQUE,       -- FK → discussion (1:1)
    content       TEXT NOT NULL,              -- 自然语言总结文本
    generated_at  TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (discussion_id) REFERENCES discussion(id) ON DELETE CASCADE
);

CREATE INDEX idx_summary_discussion ON summary(discussion_id);
