import { defineConfig, type TinaField, type TinaTemplate } from 'tinacms';

/**
 * Branch resolution.
 *
 * - `NEXT_PUBLIC_TINA_BRANCH` — set explicitly. Worth setting on Vercel for Production AND
 *   Preview, because this value decides which TinaCloud branch the editor writes to.
 * - `VERCEL_GIT_COMMIT_REF` — Vercel's system variable for the branch being built. Note the
 *   name: Vercel does NOT provide a `NEXT_PUBLIC_`-prefixed variant, so an earlier revision
 *   of this file referenced a variable that never exists on Vercel.
 * - `HEAD` — Netlify's equivalent.
 *
 * Caveat: on a preview deployment this resolves to the feature branch, which TinaCloud must
 * have indexed, otherwise `tinacms build` fails with "Branch '<name>' is not on TinaCloud".
 * Pinning `NEXT_PUBLIC_TINA_BRANCH=main` instead makes preview editors edit `main` — content
 * that is not what the preview URL renders. Choose deliberately; see DEPLOYMENT.md.
 */
const branch =
  process.env.NEXT_PUBLIC_TINA_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  'main';

/**
 * Shared rich-text templates = the custom components an editor can insert from the
 * rich-text "embed" menu.
 *
 * RULES (verified against TinaCMS 3.13):
 *  1. `name` MUST be PascalCase. A lowercase name is treated as raw HTML by the MDX
 *     parser and renders as literal text instead of a React component.
 *  2. `name` MUST match the key used in the `components` map passed to <TinaMarkdown>.
 *  3. Attribute/prop types must match the field types declared here. Declaring a field
 *     as `rich-text` and then passing a string attribute makes the whole body fall back
 *     to an `invalid_markdown` node. Nested rich text must use `children`.
 *  4. `children` and `mark` are reserved field names - do not use them.
 */
const richTextTemplates: TinaTemplate[] = [
  {
    name: 'Callout',
    label: '提示框 (Callout)',
    fields: [
      {
        name: 'type',
        label: '类型',
        type: 'string',
        options: ['info', 'warning', 'success', 'danger'],
        required: true,
      },
      {
        name: 'title',
        label: '标题',
        type: 'string',
      },
      {
        name: 'body',
        label: '正文',
        type: 'string',
        ui: { component: 'textarea' },
      },
      {
        // Nested rich text goes through child nodes, not an attribute.
        name: 'children',
        label: '内容（富文本）',
        type: 'rich-text',
      },
    ],
  },
  {
    name: 'Counter',
    label: '计数器 (Counter)',
    fields: [
      { name: 'label', label: '按钮文字', type: 'string' },
      { name: 'initialValue', label: '初始值', type: 'number' },
      { name: 'step', label: '步长', type: 'number' },
    ],
  },
  {
    name: 'Tabs',
    label: '标签页 (Tabs)',
    fields: [
      {
        name: 'tabs',
        label: '标签页列表',
        type: 'object',
        list: true,
        ui: {
          itemProps: (item) => ({ label: item?.label ?? '标签页' }),
        },
        fields: [
          { name: 'label', label: '标签名', type: 'string', required: true },
          { name: 'content', label: '内容', type: 'string', ui: { component: 'textarea' } },
        ],
      },
    ],
  },
  {
    name: 'Figure',
    label: '图片 (Figure)',
    fields: [
      { name: 'src', label: '图片', type: 'image', required: true },
      { name: 'alt', label: '替代文字 (alt)', type: 'string' },
      { name: 'caption', label: '图注', type: 'string' },
      {
        name: 'width',
        label: '宽度 (px)',
        type: 'number',
      },
      {
        name: 'height',
        label: '高度 (px)',
        type: 'number',
      },
      {
        name: 'priority',
        label: '优先加载（首屏图片）',
        type: 'boolean',
      },
    ],
  },
  {
    name: 'VideoEmbed',
    label: '视频 (Video)',
    fields: [
      {
        name: 'provider',
        label: '平台',
        type: 'string',
        options: ['youtube', 'bilibili'],
        required: true,
      },
      {
        name: 'videoId',
        label: '视频 ID 或链接',
        type: 'string',
        description: '可以填视频 ID，也可以直接粘贴完整链接。',
        required: true,
      },
      { name: 'title', label: '标题（无障碍）', type: 'string' },
      { name: 'caption', label: '说明文字', type: 'string' },
    ],
  },
];

const postFields: TinaField[] = [
  {
    type: 'string',
    name: 'title',
    label: '标题',
    isTitle: true,
    required: true,
  },
  {
    type: 'datetime',
    name: 'date',
    label: '发布日期',
    required: true,
    ui: { dateFormat: 'YYYY-MM-DD' },
  },
  {
    type: 'string',
    name: 'description',
    label: '摘要',
    ui: { component: 'textarea' },
  },
  {
    type: 'string',
    name: 'tags',
    label: '标签',
    list: true,
  },
  {
    type: 'image',
    name: 'cover',
    label: '封面图',
  },
  {
    type: 'string',
    name: 'series',
    label: '所属系列',
    description: '相同的系列名会自动生成 /series/[系列名] 聚合页；留空表示单篇。',
  },
  {
    type: 'boolean',
    name: 'featured',
    label: '在「从这开始」中推荐',
  },
  {
    type: 'boolean',
    name: 'draft',
    label: '草稿（不在列表中展示）',
  },
  {
    type: 'rich-text',
    name: 'body',
    label: '正文',
    isBody: true,
    templates: richTextTemplates,
  },
];

export default defineConfig({
  branch,
  // Both are required for TinaCloud. Provided through environment variables.
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
  token: process.env.TINA_TOKEN,

  build: {
    outputFolder: 'admin',
    publicFolder: 'public',
  },

  media: {
    tina: {
      mediaRoot: 'uploads',
      publicFolder: 'public',
    },
  },

  schema: {
    collections: [
      {
        /*
         * The homepage is STRUCTURED DATA, not a rich-text page: a headline, a
         * handful of profile rows and a résumé list. JSON keeps every one of
         * those a first-class, editable field instead of making the owner edit
         * MDX by hand. There is exactly one document (`match`), so the editor
         * disables create/delete and the server reads a fixed `home.json`.
         */
        name: 'home',
        label: '个人主页',
        path: 'content/home',
        format: 'json',
        match: { include: 'home' },
        ui: {
          // Exactly one document, so the editor never offers create/delete.
          // NOTE: deliberately no `router` here. A collection-level router of
          // `() => '/'` made the admin redirect the collection LIST away to the
          // site root (`#/~ /`), so the homepage document could not be opened at
          // all in /admin. The document is edited in the form; the site page is
          // opened from the usual "view site" link.
          allowedActions: { create: false, delete: false },
        },
        fields: [
          {
            type: 'string',
            name: 'siteName',
            label: '网站名称',
            isTitle: true,
            required: true,
            description: '首页大标题，同时作为顶部导航与浏览器标题里的站点名。',
          },
          {
            type: 'string',
            name: 'tagline',
            label: '副标题 / 座右铭',
            ui: { component: 'textarea' },
            description: '显示在大标题下方的一句话。',
          },
          {
            type: 'string',
            name: 'scrollHint',
            label: '向下滚动提示',
            description: '首屏底部的小字，留空则使用默认文案。',
          },
          {
            type: 'object',
            name: 'background',
            label: '首屏背景',
            description: '默认使用站点的流动几何背景；也可以换成图片或视频。',
            fields: [
              {
                type: 'string',
                name: 'kind',
                label: '背景类型',
                options: ['gradient', 'image', 'video'],
                required: true,
              },
              {
                type: 'image',
                name: 'image',
                label: '背景图片',
                description: '背景类型选 image 时生效。',
              },
              {
                type: 'string',
                name: 'video',
                label: '背景视频地址',
                description: '背景类型选 video 时生效，可填 .mp4 直链或 /uploads/xxx.mp4。',
              },
              {
                type: 'image',
                name: 'poster',
                label: '视频封面（可选）',
              },
              {
                type: 'number',
                name: 'dim',
                label: '压暗程度（0–100）',
                description: '数值越大，背景越暗，文字越清楚。',
              },
              {
                type: 'number',
                name: 'blur',
                label: '虚化程度（0–40）',
                description: '背景图片 / 视频的模糊半径，单位为像素。',
              },
            ],
          },
          {
            type: 'object',
            name: 'profile',
            label: '个人介绍',
            fields: [
              { type: 'image', name: 'avatar', label: '头像' },
              { type: 'string', name: 'name', label: '姓名' },
              { type: 'string', name: 'school', label: '就读学校' },
              {
                type: 'string',
                name: 'bio',
                label: '自我介绍',
                ui: { component: 'textarea' },
              },
              {
                type: 'object',
                name: 'facts',
                label: '更多信息（逐条展示）',
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.label ?? '信息' }),
                },
                fields: [
                  { type: 'string', name: 'label', label: '标签', required: true },
                  { type: 'string', name: 'value', label: '内容' },
                ],
              },
            ],
          },
          {
            type: 'object',
            name: 'socials',
            label: '社交链接（页脚 / 关于页）',
            description: '留空则不展示；图标只是视觉，链接支持 https、mailto 和站内路径。',
            list: true,
            ui: {
              itemProps: (item) => ({
                label: item?.label || item?.kind || '社交链接',
              }),
            },
            fields: [
              { type: 'string', name: 'label', label: '显示名称', required: true },
              {
                type: 'string',
                name: 'url',
                label: '链接',
                required: true,
                description: '例如 https://github.com/you 或 mailto:hi@example.com。',
              },
              {
                type: 'string',
                name: 'kind',
                label: '图标',
                options: ['github', 'email', 'x', 'bilibili', 'rss', 'link'],
              },
            ],
          },
          {
            type: 'object',
            name: 'timeline',
            label: '履历（时间线）',
            list: true,
            ui: {
              itemProps: (item) => ({
                label:
                  [item?.period, item?.title].filter(Boolean).join(' ') || '履历条目',
              }),
            },
            fields: [
              {
                type: 'string',
                name: 'period',
                label: '时间段',
                description: '例如 2024 — 2026。',
              },
              { type: 'string', name: 'title', label: '标题', required: true },
              { type: 'string', name: 'place', label: '学校 / 公司 / 地点' },
              {
                type: 'string',
                name: 'description',
                label: '描述',
                ui: { component: 'textarea' },
              },
              { type: 'string', name: 'tags', label: '标签', list: true },
              { type: 'boolean', name: 'current', label: '标记为「现在」' },
            ],
          },
        ],
      },
      {
        name: 'post',
        label: '博客文章',
        path: 'content/posts',
        // `format: 'mdx'` is what enables custom components inside the body.
        format: 'mdx',
        ui: {
          filename: {
            readonly: false,
            slugify: (values) =>
              `${values?.title ?? ''}`
                .trim()
                .toLowerCase()
                .replace(/[^\p{L}\p{N}]+/gu, '-')
                .replace(/^-+|-+$/g, '') || 'untitled',
          },
        },
        fields: postFields,
      },
      {
        name: 'page',
        label: '独立页面',
        path: 'content/pages',
        format: 'mdx',
        ui: {
          filename: {
            readonly: false,
            slugify: (values) =>
              `${values?.title ?? ''}`
                .trim()
                .toLowerCase()
                .replace(/[^\p{L}\p{N}]+/gu, '-')
                .replace(/^-+|-+$/g, '') || 'untitled',
          },
        },
        fields: [
          { type: 'string', name: 'title', label: '标题', isTitle: true, required: true },
          {
            type: 'datetime',
            name: 'date',
            label: '更新日期（可选）',
            description: '用于 Now / Uses 这类需要显示「最后更新」的页面。',
            ui: { dateFormat: 'YYYY-MM-DD' },
          },
          {
            type: 'rich-text',
            name: 'body',
            label: '正文',
            isBody: true,
            templates: richTextTemplates,
          },
        ],
      },
      {
        /*
         * Structured project index. One JSON document, like the homepage: a
         * personal-brand site needs the cards to stay visually consistent, not a
         * free-form page where every edit can break the layout.
         */
        name: 'project',
        label: '项目',
        path: 'content/projects',
        format: 'json',
        match: { include: 'projects' },
        ui: { allowedActions: { create: false, delete: false } },
        fields: [
          {
            type: 'string',
            name: 'intro',
            label: '页头介绍',
            ui: { component: 'textarea' },
          },
          {
            type: 'object',
            name: 'items',
            label: '项目列表',
            list: true,
            ui: {
              itemProps: (item) => ({
                label: [item?.title, item?.year].filter(Boolean).join(' · ') || '项目',
              }),
            },
            fields: [
              { type: 'string', name: 'title', label: '项目名', required: true },
              { type: 'string', name: 'year', label: '年份' },
              { type: 'string', name: 'role', label: '角色' },
              {
                type: 'string',
                name: 'summary',
                label: '一句话介绍',
                ui: { component: 'textarea' },
              },
              { type: 'string', name: 'stack', label: '技术栈', list: true },
              { type: 'image', name: 'image', label: '截图 / 封面' },
              { type: 'string', name: 'link', label: '在线地址' },
              { type: 'string', name: 'repo', label: '代码仓库' },
              { type: 'boolean', name: 'featured', label: '精选项目' },
            ],
          },
        ],
      },
      {
        /*
         * A short-note stream. One JSON document with a list, because notes are
         * short and do not need their own URLs; the page renders them inline.
         */
        name: 'note',
        label: '笔记 / 短记',
        path: 'content/notes',
        format: 'json',
        match: { include: 'notes' },
        ui: { allowedActions: { create: false, delete: false } },
        fields: [
          {
            type: 'string',
            name: 'intro',
            label: '页头介绍',
            ui: { component: 'textarea' },
          },
          {
            type: 'object',
            name: 'items',
            label: '笔记列表',
            list: true,
            ui: {
              itemProps: (item) => ({
                label:
                  [item?.date?.slice(0, 10), item?.title].filter(Boolean).join(' · ') || '笔记',
              }),
            },
            fields: [
              {
                type: 'datetime',
                name: 'date',
                label: '日期',
                required: true,
                ui: { dateFormat: 'YYYY-MM-DD' },
              },
              { type: 'string', name: 'title', label: '标题（可选）' },
              {
                type: 'rich-text',
                name: 'body',
                label: '正文',
                templates: richTextTemplates,
              },
              { type: 'string', name: 'tags', label: '标签', list: true },
            ],
          },
        ],
      },
      {
        /*
         * Reading list is structured data, not prose: status, rating and notes are
         * the fields that make the page useful.
         */
        name: 'reading',
        label: '阅读',
        path: 'content/reading',
        format: 'json',
        match: { include: 'reading' },
        ui: { allowedActions: { create: false, delete: false } },
        fields: [
          {
            type: 'string',
            name: 'intro',
            label: '页头介绍',
            ui: { component: 'textarea' },
          },
          {
            type: 'object',
            name: 'books',
            label: '书单',
            list: true,
            ui: {
              itemProps: (item) => ({
                label: [item?.title, item?.author].filter(Boolean).join(' · ') || '书',
              }),
            },
            fields: [
              { type: 'string', name: 'title', label: '书名', required: true },
              { type: 'string', name: 'author', label: '作者' },
              {
                type: 'string',
                name: 'status',
                label: '状态',
                options: ['reading', 'finished', 'wishlist'],
              },
              { type: 'number', name: 'rating', label: '评分（0–5）' },
              {
                type: 'string',
                name: 'note',
                label: '短评',
                ui: { component: 'textarea' },
              },
              { type: 'image', name: 'cover', label: '封面' },
              { type: 'string', name: 'link', label: '链接' },
            ],
          },
        ],
      },
    ],
  },
});
