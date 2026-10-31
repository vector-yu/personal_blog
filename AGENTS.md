# 新会话必读（给未来的我 / 其他 AI）

这是一个已上线的 Next.js 16 + TinaCMS 3 静态博客。本文件是**最短上手路径**，目的是让新会话不用重新摸索。
请先读完本文件，再读 `README.md` 的对应章节，然后直接动手。

> **要改样式？先读 [`STYLE-GUIDE.md`](./STYLE-GUIDE.md)。**
> 视觉语言、改哪里、不能碰什么、怎么验证、以及**已经踩过的坑**都在那里 ——
> 那是改样式的最短路径。完整的决策理由与实测数据在 `STYLE-DIRECTIONS.md`（当附录查）。

---

## 一、这个项目是什么

| 项 | 值 |
| --- | --- |
| 项目路径 | `D:\deepseek harness\workspace` |
| 框架 | Next.js 16.3.5（App Router）+ React 19 + TypeScript |
| 样式 | Tailwind CSS v4（`@tailwindcss/postcss` + typography） |
| CMS | TinaCMS 3.13.0 + TinaCloud |
| 线上域名 | https://yujingyao.com （也绑定在 TinaCloud Site URL 白名单里） |
| 部署 | Vercel，构建命令 `npm run build`（**不要改成 `next build`**） |
| 内容 | 中文：`content/posts/*.mdx`、`content/pages/*.mdx`；英文：`content/posts-en/*.mdx`、`content/pages-en/*.mdx`；主页/项目/随笔/阅读是 JSON 单文档，英文为同目录的 `*.en.json` |

**铁律（产品要求，不要违反）**：正文渲染只用 Tina 官方的 `<TinaMarkdown>`。
**不要**引入 `next-mdx-remote`、`@next/mdx` 或任何 MDX 编译管线。

> **首页（`/zh`、`/en`，根路径 `/` 只做 308）是个人档案页，不是文章列表。** 数据全部来自 `content/home/home.json`
> （英文为 `home.en.json`；Tina 的「个人主页」集合，`format: 'json'`、单文档、编辑器里禁用新建/删除）。
> `siteName` 同时驱动顶部导航、浏览器标题和 og；`background.kind` 可在
> gradient / image / video 之间切换（留空自动回退 gradient）。
> 个人介绍与履历之间有 `Toolbox` 技术栈带（`techStack`）：桌面自动循环、悬停暂停，
> `md` 以下/reduced-motion 下退化为静态横向滑动；关于页用同一份数据画 3/4 列小方块。
> 图标是 `public/tech/<key>.svg` + `src/lib/tech.ts` 的品牌色 mask；未知图标回退首字母。
>
> 首页没有「关于我」「履历」小标题。履历是**上下两层**：顶层磨砂玻璃拉链只在
> 「桌面 + JS」下渲染，滚动拉开后露出下层履历；手机、reduced-motion、无 JS 时
> 不渲染顶层，直接显示完整履历。正文始终在预渲染 HTML 里。
> 拉链底部有布帘下摆：`curtain-hem` 在舞台底部上下各延伸，波浪 mask + 竖向褶皱 +
> 投影，配一个拉链底部止口。**根容器必须是 `overflow-x-clip`**（只裁横向），不能改回
> `overflow-hidden`，否则下摆会被切平；也不要移除下摆。
> 顶栏没有「履历」入口：完整履历嵌在 `/zh/about` / `/en/about` 的 `#resume` 段，与首页共用 `timeline`；
> 旧的 `/zh/resume`、`/en/resume` 308 到 `/about#resume`。关于页把 Toolbox + 正文放进一个原生
> `<details>` 折叠框（默认收起，无 JS 可展开），不要再加回独立的履历页。
> 阅读页由 `home.showReading` 控制：关闭时页脚无链接、`/reading` 404、sitemap 不收录。
> 详见 `README.md` 的「个人主页」一节。

> **个人品牌站的页面结构**：所有路由都在 `src/app/[lang]/` 下，公共 URL 带 `/zh` 或 `/en`。
> 主入口是 `/posts`、`/projects`、`/notes`（界面名「随笔」/ Essays）、`/about`；二级入口在页脚与文章页次级导航：
> `/tags`、`/tags/[tag]`、`/archive`、`/series`、`/series/[series]`、`/start-here`、`/reading`（可开关）
> （均以 `/{lang}` 开头）。`/now`、`/uses` 已删除，旧地址 308 到 `/about`。
> `project` / `note` / `reading` 是 JSON 单文档集合（禁用新建/删除）；`start-here` 是
> `content/pages/*.mdx`。文章的 `series` / `featured` 字段分别驱动系列页和「从这开始」。
> **随笔的 `body` 在 JSON 里是 Markdown 字符串**，不是 rich-text AST；手写 AST 会得到
> `invalid_markdown`。
> **移动端**：`sm` 以上顶栏显示 4 个主链接；`sm` 以下收进 `MobileNav`（360–390px 不能
> 横向溢出）。**文章目录**在 `lg+` 固定在正文右侧；h1/h2/h3 的 `id` 与 TOC 必须共用
> `src/lib/toc.ts` 的 `slugifyHeading`。

---

## 二、必须先记住的一件事：新增组件要同步 4 处

这是本项目最容易出错的地方。漏掉任何一处，都不会有编译报错，但线上会出问题：

| # | 文件 | 加什么 | 漏了会怎样 |
| --- | --- | --- | --- |
| 1 | `tina/config.ts` → `richTextTemplates` | 模板定义（`name` 必须 **PascalCase**） | 编辑器「插入组件」菜单里没有它 |
| 2 | `src/components/tina-markdown.tsx` → `components` 映射表 | 与模板**同名**的条目 + `data-tina-field` 包裹 | 线上渲染成一行原始文本 |
| 3 | `scripts/validate-content.mjs` → `richTextField.templates` | 同样的模板定义 | 内容门禁会误报，构建失败 |
| 4 | `src/components/mdx/<name>.tsx` | 组件本体（需要交互就加 `'use client'`） | — |

### 还有两条硬约束

- **属性类型必须与模板字段类型一致**。声明为 `rich-text` 的字段不能当字符串属性传，
  否则**整篇正文**会退化成 `invalid_markdown` 节点（有渲染兜底，但内容等于废了）。
  嵌套富文本必须走 `children` 子节点。
- **组件名必须大写开头**。`<callout />` 会被 MDX 解析器当成原始 HTML，页面上原样显示。

参考实现：`Callout`（嵌套富文本 + 固定选项）、`Counter`（客户端状态 + localStorage）、
`Tabs`（对象列表 + ARIA）、`Figure`（image 字段 + 远程主机白名单）、`VideoEmbed`（白名单拼 URL）、
`Math`（KaTeX 字符串 + `display`）。

---

## 三、多语言（`/zh` + `/en`）必须同步的地方

URL 是语言的唯一来源，**不要**做 cookie-only 切换。所有页面在 `src/app/[lang]/` 下，公共 URL 带 `/zh` 或 `/en`；根 `/` 由 `next.config.ts` 308 到 `/zh`，旧的无前缀地址也会 308 到 `/zh/...`。

| # | 位置 | 要做什么 | 漏了会怎样 |
| --- | --- | --- | --- |
| 1 | `src/i18n/config.ts` | `locales` / `htmlLang` / `ogLocale` / `localePath` / `switchLocalePath` | 语言切换和 canonical 错位 |
| 2 | `src/i18n/messages/{zh,en}.ts` | 两边 key 完全一致（类型会强制） | `check:i18n` / `typecheck` 失败 |
| 3 | `src/app/[lang]/**` | 每页 `getLocale()` + `messagesFor()`；metadata 用 `buildMetadata()` | 英文页出现中文标题/描述 |
| 4 | `src/lib/{posts,home,pages,projects,notes,reading}.ts` | 按 locale 选集合或 `*.en.json` | 英文页读中文内容 |
| 5 | `tina/config.ts` | `postEn` / `pageEn` 集合；JSON 集合 `match: '*'` | 英文内容在编辑器里看不到 |
| 6 | `scripts/check-i18n.mjs` | 必需英文文档、文章/页面同 slug 配对 | 构建不会拦住缺失翻译 |

### 硬规则

- **所有站内链接**必须经过 `localePath(locale, path)`。客户端组件不要自己拼 `/posts/...`，由服务端把已带前缀的 `href` / `labels` 传进来。
- **语言切换用 `<a>` 整页跳转**，不要用 `next/link`：`[lang]` 是根参数，必须让服务端重新输出 `<html lang>`。
- **标签/系列详情页切换到另一语言时回索引页**（`switchLocalePath` 已处理），因为标签名是翻译内容，同路径不保证存在。
- **英文文章缺失**：不出现在 `/en/posts`；`/en/posts/<slug>` 若中文存在则 redirect 到 `/en/posts`，否则 404。
- **英文内容与中文同 slug**：`content/posts/foo.mdx` ↔ `content/posts-en/foo.mdx`；`content/pages/bar.mdx` ↔ `content/pages-en/bar.mdx`；JSON 是 `home.json` ↔ `home.en.json`。
- **MDX chrome** 的文案走 `LocaleProvider` / `useLocaleCopy()`；不要在每个 MDX 组件里另写一份中文。
- 新增英文内容后跑 `npm run check:i18n -- --strict`；`build` / `build:local` 已内置。

---

## 四、开发流程

```bash
npm install          # 首次
npm run dev          # 站点 3000 + 本地内容 API 4001；编辑器在 /admin/index.html
```

**本地不需要 TinaCloud 账号**，走的是本地文件内容 API。

### 改完必须验证

```bash
npm run typecheck    # tsc --noEmit，必须为 0
npm run build:local  # 完整本地构建 + 全部离线门禁
```

`build:local` 需要 `npm run dev` 正在运行（它要从本地 API 读内容）。
它会依次跑：内容校验 → 双语内容校验 → `next build` → 运行时独立性 → 路由契约。

### 只改样式时

同样跑 `npm run typecheck` + `build:local`；涉及交互/布局改动的，跑一次浏览器测试：

```bash
npm install --no-save playwright   # 首次需要
npm run smoke                      # http / admin / visual / interaction / language / motion / save
```

> ⚠️ `npm install`（不带 `--no-save`）会把 playwright 清掉，因为它是 `--no-save` 装的，
> 用之前重新装一次。

---

## 五、踩过的坑（别再踩）

1. **不要用 `tinacms dev --no-server` 启动本地 API** —— 它不启动 API，只重新生成 client。
2. **不要加 `--noWatch`** —— 会关闭内容监听。删改 `content/` 文件后索引可能不刷新，
   导致构建产物里出现过期内容；**遇到诡异现象先重启本地 API**（我踩过两次）。
3. **保存会重写整个文件**：Tina 用自家序列化器重写 `.mdx`（去引号、重排 JSX）。
   语义不变，但第一次 diff 很大，这是正常现象。
4. **新增远程图床要加白名单**：`src/lib/image-hosts.ts` 的 `ALLOWED_IMAGE_HOSTS`。
   不在白名单的远程图会让优化器返回 400、页面 200 但图裂——组件已做降级（用原始 `<img>`）
   并打印开发警告。
5. **Vercel 上 `NEXT_PUBLIC_SITE_URL` 已在环境变量里设为 `https://yujingyao.com`**。
   它控制 canonical / og / sitemap / RSS。**不要写进本地 `.env`**（`.env` 优先于 Vercel 变量）。
6. **本地 `.env` 里的占位符是故意的**，真实凭据只放在 Vercel 环境变量和你的本地 `.env` 中；
   `.env` 已 gitignore。
7. **单文档集合不要加 `ui.router: () => '/'`**（实测踩过）：它会让 `/admin` 的集合列表
   直接跳到站点根（URL 变成 `#/~ /`），文档根本打不开。首页集合「个人主页」因此只保留
   `allowedActions`，不加 router——编辑在表单里，看站点走顶部导航。
8. **首页集合是 `format: 'json'`**：改完 schema 后仍要重启 `npm run dev` 重新生成 client；
   `content/home/home.json` 是内容，必须提交到 git。
9. **根布局在 `src/app/[lang]/layout.tsx`**，不要新增 `src/app/layout.tsx`：那会让 `<html lang>`
   退回固定值。根路径 `/` 由 `next.config.ts` 的 308 处理，不要再加 `src/app/page.tsx`。
10. **`app/global-not-found.tsx` 是实验特性**（`next.config.ts` 的 `experimental.globalNotFound`）：
    它拿不到 locale，所以是双语 404；页内 `notFound()` 用 `[lang]/not-found.tsx`。
11. **英文文章/页面必须与中文同 slug**：`content/posts/foo.mdx` ↔ `content/posts-en/foo.mdx`。
    不同 slug 需要额外的 `translationKey` 映射，本期没有；`check:i18n --strict` 会拦住。
12. **语言切换必须整页跳转**（`<a>`），不要改成 `next/link`。切换后 `<html lang>` 必须由服务端重出；
    标签/系列详情页会回索引页，不要硬拼同路径。
13. **JSON 英文文档是 `*.en.json`**（`home.en.json`、`projects.en.json` 等），不是新目录；
    `tina/config.ts` 的 `match: '*'` 让两份文档都出现在同一个集合里。
14. **改了 `tina/config.ts` 的 schema 后，TinaCloud 远端索引必须完成，Vercel 才能构建。**
    典型报错：

    ```text
    The local GraphQL schema doesn't match the remote GraphQL schema.
    Last indexed at: <旧时间>
    Reason: [NON_BREAKING - TYPE_ADDED] Type 'PostEn' was added
    ```

    这不是代码错误。`tina/tina-lock.json` 已提交、`npm run build:local` 也通过，只说明本地正确；
    **push 不等于 TinaCloud 已索引**，索引是异步的，可能在 Vercel 构建开始后才完成，甚至 webhook 没触发。
    处理：到 TinaCloud 项目配置（`https://app.tina.io/projects/<clientId>/configuration`）
    对 `main` 分支点 **Reindex**，等状态变成 `complete`，再在 Vercel 点 **Redeploy**。
    不要用 `--skip-cloud-checks` 绕过：那会让 `/admin` 查询一个远端不存在的 schema。
    判断远端是否已更新：查询远端 GraphQL 的 `__schema` 里是否出现新类型（如 `PostEn` / `PageEn`），
    或看 TinaCloud 的索引时间是否晚于该提交。
15. **数学公式不要用 `$...$` 裸写**。Tina 的 `parseMDX` 没有 remark/rehype 插件入口，
    `remark-math` / `rehype-katex` 接不进去；`$e^{i\pi}$` 里的 `{}` / `\` 会被当成 MDX 表达式，
    整篇正文变成 `invalid_markdown`（后台红框 `Error parsing markdown`）。
    正确写法：行内用反引号包住 `` `$e^{i\pi}$` ``，块级用 ```math 代码块，或插入 `Math`
    组件（`formula` + `display`）。渲染实现是 `src/components/mdx/math.tsx` + KaTeX CSS。
    已有大量 `$...$` 文章用 `npm run convert:math -- --write <目录>` 批量转换
    （默认 dry-run；脚本会跳过 frontmatter、代码块、行内代码，并用 `parseMDX` 验证结果）。
    全角标点本身可以正常解析；如果它在公式里，随公式一起走这三条路径就不会报错。

---

## 六、质量门禁一览（`npm run build` 里跑的）

顺序：`check:env --strict` → `tinacms build` → `check:artifacts --strict` →
`check:content --strict` → `check:i18n --strict` → `next build` → `check:runtime` → `check:routes`

| 命令 | 作用 |
| --- | --- |
| `check:env` | Tina 凭据 / 站点地址是否可用（占位符会失败） |
| `check:artifacts` | 生成的 client 不能指向 localhost、admin 不能是 dev 版 |
| `check:content` | 用 Tina 官方解析器校验每篇正文，解析失败即阻断构建 |
| `check:i18n` | 中英字典 key 对齐、必需英文文档、文章/页面同 slug 配对 |
| `check:runtime` | 中英正文已烘焙进 HTML、客户端包不含内容 API、路由是静态 |
| `check:routes` | 中英列表/首页/sitemap/RSS 发出的 URL 都有对应预渲染页面 |
| `test:unit` | 图片主机匹配、站点地址、locale 路径与日期格式化（离线，无需构建） |

> `check:runtime` 与 `check:routes` 在找不到构建产物时**会跳过并警告**（CI 文件系统可能只保留产物），
> `build:local` 会用 `--require-bundles` / `--require-artifacts` 强制它们真跑。

---

## 七、上线状态

**已全部完成并验证**：

- Vercel 部署成功，站点正常访问
- 自定义域名 `https://yujingyao.com`（Cloudflare DNS，**必须保持 DNS-only 灰云**）已生效
- TinaCloud Site URL 白名单已包含该域名
- **在线编辑并保存已真实验证过**（编辑器改动提交到 GitHub 并触发重新部署）
- 之前阻塞部署的 `check:runtime` / `check:routes` 路径假设问题已修复

## 八、历史记录（了解即可）

`PLAN-blog-tinacms-nextjs.md` 是当初的实施方案，其中的实测结论仍然有效；
功能盘点与后期优化方向在 `README.md` 与 `DEPLOYMENT.md`。
