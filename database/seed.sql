-- ============================================
-- AI Panel Studio — 种子数据（5 条预设讨论）
-- ============================================
-- 状态说明：ready / running / finished 代表三种典型阶段
-- ============================================

-- ============================================================
-- 讨论 1: 量子计算是否会取代经典计算机？
-- 状态: finished（完整落库，含 consensus/conflict/summary）
-- ============================================================
INSERT INTO discussion (id, topic, expert_count, status, created_at, updated_at) VALUES (
    'd001-0000-0000-000000000001',
    '量子计算是否会取代经典计算机？',
    4,
    'finished',
    '2026-06-20T08:00:00Z',
    '2026-06-20T08:45:00Z'
);

-- moderator
INSERT INTO panelist (id, discussion_id, role, name, title, stance, color, created_at) VALUES (
    'p001-m000-0000-000000000001', 'd001-0000-0000-000000000001', 'moderator',
    '陈文远', '科技媒体主编 / 资深科技记者',
    '中立引导者，擅长在技术争议中引导理性对话',
    '#6B7B8D',
    '2026-06-20T08:00:00Z'
);
-- experts
INSERT INTO panelist (id, discussion_id, role, name, title, stance, color, created_at) VALUES (
    'p001-e001-0000-000000000001', 'd001-0000-0000-000000000001', 'expert',
    '周铭', '中科院量子信息实验室研究员',
    '量子计算将在特定领域替代经典计算，但不会全面取代',
    '#4A90D9',
    '2026-06-20T08:00:00Z'
);
INSERT INTO panelist (id, discussion_id, role, name, title, stance, color, created_at) VALUES (
    'p001-e002-0000-000000000001', 'd001-0000-0000-000000000001', 'expert',
    '李雅文', 'Intel 芯片架构师',
    '经典计算仍有不可替代的优势，二者将长期共存',
    '#E06C42',
    '2026-06-20T08:00:00Z'
);
INSERT INTO panelist (id, discussion_id, role, name, title, stance, color, created_at) VALUES (
    'p001-e003-0000-000000000001', 'd001-0000-0000-000000000001', 'expert',
    '王峰', '量子初创公司"量芯科技"CTO',
    '量子计算是范式革命，5-10 年内将重塑整个产业',
    '#3CB371',
    '2026-06-20T08:00:00Z'
);
INSERT INTO panelist (id, discussion_id, role, name, title, stance, color, created_at) VALUES (
    'p001-e004-0000-000000000001', 'd001-0000-0000-000000000001', 'expert',
    '赵思远', '北大物理学教授',
    '需要从物理极限和工程可行性两方面审慎评估',
    '#9B59B6',
    '2026-06-20T08:00:00Z'
);

-- 共识 & 分歧（讨论 1 已完成）
INSERT INTO consensus (id, discussion_id, content, round, created_at) VALUES
    ('c001-0001', 'd001-0000-0000-000000000001', '各方认可量子计算在药物模拟、密码学等领域有显著优势', 1, '2026-06-20T08:12:00Z'),
    ('c001-0002', 'd001-0000-0000-000000000001', '量子计算短期内无法替代经典计算在通用任务上的生态与成本优势', 2, '2026-06-20T08:24:00Z'),
    ('c001-0003', 'd001-0000-0000-000000000001', '量子+经典混合架构是近期最可行路径', 3, '2026-06-20T08:36:00Z');

INSERT INTO conflict (id, discussion_id, content, round, created_at) VALUES
    ('f001-0001', 'd001-0000-0000-000000000001', '周铭认为量子计算商用化至少需 10 年，王峰则认为 5 年内可落地', 2, '2026-06-20T08:24:00Z'),
    ('f001-0002', 'd001-0000-0000-000000000001', '李雅文强调经典芯片的演进空间仍大，赵思远则认为摩尔定律已触达天花板', 3, '2026-06-20T08:36:00Z');

INSERT INTO summary (id, discussion_id, content, generated_at) VALUES (
    's001-0000-0000-000000000001', 'd001-0000-0000-000000000001',
    '今天的讨论围绕量子计算与经典计算的关系展开。四位专家从各自领域出发，达成了关键共识：量子计算不会"取代"经典计算，而是与之形成互补。短期内混合架构最为可行，但王峰提醒我们不要低估技术跃迁的速度。最大的分歧集中在商用化时间表上——从 5 年到 10 年以上的预测差异，反映了学术与产业视角的根本不同。',
    '2026-06-20T08:45:00Z'
);

-- ============================================================
-- 讨论 2: AGI 是否应该被暂停研发？
-- 状态: running（讨论进行中）
-- ============================================================
INSERT INTO discussion (id, topic, expert_count, status, created_at, updated_at) VALUES (
    'd002-0000-0000-000000000002',
    'AGI 是否应该被暂停研发？',
    5,
    'running',
    '2026-06-25T14:00:00Z',
    '2026-06-25T14:30:00Z'
);

-- moderator
INSERT INTO panelist (id, discussion_id, role, name, title, stance, color, created_at) VALUES (
    'p002-m000-0000-000000000002', 'd002-0000-0000-000000000002', 'moderator',
    '方可欣', '前央视财经主持人 / 科技伦理专栏作家',
    '中立但不回避尖锐问题，擅长平衡理性辩论与公众关切',
    '#708090',
    '2026-06-25T14:00:00Z'
);
-- experts
INSERT INTO panelist (id, discussion_id, role, name, title, stance, color, created_at) VALUES (
    'p002-e001-0000-000000000002', 'd002-0000-0000-000000000002', 'expert',
    '杨思齐', 'DeepMind 安全研究科学家',
    '暂停不切实际，但需要建立国际监管框架',
    '#4A90D9',
    '2026-06-25T14:00:00Z'
);
INSERT INTO panelist (id, discussion_id, role, name, title, stance, color, created_at) VALUES (
    'p002-e002-0000-000000000002', 'd002-0000-0000-000000000002', 'expert',
    '孙若兰', '知名 AI 伦理学家 / 《算法边界》作者',
    '在安全性得到充分验证之前应严格限制模型规模',
    '#E06C42',
    '2026-06-25T14:00:00Z'
);
INSERT INTO panelist (id, discussion_id, role, name, title, stance, color, created_at) VALUES (
    'p002-e003-0000-000000000002', 'd002-0000-0000-000000000002', 'expert',
    '马腾', 'AI 创业公司 CEO / 连续创业者',
    '暂停是欧洲式的过度恐慌，将让创新主动权落于他国',
    '#3CB371',
    '2026-06-25T14:00:00Z'
);
INSERT INTO panelist (id, discussion_id, role, name, title, stance, color, created_at) VALUES (
    'p002-e004-0000-000000000002', 'd002-0000-0000-000000000002', 'expert',
    '林悦华', '前政府科技政策顾问',
    '国家级监管沙盒是最务实的中间道路',
    '#9B59B6',
    '2026-06-25T14:00:00Z'
);
INSERT INTO panelist (id, discussion_id, role, name, title, stance, color, created_at) VALUES (
    'p002-e005-0000-000000000002', 'd002-0000-0000-000000000002', 'expert',
    '郑海', '哲学教授 / 技术哲学研究者',
    '问题不在于"能不能暂停"，而在于"人类到底想要什么样的智能"',
    '#F39C12',
    '2026-06-25T14:00:00Z'
);

-- ============================================================
-- 讨论 3: 远程办公 vs 回归办公室——后疫情时代的最优解
-- 状态: ready（嘉宾已生成，等待用户确认开始）
-- ============================================================
INSERT INTO discussion (id, topic, expert_count, status, created_at, updated_at) VALUES (
    'd003-0000-0000-000000000003',
    '远程办公 vs 回归办公室：后疫情时代的最优解是什么？',
    4,
    'ready',
    '2026-06-26T09:15:00Z',
    '2026-06-26T09:16:00Z'
);

-- moderator
INSERT INTO panelist (id, discussion_id, role, name, title, stance, color, created_at) VALUES (
    'p003-m000-0000-000000000003', 'd003-0000-0000-000000000003', 'moderator',
    '徐曼', '商业财经主持人 / 组织行为学硕士',
    '中立引导，关注数据与个体体验的平衡',
    '#708090',
    '2026-06-26T09:15:00Z'
);
-- experts
INSERT INTO panelist (id, discussion_id, role, name, title, stance, color, created_at) VALUES (
    'p003-e001-0000-000000000003', 'd003-0000-0000-000000000003', 'expert',
    '黄敏君', '猎头公司合伙人 / 人才战略顾问',
    '混合办公已成不可逆趋势，拒绝灵活办公的公司将失去人才竞争力',
    '#4A90D9',
    '2026-06-26T09:15:00Z'
);
INSERT INTO panelist (id, discussion_id, role, name, title, stance, color, created_at) VALUES (
    'p003-e002-0000-000000000003', 'd003-0000-0000-000000000003', 'expert',
    '张立伟', '大型互联网企业 HRVP',
    '办公室协作的创造性碰撞无法被 Zoom 彻底取代',
    '#E06C42',
    '2026-06-26T09:15:00Z'
);
INSERT INTO panelist (id, discussion_id, role, name, title, stance, color, created_at) VALUES (
    'p003-e003-0000-000000000003', 'd003-0000-0000-000000000003', 'expert',
    '陈星宇', '独立咨询师 / 五年远程工作经验者',
    '远程办公的生产力提升数据是真实的，前提是企业文化同步进化',
    '#3CB371',
    '2026-06-26T09:15:00Z'
);
INSERT INTO panelist (id, discussion_id, role, name, title, stance, color, created_at) VALUES (
    'p003-e004-0000-000000000003', 'd003-0000-0000-000000000003', 'expert',
    '丁洁', '工业与组织心理学博士',
    '讨论不应陷入二元对立，需要从人类心理需求的结构出发',
    '#9B59B6',
    '2026-06-26T09:15:00Z'
);

-- ============================================================
-- 讨论 4: 加密货币是否会成为主流储备资产？
-- 状态: created（已创建，等待生成嘉宾）
-- ============================================================
INSERT INTO discussion (id, topic, expert_count, status, created_at, updated_at) VALUES (
    'd004-0000-0000-000000000004',
    '加密货币是否会成为全球主流储备资产？',
    6,
    'created',
    '2026-06-26T10:30:00Z',
    '2026-06-26T10:30:00Z'
);

-- ============================================================
-- 讨论 5: AI 辅助教育——因材施教还是技术依赖？
-- 状态: finished（完整落库，含 summary）
-- ============================================================
INSERT INTO discussion (id, topic, expert_count, status, created_at, updated_at) VALUES (
    'd005-0000-0000-000000000005',
    'AI 辅助教育：因材施教的曙光，还是技术依赖的陷阱？',
    4,
    'finished',
    '2026-06-18T10:00:00Z',
    '2026-06-18T10:50:00Z'
);

-- moderator
INSERT INTO panelist (id, discussion_id, role, name, title, stance, color, created_at) VALUES (
    'p005-m000-0000-000000000005', 'd005-0000-0000-000000000005', 'moderator',
    '吴若曦', '教育媒体"黑板报"创始主编',
    '中立引导，关注教育本质与技术伦理',
    '#708090',
    '2026-06-18T10:00:00Z'
);
-- experts
INSERT INTO panelist (id, discussion_id, role, name, title, stance, color, created_at) VALUES (
    'p005-e001-0000-000000000005', 'd005-0000-0000-000000000005', 'expert',
    '何敏', '北师大教育技术系教授',
    'AI 个性化教学是教育公平的最大希望，但需要解决数字鸿沟',
    '#4A90D9',
    '2026-06-18T10:00:00Z'
);
INSERT INTO panelist (id, discussion_id, role, name, title, stance, color, created_at) VALUES (
    'p005-e002-0000-000000000005', 'd005-0000-0000-000000000005', 'expert',
    '谢雨桐', '一线高中语文教师 / 15 年教龄',
    '技术无法替代师生之间的情感连接和言传身教',
    '#E06C42',
    '2026-06-18T10:00:00Z'
);
INSERT INTO panelist (id, discussion_id, role, name, title, stance, color, created_at) VALUES (
    'p005-e003-0000-000000000005', 'd005-0000-0000-000000000005', 'expert',
    '郭鹏', 'EdTech 公司产品副总裁',
    'AI 不是替代教师，而是让教师从重复劳动中解放出来',
    '#3CB371',
    '2026-06-18T10:00:00Z'
);
INSERT INTO panelist (id, discussion_id, role, name, title, stance, color, created_at) VALUES (
    'p005-e004-0000-000000000005', 'd005-0000-0000-000000000005', 'expert',
    '沈晴', '儿童发展心理学家',
    '核心风险在于削弱学生的自主思考能力，AI 应做"脚手架"而非"拐杖"',
    '#9B59B6',
    '2026-06-18T10:00:00Z'
);

-- 共识 & 分歧 & 总结（讨论 5 已完成）
INSERT INTO consensus (id, discussion_id, content, round, created_at) VALUES
    ('c005-0001', 'd005-0000-0000-000000000005', 'AI 在自适应练习和即时反馈方面确实能将教师从重复劳动中解放', 1, '2026-06-18T10:15:00Z'),
    ('c005-0002', 'd005-0000-0000-000000000005', 'AI 应定位为"辅助工具"而非"教学主体"', 2, '2026-06-18T10:30:00Z');

INSERT INTO conflict (id, discussion_id, content, round, created_at) VALUES
    ('f005-0001', 'd005-0000-0000-000000000005', '何敏认为 AI 个性化教育是缩小教育差距的最优路径；谢雨桐反驳称城乡设备差距本身就意味着 AI 教育可能扩大不平等', 1, '2026-06-18T10:15:00Z'),
    ('f005-0002', 'd005-0000-0000-000000000005', '郭鹏主张 AI 可替代教师批改和部分传授功能；沈晴强调人类教师在情感引导和价值观塑造方面不可替代', 2, '2026-06-18T10:30:00Z');

INSERT INTO summary (id, discussion_id, content, generated_at) VALUES (
    's005-0000-0000-000000000005', 'd005-0000-0000-000000000005',
    '本场讨论中，四位来自教育、心理学和 EdTech 领域的专家达成了一项重要共识：AI 在教育的正确身份是"辅助者"而非"替代者"。何敏教授描绘的个性化学习蓝图令人神往，但谢雨桐老师从一个教室的日常出发，提醒我们屏幕无法传递的温度。沈晴博士提出的"脚手架 vs 拐杖"比喻可能是本次讨论最值得记住的框架。最终我们同意，AI 在教育中最应该解放的，是让教师有更多时间去"做那些只有人才能做的事"。',
    '2026-06-18T10:50:00Z'
);

-- ============================================================
-- 验证脚本（optional — 取消注释以快速检查）
-- ============================================================
-- SELECT 'discussions' AS tbl, count(*) FROM discussion
-- UNION ALL SELECT 'panelists', count(*) FROM panelist
-- UNION ALL SELECT 'consensus', count(*) FROM consensus
-- UNION ALL SELECT 'conflict', count(*) FROM conflict
-- UNION ALL SELECT 'summary', count(*) FROM summary;
