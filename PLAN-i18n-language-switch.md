# 多语言（中 / 英）切换 · 实施计划书

> 项目：`D:\deepseek harness\workspace`（线上：https://yujingyao.com）
> 版本：v1.0 · 2026-10-24 · 状态：**已实施**
> 目标：在不破坏现有内容与 TinaCMS 编辑链路的前提下，增加「中文 / 英文」切换。
>
> **实施后记**：用户最终选择 **`/zh` + `/en` 对称结构**。实际实现**没有使用 proxy**：
> 根 `/` 与旧的无前缀地址由 `next.config.ts` 做 308，`app/[lang]` 仍是单一路由树。
> 下面 §3 / §4 / Phase 0 中关于 `proxy.ts` 的段落保留为方案对比记录，**以 README / AGENTS 的当前说明为准**。

---

## 0. 执行摘要

实际采用的方案一句话：

> **中文 `/zh/...`、英文 `/en/...` 对称路由；`app/[lang]` 单一路由树；根 `/` 和旧地址 308 到 `/zh`；服务端用 `next/root-params` 读取当前语言；英文内容使用独立 Tina 集合/文件、与中文同 slug 配对；UI 文案集中到类型安全的字典；SEO 做全量 canonical + hreflang。**

这样做的结果：

- 现有中文内容、视觉、Tina 编辑链路不变；旧的无前缀 URL 308 到 `/zh/...`。
- `/zh`、`/zh/posts`、`/zh/about` 与 `/en`、`/en/posts`、`/en/about` 对称。
- 全站仍然是**静态预渲染 + `revalidate = 60`**，不引入运行时内容依赖。
- 正文仍然只走 Tina 官方 `<TinaMarkdown>`，不引入 MDX 编译管线。
- 英文内容是纯新增；`content/` 下现有中文文件不需要迁移。

实际工程量：**约 1 个工作日完成代码与门禁**（不含内容翻译）；英文种子内容已就位，作者可继续替换。

---

## 1. 已核对的项目现状

### 1.1 技术栈与运行方式

| 项 | 现状 |
| --- | --- |
| 框架 | Next.js 16.3.5（App Router）+ React 19 + TypeScript |
| 样式 | Tailwind CSS v4 + `@tailwindcss/typography` |
| CMS | TinaCMS 3.13.0 + TinaCloud；本地走 `tinacms dev` 的 4001 内容 API |
| 部署 | Vercel，构建命令 `npm run build`（不能改成 `next build`） |
| 渲染 | 页面 `revalidate = 60`，静态预渲染 / ISR；正文烘焙进 HTML |
| 内容 | 2 篇 MDX 文章、4 个 MDX 独立页面、4 个 JSON 单文档（home / projects / notes / reading） |
| 路由 | 17 个 `page.tsx`，含文章、分页、标签、系列等动态路由 |

### 1.2 现有路由盘点

| 公共 URL | 文件 | 类型 |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | 首页（个人档案） |
| `/posts` | `src/app/posts/page.tsx` | 文章列表 |
| `/posts/page/[page]` | `src/app/posts/page/[page]/page.tsx` | 分页 |
| `/posts/[...filename]` | `src/app/posts/[...filename]/page.tsx` | 文章详情 |
| `/tags`、`/tags/[tag]` | `src/app/tags/...` | 标签 |
| `/archive` | `src/app/archive/page.tsx` | 归档 |
| `/series`、`/series/[series]` | `src/app/series/...` | 系列 |
| `/projects` | `src/app/projects/page.tsx` | 项目（JSON） |
| `/notes` | `src/app/notes/page.tsx` | 笔记（JSON） |
| `/reading` | `src/app/reading/page.tsx` | 阅读（JSON） |
| `/resume` | `src/app/resume/page.tsx` | 履历 |
| `/about` | `src/app/about/page.tsx` | 关于（MDX） |
| `/start-here` | `src/app/start-here/page.tsx` | 从这开始（MDX + 文章） |
| `/now`、`/uses` | `src/app/now/page.tsx`、`src/app/uses/page.tsx` | MDX 页面 |
| `/rss.xml` | `src/app/rss.xml/route.ts` | RSS |
| `/sitemap.xml` | `src/app/sitemap.ts` | 站点地图 |
| `/robots.txt` | `src/app/robots.ts` | robots |
| `/opengraph-image` | `src/app/opengraph-image.tsx` | 默认分享图 |
| `/admin/index.html` | `public/admin`（Tina 构建产物） | 编辑器，不在 App Router 内 |

### 1.3 文案与本地化相关代码

- 全站 UI 文案**硬编码在 TSX 里**，没有 i18n 基础设施。
- `src/lib/site.ts` 的 `formatDate()` 固定 `zh-CN`，并且固定 `timeZone: 'UTC'`（防止 hydration mismatch，这一点必须保留）。
- 根布局 `src/app/layout.tsx` 固定 `<html lang="zh-CN">`，`openGraph.locale: 'zh_CN'`。
- 文章页 JSON-LD 固定 `inLanguage: 'zh-CN'`。
- RSS 固定 `<language>zh-CN</language>`。
- sitemap 只输出单语言 URL，没有 `alternates.languages`。
- 40 个 `src/**` 文件包含中文（共约 1329 处，包含大量注释）；其中约 25 个文件含**用户可见文案**。
- `src/components/tina-markdown.tsx` 是客户端组件，`Callout`、`CopyButton`、`ZoomableImage`、`InvalidMarkdown` 等 MDX 交互组件里也有中文 UI 文案，不能只改页面。

### 1.4 现有质量门禁（必须全部继续通过）

| 命令 | 作用 |
| --- | --- |
| `npm run typecheck` | `tsc --noEmit`，必须 0 错误 |
| `npm run build:local` | 本地内容 API + 完整构建 + 内容校验 + runtime + 路由契约 |
| `npm run check:content` | 用 Tina 官方解析器逐篇校验 MDX |
| `npm run check:runtime` | 校验正文已烘焙、客户端包不含内容 API、路由是静态 |
| `npm run check:routes` | 校验列表 / 首页 / sitemap / RSS 发出的文章 URL 都有预渲染页 |
| `npm run smoke` | Playwright：http / admin / visual / interaction / motion / save |
| `npm run smoke:prod` | 生产构建 + `next start` 的完整验证 |

这些脚本里有不少**硬编码的中文断言和路径假设**（例如 `runtime-independence-smoke.mjs` 里的 `欢迎`、`提示框组件`，`http-status-smoke.mjs` 里的 `/posts/hello-tinacms`）。加语言后必须同步升级，否则门禁会假失败或漏检。

---

## 2. 目标与非目标

### 2.1 目标

1. **中文站行为不变**：现有 URL、页面结构、视觉、内容、Tina 编辑、RSS、sitemap 都保持可用。
2. **英文站完整可用**：所有导航、页头页脚、列表、空状态、分页、文章 chrome、404、元数据都有英文。
3. **语言切换可发现、可分享、可被搜索引擎理解**：
   - 页头有明确的语言切换入口；
   - 每个页面有正确的 `<html lang>`、canonical、hreflang；
   - sitemap / RSS 同时覆盖两种语言。
4. **保持静态与内容新鲜度**：不因为 i18n 把页面变成动态 SSR；`revalidate = 60` 继续生效。
5. **Tina 编辑器可维护**：英文内容能在 `/admin/index.html` 里单独创建、编辑、发布。
6. **可回归**：现有门禁 + 新增 i18n 门禁 + 双语言浏览器测试。

### 2.2 非目标（本期不做）

- 不做基于浏览器 `Accept-Language` 的自动跳转（会破坏静态缓存和 URL 可预测性；最多以后加一个可关闭的提示条）。
- 不做 cookie-only 切换（同一 URL 返回不同语言，SEO 和静态缓存都会变差）。
- 不做机器翻译流水线；英文内容由作者/译者提供，构建时只读内容。
- 不翻译 Tina 管理后台本身的界面（Tina 自带语言设置另说）。
- 不引入第三种语言、RTL、路由 slug 翻译（本期中英文共用同一 slug）。
- 不重构现有视觉语言；语言切换控件复用现有 pill / 磨砂玻璃样式。

---

## 3. 关键决策

### 3.1 决策总表

| # | 决策 | 推荐 | 备选 | 推荐理由 |
| --- | --- | --- | --- | --- |
| D1 | 默认语言与 URL | `/zh` + `/en` 对称 | 中文根路径 + `/en` | 用户选择；旧地址用 308 兜底，结构最清晰 |
| D2 | 路由结构 | `app/[lang]/...` 单一路由树 + `next.config.ts` 308 | 复制一套 `/en` 页面树 / proxy 重写 | 只有一份页面代码；不需要 proxy 运行时逻辑 |
| D3 | 英文内容存放 | 独立英文集合/文件，与中文同 slug | 同一文件里放双语字段 | 不破坏现有中文文件；Tina 编辑体验好；正文不需要第二个富文本字段 |
| D4 | UI 文案 | 类型安全的字典（`zh.ts` / `en.ts`） | 第三方 `next-intl` | 只有两种语言、文案量可控；不增加运行时依赖和 middleware 复杂度 |
| D5 | 英文范围 | 全量 UI + 必需页面 + 全部文章（推荐） | UI + 核心页面，文章按需翻译 | 语言切换后不应出现大面积“只有中文”的页面 |
| D6 | 语言代码 | `en`（`htmlLang: 'en'`，OG `en_US`） | `en-US` | 个人站不需要地区变体；以后要加 `en-GB` 再扩展 |

### 3.2 为什么不选另外几种方案

**A. 只用 cookie / localStorage 切换（同一个 URL）**

不推荐。静态预渲染的 HTML 只有一份，切换后要么首屏闪烁，要么整页内容靠客户端替换；搜索引擎只能看到一个语言；`revalidate` 和 CDN 缓存也无法按语言区分。

**B. 中文保持根路径、英文 `/en` 前缀**

可行的备选方案，但最终没有采用：用户选择 `/zh` + `/en` 对称结构。旧的无前缀 URL 通过 `next.config.ts` 308 到 `/zh/...`，因此已收录链接仍然可用。

**C. 同一篇 MDX 里放 `title_en` / `body_en`**

Tina 的 `isBody` 只能有一个；第二个 `rich-text` 字段在 MDX frontmatter 里的序列化/解析行为需要额外验证，且编辑器会出现两个正文编辑区；发布日期、草稿、标签也无法按语言独立。对作者来说不如“一篇英文文档”直观。

**D. 复制一套 `/en` 页面文件**

不需要 proxy，静态产物最直接；但每个页面、每个 `generateMetadata`、每个 `generateStaticParams` 都要维护两份，长期必然漂移。作为 Phase 0 的**兜底方案**保留。

---

## 4. 目标架构

### 4.1 请求流

```text
Browser
  │
  ├─ /                 ──┐
  ├─ /posts            ──┤  src/proxy.ts
  ├─ /posts/hello      ──┤  “按需前缀”：
  ├─ /en               ──┤    /en/*  -> 直接进入 [lang]=en
  ├─ /en/posts         ──┤    /zh/*  -> 308 到无前缀
  ├─ /rss.xml          ──┘    其他    -> rewrite 到 /zh/*
  │
  ▼
src/app/[lang]/layout.tsx        <html lang="zh-CN" | "en">
  ├─ SiteHeader（导航 / 主题 / 语言切换）
  ├─ page.tsx                    服务端组件
  │    ├─ getLocale()            next/root-params 的 lang()
  │    ├─ getMessages(locale)    src/i18n/messages/*
  │    ├─ getPosts(locale)       postConnection / postEnConnection
  │    └─ getHomeContent(locale) home / homeEn
  ├─ Body (client)               LocaleProvider -> MDX chrome 文案
  └─ SiteFooter
```

### 4.2 公共 URL 与内部渲染路径

| 公共 URL | 内部 `[lang]` | 处理 |
| --- | --- | --- |
| `/` | `/zh` | proxy rewrite |
| `/posts` | `/zh/posts` | proxy rewrite |
| `/posts/hello-tinacms` | `/zh/posts/hello-tinacms` | proxy rewrite |
| `/en` | `/en` | 直接匹配 |
| `/en/posts/hello-tinacms` | `/en/posts/hello-tinacms` | 直接匹配 |
| `/zh/...` | — | 308 到去掉 `/zh` 的公共 URL |
| `/rss.xml` | `/zh/rss.xml` | proxy rewrite（matcher 需显式包含） |
| `/en/rss.xml` | `/en/rss.xml` | 直接匹配 |
| `/sitemap.xml` | 根级 route | 一次输出两种语言 |
| `/robots.txt`、`/opengraph-image` | 根级 | 不参与语言路由 |
| `/admin/index.html` | `public/admin` | proxy 必须排除 |

> 关键点：**公共 URL 永远不带 `/zh`**。`/zh/...` 只是内部重写目标；用户、canonical、sitemap、RSS 里都不能出现 `/zh`。

### 4.3 数据流

```text
content/posts/*.mdx          -> post       -> client.queries.postConnection
content/posts-en/*.mdx       -> postEn     -> client.queries.postEnConnection

content/pages/*.mdx          -> page       -> client.queries.page
content/pages-en/*.mdx       -> pageEn     -> client.queries.pageEn

content/home/home.json       -> home       -> client.queries.home
content/home-en/home.json    -> homeEn     -> client.queries.homeEn

content/projects/projects.json    -> project    -> client.queries.project
content/projects-en/projects.json -> projectEn  -> client.queries.projectEn
（notes / reading 同理）
```

所有查询都通过 `src/lib/*` 的「按 locale 分支」函数进入，页面不直接接触 generated client；这样 `check:runtime` 的“客户端包不含内容 API”约束仍然成立。

---

## 5. 分阶段实施计划

### Phase 0 · 路由与静态化验证（0.5–1 天）

这是**唯一的架构风险点**：`proxy.ts` 重写 + `[lang]` 静态预渲染 + `revalidate` 在 Vercel 上是否按预期工作。先用一个页面做 spike，再决定是否全量迁移。

任务：

1. 新建分支 `feat/i18n`。
2. **临时**新增一个嵌套的 `src/app/[lang]/layout.tsx`（只返回 `children`，不接管 `<html>`），再加一个临时页面 `src/app/[lang]/spike/page.tsx`；现有根布局和其余中文页面完全不动。这样只验证 proxy + 动态段 + 静态预渲染，不提前动根布局，也不会和现有 `/about` 等路由混淆。
3. 新增最小 `proxy.ts`；`next.config.ts` 暂不加 `globalNotFound`（留到 Phase 1 根布局迁移时）。
4. 跑 `npm run dev` + `npm run build:local`（需要 dev 的内容 API 在跑）。
5. 手工/脚本验证：

| 检查 | 期望 |
| --- | --- |
| `GET /spike` | 200，中文，且确实命中 `[lang]=zh` 的 spike 页（页面里放一个测试标记） |
| `GET /en/spike` | 200，英文 |
| `GET /zh/spike` | 308 → `/spike` |
| `GET /en/not-a-page` | 404 |
| `GET /sitemap.xml`、`/rss.xml`、`/admin/index.html` | 200，不被 proxy 拦截 |
| `.next/prerender-manifest.json` | 同时含 `/zh/spike`、`/en/spike`，都有 `initialRevalidateSeconds` |
| `next start` 后重复上面检查 | 与 dev 一致 |

**Go / No-Go：**

- 通过 → 按本计划继续。
- `proxy` 重写静态页在 Vercel 预览环境不稳定 → 切到 **兜底方案 D**：保留中文根路径，复制一套 `app/(en)/en/...` 薄页面（共享视图组件），不做 proxy。代价是路由文件数量翻倍，但静态行为最确定。
- `global-not-found` 在 Phase 1 实测后有不可接受的实验性风险 → 改用路由组 + 组内 `not-found`，或接受中英双语 404；不影响主体方案。

### Phase 1 · i18n 基础设施（1.5–2 天）

目标：中文站外观和行为完全不变；`/en` 路由壳子可用；所有新基础设施就位。

新增：

```text
src/i18n/
├─ config.ts          # locales / defaultLocale / htmlLang / ogLocale / localePath / switchLocalePath
├─ server.ts          # getLocale()（next/root-params）、getMessages()
├─ format.ts          # formatDate(value, locale)、formatNumber、formatMessage
├─ metadata.ts        # buildMetadata：canonical + hreflang + OG
└─ messages/
   ├─ zh.ts           # 全量中文文案
   ├─ en.ts           # 全量英文文案（类型必须与 zh 一致）
   ├─ index.ts        # { zh, en } 与 Messages 类型
   └─ client.ts       # 仅客户端组件需要的文案切片（MDX chrome / 分页 / 主题）
```

同时：

1. 把所有 `src/app/**/page.tsx` 用 `git mv` 迁到 `src/app/[lang]/**`；URL 由 proxy 保持。
2. `src/app/layout.tsx` → `src/app/[lang]/layout.tsx`，`<html lang={htmlLang[lang]}>`。
3. `src/app/[lang]/layout.tsx` 增加 `generateStaticParams()` 返回 `zh`、`en`。
4. 页头 / 页脚 / 移动端导航的文案改为从 `getMessages()` 取；`SiteHeader` 增加 `<LanguageSwitch />`。
5. `ThemeToggle` 的 `aria-label` / `title` 改为传入文案（它仍然不持有语言状态）。
6. 新增 `src/app/[lang]/not-found.tsx`（页内 `notFound()`），以及 `src/app/global-not-found.tsx`（完全未匹配的 URL；因为根布局在 `[lang]` 下，Next 16 文档建议用 `global-not-found`；它拿不到 locale，所以文案做中英双语，并给两个首页入口）。
7. `src/app/sitemap.ts`、`robots.ts`、`opengraph-image.tsx` 留在根级。

Phase 1 验收：

- `npm run typecheck` 0 错误。
- `/`、`/posts`、`/about` 等中文页面渲染结果与改动前一致（可做截图对比）。
- `/en` 能打开，英文导航/页脚正确；内容暂时仍可显示中文（Phase 2/3 再替换），不对外发布。
- 360/390px 下页头不横向溢出。

### Phase 2 · UI 全量本地化（2–3 天）

目标：英文界面完整；所有用户可见文案来自字典；数据层按 locale 取数。

#### 2.1 数据层

| 文件 | 改动 |
| --- | --- |
| `src/lib/posts.ts` | `getPosts(locale)` 分支 `postConnection` / `postEnConnection` |
| `src/lib/home.ts` | `getHomeContent(locale)` 分支 `home` / `homeEn`；英文默认值 |
| `src/lib/pages.ts` | `getPage(locale, relativePath)` 分支 `page` / `pageEn` |
| `src/lib/projects.ts` | `getProjects(locale)` |
| `src/lib/notes.ts` | `getNotes(locale)` |
| `src/lib/reading.ts` | `getReading(locale)`；`READING_STATUS_LABELS` 改为按 locale 取 |
| `src/lib/taxonomy.ts` | `toPostListItem(post, locale)`、`collectTags(posts, locale)`、`collectSeries(posts, locale)`、`groupByYear(posts, locale)`；`tagPath` / `seriesPath` 保持纯路径，由调用方加 locale 前缀 |
| `src/lib/pagination.ts` | `pagePath(page, locale)` |
| `src/lib/site.ts` | `formatDate(value, locale)`，保留 `timeZone: 'UTC'` |

注意：

- `getPosts` 等继续用 `cache()`，按 locale 参数天然分开缓存。
- 每个 `lib` 的 `DEFAULT_*`（home / projects / notes / reading）都要有英文版本，避免英文页面在内容缺失时回退成中文默认文案。
- `PostSummary` 里仍然只放扁平字段，不要把 `relativePath`、`_sys` 传给客户端组件；`check:runtime` 会扫描客户端包。
- 英文文章缺失时，列表只展示已翻译文章；直接访问 `/en/posts/<未翻译 slug>` 时，若中文对应文章存在则 `redirect(localePath('en', '/posts'))`，否则 `notFound()`。这样页头“同 slug 切换”不会 404。

#### 2.2 文案替换范围

| 区域 | 文件 |
| --- | --- |
| 全局壳 | `src/app/[lang]/layout.tsx`、`mobile-nav.tsx`、`theme-toggle.tsx`、新增 `language-switch.tsx` |
| 首页 | `hero.tsx`、`profile-section.tsx`、`timeline-section.tsx`、`zip-timeline.tsx`、`tech-marquee.tsx` |
| 文章列表 / 文章页 | `posts-index.tsx`、`post-list.tsx`、`post-card.tsx`、`pagination.tsx`、`table-of-contents.tsx`、`post-client.tsx`、`posts/[...filename]/page.tsx` |
| 分类页 | `tags/page.tsx`、`tags/[tag]/page.tsx`、`archive/page.tsx`、`series/page.tsx`、`series/[series]/page.tsx` |
| 内容页 | `projects/page.tsx`、`project-card.tsx`、`notes/page.tsx`、`reading/page.tsx`、`resume/page.tsx`、`about/page.tsx`、`prose-page.tsx`、`start-here/page.tsx`、`now/page.tsx`、`uses/page.tsx` |
| 错误页 | `[lang]/not-found.tsx`、`global-not-found.tsx` |
| MDX chrome | `tina-markdown.tsx`、`callout-styles.ts`（calloutLabels）、`copy-button.tsx`、`zoomable-image.tsx`、`counter.tsx`、`video-embed.tsx`、`invalid-markdown.tsx` |

#### 2.3 客户端边界

- `Body` 增加 `locale` 属性（可序列化字符串），在内部包一层 `LocaleProvider`，让 `Callout`、`CopyButton`、`ZoomableImage`、`InvalidMarkdown` 等客户端组件读取对应语言文案。
- `PostClient` 增加 `locale`，`formatDate(post.date, locale)`；`useTina` 的 query/data 类型按 locale 分支，必要时用一层适配类型/受控 cast，保证英文文章在 Tina 可视化编辑里也能 live update。
- `PostList`、`Pagination`、`MobileNav`、`TableOfContents` 只接收**已格式化好的文案**或小的 `labels` 对象，不把整本字典塞进客户端包。
- `LanguageSwitch` 使用 `usePathname()` + `<a href>`（**整页跳转**，不用 `next/link`）。原因：从 `/posts` 切到 `/en/posts` 时，`<html lang>` 必须由服务端重新输出；客户端同 layout 导航不保证更新 `<html>` 属性。整页跳转还能避免根布局状态残留。
- 切换逻辑（纯函数，可单测）：

```ts
// 概念代码
switchLocalePath(pathname, target):
  '/'                           -> '/en'
  '/posts'                      -> '/en/posts'
  '/posts/page/2'               -> '/en/posts'（分页页码不保证对应，避免 404）
  '/posts/<slug>'               -> '/en/posts/<slug>'（缺失时服务端 redirect 到 /en/posts）
  '/tags/<tag>'                 -> '/en/tags'（标签名可能不同，先进索引）
  '/series/<name>'              -> '/en/series'
  '/about' 等静态页             -> '/en/about'
```

#### 2.4 内部链接规则（容易漏，单独强调）

所有站内链接都必须经过 `localePath(locale, path)`；否则英文页会悄悄链回中文页。

| 场景 | 做法 |
| --- | --- |
| 服务端页面 / 组件 | `const locale = await getLocale()`，`href={localePath(locale, '/posts')}` |
| 客户端组件（`PostList` 等） | 由服务端把 **已带前缀的 href** 或 `locale` 传进来；不要从内容数据里拼路径 |
| `PostCard` | `PostListItem` 增加 `href` 与 `tagLinks: { name, href }[]`，在 `toPostListItem(post, locale)` 里算好 |
| `Pagination` | `pagePath(page, locale)` 或直接传 `previousHref` / `nextHref` |
| `MobileNav` | `items` 带 `href`；active 判断先 `stripLocale(pathname)` 再比较 |
| `PostClient` | 系列、标签、上一篇/下一篇、继续阅读、返回列表全部用 `localePath` |
| RSS | 中文 `/rss.xml`，英文 `/en/rss.xml` |
| 404 | 中文 `/`、`/posts`；英文 `/en`、`/en/posts` |
| 内容里的站内链接（如 project `link: "/"`） | 英文内容里写成 `/en` 或相对当前语言的路径；不自动改写用户内容 |

Phase 2 验收：

- 英文页面的导航、按钮、空状态、分页、目录、文章 chrome 全部英文。
- 中文页面文案与改动前逐字一致。
- `grep` 检查 `src/app`、`src/components` 中不再有用户可见中文硬编码（注释除外，需人工复核）。
- 双语言下日期格式正确：`2026年1月15日` / `January 15, 2026`。

### Phase 3 · 内容模型 + 英文内容（1–2 工程日 + 翻译 2–4 人日）

#### 3.1 Tina 集合设计

| 集合名 | 目录 | 格式 | 说明 |
| --- | --- | --- | --- |
| `post` | `content/posts` | mdx | 现有中文文章，**不动** |
| `postEn` | `content/posts-en` | mdx | 英文文章，复用同一套 `postFields` |
| `page` | `content/pages` | mdx | 现有中文页面，**不动** |
| `pageEn` | `content/pages-en` | mdx | 英文页面 |
| `home` | `content/home` | json | 现有中文首页，**不动** |
| `homeEn` | `content/home-en` | json | 英文首页，单文档 `home.json` |
| `project` / `projectEn` | `content/projects` / `content/projects-en` | json | 项目 |
| `note` / `noteEn` | `content/notes` / `content/notes-en` | json | 笔记 |
| `reading` / `readingEn` | `content/reading` / `content/reading-en` | json | 阅读 |

实现要点：

- 把现有 `postFields`、`page` 字段、home / project / note / reading 的字段抽成 `const xxxFields: TinaField[]`，中英集合复用，避免 schema 漂移。
- 每个英文集合有清晰的 `label`，例如「Blog posts (English)」；`ui.allowedActions` 与中文保持一致（单文档集合仍然禁用新建/删除）。
- **配对规则（V1）：同一相对路径 = 同一篇文章**。`content/posts/hello-tinacms.mdx` ↔ `content/posts-en/hello-tinacms.mdx`，因此 `/posts/hello-tinacms` ↔ `/en/posts/hello-tinacms`，无需额外的映射表。
- 以后如果中英文 slug 需要不同，再加可选的 `translationKey` 字段和映射；本期不做。
- 媒体目录共用 `public/uploads`，英文文章可以复用图片。
- 改完 schema 后必须重启 `npm run dev` 重新生成 client，再跑 `npm run typecheck`（项目已有这个坑）。

#### 3.2 英文内容清单

| 内容 | 文件 | 备注 |
| --- | --- | --- |
| 首页 | `content/home-en/home.json` | 站点名、tagline、scrollHint、profile、facts、timeline、socials 标签 |
| 关于 | `content/pages-en/about.mdx` | 必需 |
| Now | `content/pages-en/now.mdx` | 必需 |
| Uses | `content/pages-en/uses.mdx` | 必需 |
| Start here | `content/pages-en/start-here.mdx` | 必需 |
| 项目 | `content/projects-en/projects.json` | intro + items |
| 笔记 | `content/notes-en/notes.json` | intro + items（body 仍是 Markdown 字符串） |
| 阅读 | `content/reading-en/reading.json` | intro + books |
| 文章 | `content/posts-en/hello-tinacms.mdx`、`content/posts-en/bit_operations.mdx` | 建议全译；至少先译 demo 文章 |

翻译时注意：

- `title` / `description` / `tags` / `series` 都是内容，不是 UI 字典。
- 英文 `tags` 可以和中文不同；标签页按语言各自聚合，不要跨语言合并。
- 英文文章里的自定义组件（`Callout` / `Counter` / `Tabs` / `Figure` / `VideoEmbed`）**不要改结构**，只翻译属性值；属性类型必须与 `tina/config.ts` 一致，否则整篇会退化成 `invalid_markdown`。
- 英文 `body` 仍然由 Tina 解析成 AST，再交给 `<TinaMarkdown>`；不引入任何 MDX 编译器。

#### 3.3 缺失翻译的降级策略

| 内容 | 缺失英文时 |
| --- | --- |
| 文章 | 不出现在 `/en/posts`；`/en/posts/<slug>` 若中文存在则 redirect 到 `/en/posts`，否则 404；中文文章页显示「English version not available」或干脆不显示英文入口 |
| 关于 / Now / Uses / Start here / 首页 | **构建门禁失败**（这些是必需页面，不能中英混排） |
| Projects / Notes / Reading | 英文文档必需；缺失则使用英文默认空状态，并由 `check:i18n` 报错 |
| UI 文案 | 类型系统 + key 对齐门禁保证不缺 |

Phase 3 验收：

- `/en` 全英文，包括首页、关于、项目、笔记、阅读、履历、文章列表、文章详情。
- `/admin/index.html` 能看到英文集合，新建/编辑/保存英文文章正常。
- 中文内容文件没有被 Tina 重写（除非你在编辑器里确实保存过）。
- `npm run check:content` 同时校验中英 MDX。

### Phase 4 · SEO / Feed / 元数据（1 天）

| 项目 | 做法 |
| --- | --- |
| `<html lang>` | `zh-CN` / `en` |
| canonical | 每页只指向自己语言的公共 URL；英文带 `/en`，中文不带 `/zh` |
| hreflang | `zh-CN`、`en`、`x-default`（指向中文）；只有存在对应翻译时才输出双向 alternate |
| OG | `openGraph.locale` = `zh_CN` / `en_US`；`alternateLocale` 指向另一语言；标题/描述/图片按语言 |
| Twitter | 同样按语言 |
| JSON-LD | `inLanguage: 'zh-CN' / 'en'`；`mainEntityOfPage`、`author.url` 用当前语言 URL |
| sitemap | 一个 `/sitemap.xml` 同时列出两种语言；每条带 `alternates.languages` |
| RSS | `/rss.xml`（中文）、`/en/rss.xml`（英文）；`<language>`、`<title>`、`<description>`、`atom:link` 按语言 |
| robots | 仍指向 `/sitemap.xml`，不需要改 |
| 404 | `[lang]/not-found.tsx` 本地化；`global-not-found.tsx` 中英双语 + 两个首页入口 |
| OG 图 | 默认图保持现状（拉丁字体限制）；如需英文/中文分享卡，Phase 4 可选加 `[lang]/opengraph-image.tsx` |

`buildMetadata()` 统一生成：

```ts
// 概念代码
{
  alternates: {
    canonical: localePath(locale, path),
    languages: {
      'zh-CN': localePath('zh', path),
      en: localePath('en', path),
      'x-default': localePath('zh', path),
    },
  },
  openGraph: {
    locale: ogLocale[locale],
    alternateLocale: [ogLocale[other]],
    // ...
  },
}
```

Phase 4 验收：

- 查看页面源码：`<html lang>`、canonical、`hreflang` 三组链接正确；`/zh` 不出现在任何公共链接里。
- `/sitemap.xml` 同时含中英 URL，且每条有 `xhtml:link` alternate。
- `/rss.xml` 和 `/en/rss.xml` 的 `<language>`、标题、文章链接正确。
- 404 页面中英双语或按语言本地化，不出现未样式化页面。

### Phase 5 · 门禁、脚本、测试（1–2 天）

#### 5.1 现有脚本必须同步

| 脚本 | 需要改什么 |
| --- | --- |
| `scripts/validate-content.mjs` | `COLLECTIONS` 增加 `postEn`、`pageEn`；仍用同一套 `richTextField` |
| `scripts/route-contract-smoke.mjs` | 文章目录从 `.next/server/app/posts` 改为 `.next/server/app/zh/posts` + `en/posts`；内部路径 `/zh/...` 映射为公共路径 `/...`；列表 HTML 在 `zh/posts.html` / `en/posts.html`；RSS body 在 `zh/rss.xml.body` / `en/rss.xml.body`；sitemap 同时校验双语 |
| `scripts/runtime-independence-smoke.mjs` | 中文文章路径改为 `zh/posts/<slug>.html`；增加英文文章检查；静态路由清单同时含 `/zh/*`、`/en/*`（含 `/zh/rss.xml`、`/en/rss.xml`）；英文内容标记断言 |
| `scripts/http-status-smoke.mjs` | 中英两套 URL；`/zh/posts` 期望 308；`/en/posts/<missing>` 期望 404 或 redirect（按降级策略） |
| `scripts/admin-smoke.mjs` | 确认英文集合在 admin 列表可见 |
| `scripts/visual-edit-smoke.mjs` | 增加 `/en/posts/hello-tinacms?edit=true`；断言英文内容 |
| `scripts/interaction-smoke.mjs` | 语言切换点击、移动端 360/390 不溢出、主题与语言控件共存 |
| `scripts/save-smoke.mjs` | 可选：验证英文集合保存；至少确认中文保存不受影响 |
| `scripts/motion-smoke.mjs` | 语言切换不引入新动效；`prefers-reduced-motion` 下正常 |
| `scripts/content-guards-smoke.mjs` | 草稿在两种语言下都不泄露 |
| `scripts/verify-prod.mjs` | 生产模式下跑双语言 http / visual / interaction |
| `package.json` | 增加 `check:i18n`、`test:unit` 里的 i18n 单测；`build` / `build:local` 接入 `check:i18n` |

#### 5.2 新增 `scripts/check-i18n.mjs`（离线）

建议检查：

1. `zh.ts` 和 `en.ts` 的 key 完全对齐，无空字符串。
2. 必需的英文文档存在（home / about / now / uses / start-here / projects / notes / reading）。
3. 每篇英文文章都有对应中文文章（反向可选警告）。
4. 翻译覆盖率报告：已翻译 / 未翻译文章列表；`--strict` 时未翻译文章是否失败可配置。
5. 渲染后的中文页面里没有 `href="/zh`；英文页面里没有指向中文页面的错误相对链接。
6. `<html lang>` 与路径前缀一致。
7. sitemap / RSS 同时包含两种语言（可放到 route-contract 里）。

#### 5.3 新增单测

- `localePath('zh', '/posts') === '/posts'`
- `localePath('en', '/posts') === '/en/posts'`
- `switchLocalePath('/posts/x', 'en') === '/en/posts/x'`
- `switchLocalePath('/tags/Next.js', 'en') === '/en/tags'`
- `formatDate(date, 'zh')` / `formatDate(date, 'en')` 在 UTC 下稳定
- `isLocale` 拒绝 `fr`、`zh-CN` 等非法值

#### 5.4 浏览器测试矩阵

| 场景 | 中文 | 英文 |
| --- | --- | --- |
| 首页 / 文章列表 / 文章详情 | ✓ | ✓ |
| 标签 / 归档 / 系列 | ✓ | ✓ |
| 项目 / 笔记 / 阅读 / 履历 / 关于 | ✓ | ✓ |
| 360px / 390px 页头（logo + 主题 + 语言 + 菜单） | ✓ | ✓ |
| 语言切换后 URL / `<html lang>` / 标题 | ✓ | ✓ |
| Tina 可视化编辑 `?edit=true` | ✓ | ✓ |
| 404 / 未知文章 | ✓ | ✓ |
| reduced motion | ✓ | ✓ |

Phase 5 验收：`npm run typecheck`、`npm run build:local`、`npm run smoke`、`npm run smoke:prod` 全绿。

### Phase 6 · 文档、部署、回滚（0.5–1 天）

1. 更新 `README.md`：新增「多语言」一节（目录、URL 规则、如何新增英文文章、如何新增语言）。
2. 更新 `AGENTS.md`：新会话必读里加「i18n 五处同步」：
   - `tina/config.ts` 集合
   - `src/lib/*` 的 locale 分支
   - `src/i18n/messages/{zh,en}.ts`
   - 页面/组件的 `metadata` + `hreflang`
   - `scripts/validate-content.mjs` / `check-i18n.mjs`
3. 更新 `STYLE-GUIDE.md`：语言切换控件的尺寸、位置、hover、移动端规则。
4. 部署到 Vercel Preview，逐项验证：
   - `/`、`/en`、`/en/about`、`/en/posts/...`；
   - `/zh/...` 308；
   - `/sitemap.xml`、`/rss.xml`、`/en/rss.xml`；
   - `/admin/index.html` 和 TinaCloud 英文集合；
   - 客户端包不含内容 API；
   - 360/390 移动端。
5. 合并到 `main`，Vercel 生产部署；在本地跑 `smoke:prod`（生产构建 + `next start`）确认渲染，再对线上域名做一次 HTTP/浏览器抽查（`/`、`/en`、`/zh/posts` 308、`/en/rss.xml`、`/sitemap.xml`）。
6. 回滚策略：英文内容与集合是纯新增；出问题可直接 Vercel 回滚到上一个部署。若只有 proxy 出问题，临时把 `/` 等中文路由改回根级、移除 `/en` 入口即可，不影响中文内容。

---

## 6. 文件级改动清单

### 6.1 新增

```text
src/proxy.ts
src/i18n/config.ts
src/i18n/server.ts
src/i18n/format.ts
src/i18n/metadata.ts
src/i18n/messages/zh.ts
src/i18n/messages/en.ts
src/i18n/messages/index.ts
src/i18n/messages/client.ts
src/components/site/language-switch.tsx
src/components/site/not-found-view.tsx        # 从现有 not-found 抽出的共享视图
src/app/global-not-found.tsx
src/app/[lang]/layout.tsx
src/app/[lang]/not-found.tsx
src/app/[lang]/rss.xml/route.ts
scripts/check-i18n.mjs
scripts/unit-i18n.mjs
content/posts-en/*.mdx
content/pages-en/*.mdx
content/home-en/home.json
content/projects-en/projects.json
content/notes-en/notes.json
content/reading-en/reading.json
```

### 6.2 移动

```text
src/app/layout.tsx                 -> src/app/[lang]/layout.tsx
src/app/page.tsx                   -> src/app/[lang]/page.tsx
src/app/posts/**                   -> src/app/[lang]/posts/**
src/app/tags/**                    -> src/app/[lang]/tags/**
src/app/archive/page.tsx           -> src/app/[lang]/archive/page.tsx
src/app/series/**                  -> src/app/[lang]/series/**
src/app/projects/page.tsx          -> src/app/[lang]/projects/page.tsx
src/app/notes/page.tsx             -> src/app/[lang]/notes/page.tsx
src/app/reading/page.tsx           -> src/app/[lang]/reading/page.tsx
src/app/resume/page.tsx            -> src/app/[lang]/resume/page.tsx
src/app/about/page.tsx             -> src/app/[lang]/about/page.tsx
src/app/start-here/page.tsx        -> src/app/[lang]/start-here/page.tsx
src/app/now/page.tsx               -> src/app/[lang]/now/page.tsx
src/app/uses/page.tsx              -> src/app/[lang]/uses/page.tsx
src/app/not-found.tsx              -> 拆成共享视图 + [lang]/not-found.tsx + global-not-found.tsx
src/app/rss.xml/route.ts           -> src/app/[lang]/rss.xml/route.ts
```

### 6.3 保留在根级（不随 `[lang]` 移动）

```text
src/app/sitemap.ts
src/app/robots.ts
src/app/opengraph-image.tsx
src/app/icon.svg
src/app/globals.css
```

### 6.4 主要修改

- `tina/config.ts`：新增 6 个英文集合；抽取可复用字段数组。
- `next.config.ts`：`experimental.globalNotFound: true`。
- `src/lib/posts.ts`、`home.ts`、`pages.ts`、`projects.ts`、`notes.ts`、`reading.ts`、`taxonomy.ts`、`pagination.ts`、`site.ts`：全部增加 locale 维度。
- `src/components/**`：按 §2.2 表格替换文案、增加 `locale` / `labels` props。
- `src/app/[lang]/**/page.tsx`：`generateMetadata` 使用 `buildMetadata`；动态路由的 `generateStaticParams` 按 locale 取数；`getPosts(locale)` 等。
- `scripts/*`：见 §5.1。
- `README.md`、`AGENTS.md`、`STYLE-GUIDE.md`：文档同步。

---

## 7. 关键实现草案

### 7.1 语言配置

```ts
// src/i18n/config.ts
export const locales = ['zh', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'zh';

export const htmlLang: Record<Locale, string> = { zh: 'zh-CN', en: 'en' };
export const ogLocale: Record<Locale, string> = { zh: 'zh_CN', en: 'en_US' };

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** 公共 URL：中文不带前缀，英文带 /en。 */
export function localePath(locale: Locale, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return locale === defaultLocale
    ? clean
    : clean === '/'
      ? `/${locale}`
      : `/${locale}${clean}`;
}
```

### 7.2 Proxy（按需前缀）

```ts
// src/proxy.ts
import { NextResponse, type NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 英文已是显式前缀，直接进入 [lang]=en
  if (pathname === '/en' || pathname.startsWith('/en/')) return NextResponse.next();

  // /zh 不是公共 URL：308 到无前缀形式
  if (pathname === '/zh' || pathname.startsWith('/zh/')) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/zh/, '') || '/';
    return NextResponse.redirect(url, 308);
  }

  // 其余一律内部重写到 /zh/*
  const url = request.nextUrl.clone();
  url.pathname = pathname === '/' ? '/zh' : `/zh${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    // 排除 _next、admin、uploads、api、带扩展名的静态文件、OG 路由
    '/((?!_next/static|_next/image|admin|uploads|api|opengraph-image|.*\\.[^/]+$).*)',
    // RSS 虽有扩展名，但需要重写到 /zh/rss.xml
    '/rss.xml',
  ],
};
```

> Phase 0 必须实测：`/rss.xml` 的 matcher、`/admin` 的排除、`/opengraph-image` 的排除，以及 `next start` / Vercel Preview 下静态页是否仍按 ISR 提供。

### 7.3 服务端读取语言

```ts
// src/i18n/server.ts
import { lang } from 'next/root-params';
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from './config';
import { messages } from './messages';

export async function getLocale(): Promise<Locale> {
  const value = await lang();
  if (!isLocale(value)) notFound();
  return value;
}

export async function getMessages() {
  const locale = await getLocale();
  return messages[locale];
}
```

> `next/root-params` 只适用于 Server Component / 服务端工具，**不能用于 Route Handler**。`sitemap.ts`、`rss.xml/route.ts` 要显式接收/循环 locale。

### 7.4 Tina 集合

```ts
// tina/config.ts（示意）
const postFields: TinaField[] = [/* 现有字段，抽成常量 */];

export default defineConfig({
  schema: {
    collections: [
      { name: 'post', label: '博客文章', path: 'content/posts', format: 'mdx', fields: postFields },
      { name: 'postEn', label: 'Blog posts (English)', path: 'content/posts-en', format: 'mdx', fields: postFields },
      // page / pageEn、home / homeEn、project / projectEn、note / noteEn、reading / readingEn 同理
    ],
  },
});
```

### 7.5 数据函数

```ts
// src/lib/posts.ts（示意）
export const getPosts = cache(async (locale: Locale): Promise<PostSummary[]> => {
  const { data } =
    locale === 'en'
      ? await client.queries.postEnConnection()
      : await client.queries.postConnection();
  return toPostSummaries(data?.postEnConnection?.edges ?? data?.postConnection?.edges);
});
```

> 实际实现时用两个分支分别取 edges，避免依赖不存在的字段；TypeScript 会在这里给出 generated types 的真实约束。

### 7.6 语言切换控件

```tsx
// src/components/site/language-switch.tsx（概念）
'use client';
import { usePathname } from 'next/navigation';

export function LanguageSwitch({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const target = locale === 'zh' ? 'en' : 'zh';
  const href = switchLocalePath(pathname, target);
  return (
    <a href={href} hrefLang={htmlLang[target]} aria-label={/* 来自字典 */}>
      {target === 'en' ? 'EN' : '中文'}
    </a>
  );
}
```

样式复用现有 `ThemeToggle` / nav pill：2px 边框、磨砂、hover 上浮、`motion-reduce` 关闭位移。移动端与主题按钮并排，360px 下不能溢出；如果放不下，把语言入口收进 `MobileNav` 面板顶部。

---

## 8. 文案盘点（按文件）

> 以下为**需要替换的用户可见文案**的大致范围；注释里的中文不计入。

| 文件 | 主要内容 |
| --- | --- |
| `src/app/layout.tsx` | 导航 4 项、页脚 3 组 12 项、RSS、版权、默认描述 |
| `src/app/page.tsx` + home 组件 | 滚动提示、履历标题、技术栈 aria、拉链 aria |
| `src/components/posts/posts-index.tsx` | eyebrow、标题、内容导航、空状态 |
| `src/components/posts/post-list.tsx` | 全部、搜索占位、空状态、查看标签 |
| `src/components/posts/pagination.tsx` | 上一页 / 下一页 / 第 N 页 |
| `src/components/posts/table-of-contents.tsx` | 本页目录、节、aria |
| `src/app/posts/[...filename]/post-client.tsx` | 约 N 分钟、草稿、系列、标签、上一篇/下一篇、继续阅读、返回列表 |
| `src/app/archive/page.tsx` | eyebrow、标题、描述、N 篇、空状态 |
| `src/app/tags/page.tsx`、`tags/[tag]/page.tsx` | 标题、描述、N 个标签、空状态、全部标签 |
| `src/app/series/page.tsx`、`series/[series]/page.tsx` | 标题、描述、N 个系列、N 篇、空状态 |
| `src/app/projects/page.tsx` + `project-card.tsx` | eyebrow、标题、精选、在线访问、代码、技术栈 |
| `src/app/notes/page.tsx` | eyebrow、标题、空状态 |
| `src/app/reading/page.tsx` + `lib/reading.ts` | 在读/读完/想读、评分、查看这本书、空状态 |
| `src/app/resume/page.tsx` | 标题、空状态 |
| `src/app/about/page.tsx` | eyebrow、Toolbox、N 项、RSS 文案 |
| `src/app/start-here/page.tsx` | eyebrow、精选/最近、N 篇、导航 |
| `src/app/now/page.tsx`、`uses/page.tsx`、`prose-page.tsx` | eyebrow、最后更新于、导航 |
| `src/app/not-found.tsx` | 404 标题、说明、按钮 |
| `src/components/site/mobile-nav.tsx` | 3 组 13 项 + aria |
| `src/components/site/theme-toggle.tsx` | 切换明暗主题 |
| `src/components/mdx/*` | Callout 四种标签、复制/已复制、图片缩放/关闭、计数器、视频 aria、MDX 解析失败提示 |
| `src/lib/site.ts` | `zh-CN` 日期格式 |
| `src/lib/taxonomy.ts` | `未标注日期`、`localeCompare('zh-CN')` |
| `src/app/rss.xml/route.ts` | 默认描述、`zh-CN` |
| `src/app/sitemap.ts` | 无文案，但需双语 URL |
| `src/app/opengraph-image.tsx` | 英文卡片文案；如需中文卡片再扩展 |

---

## 9. 风险与对策

| # | 风险 | 影响 | 对策 |
| --- | --- | --- | --- |
| R1 | `proxy` 重写 + 静态/ISR 在 Vercel 上行为不符预期 | 中文 URL 打不开或绕过缓存 | **Phase 0 先做 spike**；不通过就切兜底方案 D（复制 `/en` 树，不用 proxy） |
| R2 | 根布局在 `[lang]` 下，`global-not-found` 是实验特性 | 未知 URL 的 404 不稳定 | 启用 `experimental.globalNotFound` 并测试；`[lang]/not-found` 处理页内 404；必要时接受双语 404 |
| R3 | 客户端导航切换语言时 `<html lang>` 不更新 | SEO / 屏幕阅读器错误 | 语言切换用 `<a>` 整页跳转，不用 `next/link` |
| R4 | 新增 Tina 集合后 generated client 过期 | typecheck 报不存在的 query | 改 schema 后重启 `npm run dev`；再跑 `tinacms build` / `build:local` |
| R5 | 把 `relativePath` / `_sys` / content API 带进客户端包 | `check:runtime` 失败，内容 API 暴露 | 只传扁平字段（slug/title/dateLabel/tags）；`Body` 只接收 `locale` 字符串 |
| R6 | 日期 / 数字在 server 与 client 格式化不一致 | hydration mismatch | 保留 `timeZone: 'UTC'`；locale 作为显式 prop 传；必要时服务端预格式化 |
| R7 | 中英标签/系列名不同，路径不能简单互换 | 切换后 404 | 标签/系列切换先回索引页；文章同 slug，缺失时 redirect 到 `/en/posts` |
| R8 | 翻译缺失或长期不更新 | 英文站出现中文内容 | 必需页面构建门禁；文章覆盖率报告；英文列表只展示已翻译文章 |
| R9 | `/zh` 被搜索引擎收录或内部链接泄漏 | 重复内容 | proxy 308；`check-i18n` 扫描 `href="/zh`；canonical 永远不带 `/zh` |
| R10 | 移动端页头多一个控件导致横向溢出 | 360–390px 破版 | 语言控件做成紧凑 pill；放不下就收进 MobileNav；Playwright 360/390 断言 `scrollWidth <= clientWidth` |
| R11 | 现有 smoke 脚本硬编码中文/路径 | 门禁假失败或漏检 | 按 §5.1 全量更新；新增双语言断言 |
| R12 | 新增动效/样式破坏 STYLE-GUIDE | 视觉不一致 / 移动端违规 | 复用现有 pill；不加新动画；`motion-reduce` 下无位移 |
| R13 | TinaCloud schema 未及时索引 | 线上编辑器看不到英文集合 | 部署后检查 TinaCloud schema 状态；必要时重新触发索引 |
| R14 | Cloudflare DNS 被改成代理（橙云） | 站点/证书异常 | 保持 DNS-only 灰云；本期不动 DNS |

---

## 10. 工作量与排期

按 1 名熟悉该项目的工程师估算：

| 阶段 | 工程日 | 主要产出 |
| --- | --- | --- |
| Phase 0 路由 spike | 0.5–1 | 可行性结论、proxy/静态验证 |
| Phase 1 i18n 基础 | 1.5–2 | 字典、layout、语言切换、404、路由迁移 |
| Phase 2 UI 全量本地化 | 2–3 | 所有页面/组件/数据层 locale 化 |
| Phase 3 内容模型 + 英文内容 | 1–2（+ 翻译 2–4） | Tina 集合、英文文件、编辑器可用 |
| Phase 4 SEO / Feed | 1 | canonical、hreflang、sitemap、RSS、JSON-LD |
| Phase 5 门禁 / 测试 | 1–2 | 脚本升级、新门禁、双语言 smoke |
| Phase 6 文档 / 部署 | 0.5–1 | README/AGENTS/STYLE-GUIDE、Vercel 验证 |
| **合计** | **7–11 工程日** | 不含翻译 |

建议排期：

- **第 1 周**：Phase 0 + Phase 1 + Phase 2 前半（约 4–5 天）。
- **第 2 周**：Phase 2 后半 + Phase 3（并行翻译）+ Phase 4。
- **第 3 周**：Phase 5 + Phase 6 + 缓冲。

范围选项：

| 范围 | 内容 | 工程日 |
| --- | --- | --- |
| A. 完整双语（推荐） | 全 UI + 必需页面 + 全部文章 | 7–11 |
| B. 核心双语 | 全 UI + 首页/关于/项目 + 1–2 篇样章 | 5–7 |
| C. 仅 UI 切换 | 界面英文，内容仍中文 | 3–4（不推荐：英文站会大量出现中文正文） |

---

## 11. 验收标准

### 11.1 功能

- [ ] `/`、`/posts`、`/posts/<slug>`、`/about` 等中文 URL 与改动前完全一致。
- [ ] `/en`、`/en/posts`、`/en/posts/<slug>`、`/en/about` 等英文页面可访问。
- [ ] 页头语言切换在桌面和移动端都可见、可点击；切换后 URL、`<html lang>`、页面标题同步变化。
- [ ] `/zh/...` 返回 308 到无前缀 URL。
- [ ] 未翻译的英文文章不会 404 得莫名其妙：redirect 到 `/en/posts` 或给出明确说明。
- [ ] 中文页面不出现英文 UI 文案，英文页面不出现中文 UI 文案（内容本身除外）。

### 11.2 内容与编辑器

- [ ] 英文首页、关于、Now、Uses、Start here、项目、笔记、阅读、文章都有内容。
- [ ] `/admin/index.html` 能看到英文集合；新建/编辑/保存英文文章正常。
- [ ] 英文 MDX 的自定义组件渲染正常，没有 `invalid_markdown`。
- [ ] 中文 `content/` 文件没有被无故重写。

### 11.3 SEO

- [ ] 每个页面有 self canonical；中文不带 `/zh`，英文带 `/en`。
- [ ] 每个有翻译的页面有 `zh-CN` / `en` / `x-default` hreflang。
- [ ] `/sitemap.xml` 同时包含中英 URL 和 alternate。
- [ ] `/rss.xml` / `/en/rss.xml` 的 `<language>`、标题、链接正确。
- [ ] 文章 JSON-LD 的 `inLanguage` 正确。
- [ ] 404 页面返回 404 状态，且视觉正常。

### 11.4 工程门禁

- [ ] `npm run typecheck` 0 错误。
- [ ] `npm run build:local` 通过。
- [ ] `npm run check:content` 中英全部通过。
- [ ] `npm run check:runtime` 通过（客户端包不含内容 API）。
- [ ] `npm run check:routes` 通过（双语 URL 都有预渲染页）。
- [ ] `npm run smoke` / `npm run smoke:prod` 通过。
- [ ] 360px / 390px 无横向溢出。
- [ ] `prefers-reduced-motion` 下无新增动效问题。

---

## 12. 待确认问题

在开工前需要你拍板：

1. **英文范围**：选完整双语（A），还是先做核心页面 + 样章（B）？两篇现有文章是否都要翻译？
2. **URL 方案**：接受「中文保持根路径、英文 `/en`」吗？还是更希望 `/zh` + `/en` 的对称结构（需要给旧 URL 做 308）？
3. **内容维护方式**：接受「英文独立文件 + 同 slug 配对」吗？还是希望在同一篇文档里切换中英字段？
4. **翻译来源**：英文由你提供/校对，还是先由我出机翻初稿再由你改？语气偏「个人博客」还是「正式简历」？
5. **语言代码**：用 `en` 还是 `en-US`？站点英文名是否用 `Vector Yu's Blog`？
6. **是否要浏览器语言自动跳转**：建议不做；如果你希望首次访问 `/` 时按浏览器语言提示，可以加一个不自动跳转的提示条。

确认后，我按 Phase 0 开始实现；如果选 B/C，我会先调整阶段范围和验收标准。

---

## 附录 A · 为什么不是“把中文也加上 `/zh`”

| 维度 | 中文根路径 + `/en`（推荐） | `/zh` + `/en` |
| --- | --- | --- |
| 现有 URL | 不变 | 全部改变，需要 308 |
| SEO 迁移 | 无 | 需要重新收录 / 传递权重 |
| 分享链接 | 不变 | 旧链接跳转 |
| 实现复杂度 | 需要 proxy 重写 | 不需要 proxy |
| 长期维护 | 一份路由树 | 一份路由树 |
| 静态行为 | Phase 0 验证 | 最直接 |

对一个已上线、链接已经发出去的个人站，**URL 稳定性**比“结构对称”更重要，所以推荐前者。

## 附录 B · 参考资料

- Next.js 16 官方 i18n 指南：`node_modules/next/dist/docs/01-app/02-guides/internationalization.md`
- Next.js 16 `proxy.ts`：`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`
- Next.js 16 `next/root-params`：`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/next-root-params.md`
- Next.js 16 `global-not-found`：`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/not-found.md`
- 项目内规约：`AGENTS.md`、`README.md`、`STYLE-GUIDE.md`
