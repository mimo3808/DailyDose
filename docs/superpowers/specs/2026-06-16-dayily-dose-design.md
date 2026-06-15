# DayilyDose — Design Spec

**Date:** 2026-06-16
**Status:** Draft (awaiting user review)
**Phase:** v1 / MVP
**Owner:** solo

## 1. Background & Goal

DayilyDose 是一款 Web 应用，把用户订阅的 RSS 主题转成每日带章节的音频简报。用户选 topic、设时长、点"今日"，得到一段播放器，由浏览器 TTS 朗读"今天 / 昨天"相关新闻。

v1 目标：端到端验证 "topic 聚类 + LLM 总结 + 浏览器 TTS" 在单人开发成本下，能产出可听的每日简报。

v1 明确**不做**：移动端原生、跨设备同步、推送通知、付费墙、分享/导出、基于历史的个性化、多语言 UI。

## 2. Target User

- **主目标**：行业从业者 / 信息重度消费者——愿意自己配 topic、设时长，能接受 30–60s 生成等待。
- **次目标（后续）**：通勤族 / 泛白领——v1 不专门做引导/推荐流。

## 3. Locked Decisions

| 维度 | 决定 |
|---|---|
| 信源策略 | 全自动抓取；v1 起步 ~50 精选种子，W2 后扩到 ~500，自动发现上限 5000 |
| 播放形态 | 纯 Web 内播放器，不导出播客 RSS |
| 简报条数 | 一天一条总简报 |
| 长度定义 | 按时长（分钟） |
| 生成时机 | 用户点击即生成；同日缓存复用，跨日重新生成 |
| TTS 声音 | 浏览器 Web Speech API（基础、免费） |
| 简报结构 | 单条音频 + 章节标记 + 章节列表跳转 |
| 平台 | Web 先行（Next.js SPA） |
| 账号 | 完全无账号；`device_id` = localStorage 里的 UUID |
| 商业模式 | 完全免费 + 无广告 |
| 路线 | 精益单人全栈（A 路线） |

## 4. Architecture

```
┌────────────────────┐       ┌──────────────────────┐
│  Browser (Web)     │       │  Next.js API Routes  │
│  - UI / Player     │ <---> │  - /api/rss/fetch    │
│  - localStorage    │       │  - /api/briefing/... │
│  - Web Speech API  │       │  - /api/sources/...  │
│  (TTS, $0)         │       │  - /api/prefs        │
└────────────────────┘       └──────────┬───────────┘
                                       │
                                       ▼
                            ┌──────────────────────┐
                            │  Postgres (Neon)     │
                            │  6 tables            │
                            └──────────────────────┘

外部依赖：LLM API（Anthropic / OpenAI），按调用计费
部署：Vercel
```

TTS 在浏览器侧完成。服务器只做调度、数据拉取、LLM 调用。

## 5. Data Model

6 张表，DDL 在实施阶段产出，存于 `db/schema.sql`：

- `topics` — 行业分类（v1 手工预设 ~10–30 条）
- `sources` — RSS 源（`id, url, title, topic_id, language, quality_score, last_fetched_at, status, created_at`）
- `articles` — 原始文章（`id, source_id, title, url, content, published_at, fetched_at, content_hash UNIQUE, language, topic_id`）
- `user_prefs` — 偏好（`device_id` PK，`topic_ids JSONB, length_minutes, voice_pref, language`）
- `briefings` — 已生成简报（`id, device_id, brief_date, target_minutes, script_json JSONB, status, created_at`）
- `daily_cache` — 同日缓存（`device_id+brief_date` PK，`briefing_id`）

关键索引：
- `articles(source_id, published_at DESC)`
- `articles(content_hash UNIQUE)`
- `briefings(device_id, brief_date)`

## 6. Data Flow

### 6.1 用户点"今日"（默认日期为 today，可切到 yesterday）

0. 用户在首页选择日期（today / yesterday，默认 today）。
1. 前端查 `daily_cache(device_id, date)`。命中 → 取 `script_json` 跳步骤 5。
2. 未命中 → `POST /api/briefing/generate { device_id, date, length_minutes, topic_ids }`。
3. 服务端：
   a. 拉取用户 topic 对应 sources 的目标日期 ±12h 窗口内的 articles（去重、按时间 × 源质量排序）
   b. 若结果为 0 篇：返回 `422 { reason: "no_articles" }`，前端提示"所选日期没有新闻，换 topic 或改日期"
   c. 按 `length_minutes` 估算章节数：基准 200 字/分钟，~1 章/2 分钟，下限 3，上限 12
   d. 调 LLM（structured output）→ `script_json`
   e. 写入 `briefings` 与 `daily_cache`
   f. 返回 `script_json`
4. 前端渲染章节列表。
5. 用户点"播放"→ Web Speech API 顺序合成 → 边合成边播。
6. 播放进度写 localStorage（不写库）。

### 6.2 后台 RSS 抓取

- Vercel Cron 每 15–30 分钟触发
- 拉取所有 `active` 源
- 单源失败 → 标记 `degraded`；连续 5 次失败 → 转 `inactive`
- `content_hash = sha256(title | url | first_500_chars)` 去重

### 6.3 信源自动发现

- 每日一次：扫描公开 RSS 目录（Awesome RSS GitHub 列表、RSSHub `routes.json`、FeedSpot Top RSS、blogroll aggregator）
- 对每个候选源，访问首页抓 `<link rel="alternate" type="application/rss+xml">`
- 候选源入 `sources.status = 'pending'`；cron 验证连续 3 次成功 → 转 `active`
- `quality_score` 公式：`fetch_success_rate × avg_content_length × 7d_posting_frequency`，按总分阈值筛选

## 7. Key Modules

### 7.1 RSS pipeline
- `lib/rss/fetch.ts` — 抓取与解析
- `lib/rss/dedupe.ts` — content_hash 去重
- `lib/rss/discover.ts` — 自动发现
- 单源失败不波及其他源

### 7.2 Briefing generator
- `lib/briefing/prompt.ts` — 提示词模板
- `lib/briefing/llm.ts` — LLM 调用封装（带 retry 与 JSON 校验）
- 输出 schema（LLM 强约束）：
  ```json
  {
    "title": "...",
    "chapters": [
      { "idx": 1, "title": "...", "script_text": "...", "source_refs": [{"title": "...", "url": "..."}] }
    ]
  }
  ```
- 长度控制：prompt 中给出目标字数，LLM 被要求落在 ±10% 区间

### 7.3 TTS layer
- `lib/tts/synthesize.ts` — 封装 Web Speech API
- 单次合成 ≤ 5000 字（避免 utterance 上限）
- 暴露：voice 列表、speed、章节间 pause 注入

### 7.4 Player UI
- Apple Podcasts 风格：大封面、章节列表 + 进度、传输控件
- 顶部日期选择器：today / yesterday 切换（切换后重新查 `daily_cache` 或触发生成）
- 控件：播放/暂停、上一章/下一章、15s 跳过、倍速（0.75 / 1 / 1.25 / 1.5 / 2）
- 后台/锁屏：依赖浏览器 Media Session API
- "重新生成"按钮：清掉当日 `daily_cache`、重跑

## 8. Error Handling

| 失败 | 表现 | 兜底 |
|---|---|---|
| RSS 源 404/超时 | 标记 `degraded` | 连续 5 次失败 → `inactive` |
| LLM 调用失败 | HTTP 503 | 前端提示重试；不写 `daily_cache` |
| LLM 输出不合规 JSON | parser 抛错 | 降级到 extractive（拼接 top N 篇文章前 200 字） |
| Web Speech API 不可用 | 静默 | 提示换 Chrome / Edge |
| 同一天重复点击 | — | `daily_cache` 命中直接放；"重新生成"按钮可覆盖 |

## 9. Testing

- **单元（Vitest）**：RSS 解析、content_hash、LLM JSON 解析、章节时长估算
- **集成（mock LLM）**：完整生成 → 写库 → cache 命中；LLM 失败 → extractive 兜底
- **E2E（Playwright）**：选 topics → 设时长 → 点"今日" → 看到章节列表；播放/跳过/倍速控件
- **手工**：Chrome / Edge / Safari 上中文 TTS 质量、不同语速听感、移动浏览器布局

## 10. Out of Scope (MVP)

明确不做，v1 不留接口：

- 跨设备同步
- 移动端原生应用
- 推送 / 邮件订阅
- 简报分享 / 导出
- 按文章级订阅与回听
- 基于历史的个性化 / 推荐
- 多语言 UI（v1 中文为主、内容中英混合可）
- 付费墙 / 订阅 / 广告
- 移动端后台播放（依赖浏览器能力）

## 11. Cost Estimate (1k DAU, optimistic)

| 项 | 估算 |
|---|---|
| LLM（Claude Sonnet 级别，~1000 调用/天 × 1k input + 1k output tokens） | ~$5/天 ≈ $150/月 |
| Neon / Supabase Postgres | 免费 → Pro ~$20/月 |
| Vercel | 免费 → Pro $20/月 |
| Cron / server | 免费 → ~$10/月 |
| **总计** | **~$200/月 @ 1k DAU** |

> 超过 1k DAU 仍需加限额或付费墙，但压力远小于初版估算。

## 12. Milestones（单人 4–8 周）

- **W1**：项目脚手架、DB schema、RSS fetcher、50 个种子源
- **W2**：信源自动发现、topic 分类、UI 骨架
- **W3**：LLM 简报生成（prompt 调优）、章节化输出
- **W4**：播放器、Web Speech API、错误处理
- **W5**：测试、手工打磨
- **W6+**：上线、观察、迭代

## 13. Known Tensions / Risks

这些是显性选择带来的张力，列出来便于日后回看：

- **全自动化抓取 + 单人开发**：5k+ 源的运维很重；v1 用 `quality_score` 阈值控制规模，宁可欠补不超灌
- **点击即生成 + 通勤族**：30–60s 等待对 casual 用户体验差；v1 用同日缓存 + APP 打开时后台预热缓解
- **浏览器 Web Speech API + 跨浏览器中文质量**：Safari / Firefox 中文声音弱于 Edge；记录为已知限制
- **无账号 + 免费 + LLM 成本**：无防滥用护栏；v1 在 Vercel Edge middleware 加一层 IP 限频作为最低防御
- **未做法律审查**：RSS 摘要处于灰色地带；v1 在每章保留 source_refs 链接，文本用摘要而非全文

## 14. Open Questions

无——所有 v1 主要决策已锁定。
