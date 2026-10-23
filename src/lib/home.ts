import { cache } from 'react';
import { client } from '@/lib/tina';

/**
 * The single homepage document, read from `content/home/home.json`.
 *
 * Everything here is normalised before it reaches a component. The document is
 * editable content, so a field can be missing, the wrong type, or (after a
 * background switch) empty. Components should never have to defend themselves
 * against half-written content: they receive plain strings, clamped numbers and
 * clean arrays.
 *
 * The normalised shape is also deliberately FLAT and free of Tina metadata
 * (`relativePath`, `_sys`, query variables). Client components receive these
 * values as props, and `check:runtime` fails the build if those names reach a
 * client bundle.
 */

export type HomeBackgroundKind = 'gradient' | 'image' | 'video';

export type HomeBackground = {
  kind: HomeBackgroundKind;
  image: string | null;
  video: string | null;
  poster: string | null;
  /** 0–100. Higher means a darker/washed-out media layer, for legibility. */
  dim: number;
  /** 0–40 px blur applied to the media layer. */
  blur: number;
};

export type HomeFact = {
  label: string;
  value: string;
};

export type HomeSocialKind = 'github' | 'email' | 'x' | 'bilibili' | 'rss' | 'link';

export type HomeSocial = {
  label: string;
  url: string;
  kind: HomeSocialKind;
};

export type HomeTech = {
  name: string;
  /** One of `src/lib/tech.ts`'s icon keys; empty/unknown falls back to a monogram. */
  icon: string;
};

const SOCIAL_KINDS: HomeSocialKind[] = [
  'github',
  'email',
  'x',
  'bilibili',
  'rss',
  'link',
];

function socialKind(value: unknown, url: string): HomeSocialKind {
  if (typeof value === 'string' && SOCIAL_KINDS.includes(value as HomeSocialKind)) {
    return value as HomeSocialKind;
  }
  if (/^mailto:/i.test(url)) return 'email';
  if (/github\.com/i.test(url)) return 'github';
  if (/(?:^|\.)(?:x\.com|twitter\.com)/i.test(url)) return 'x';
  if (/bilibili\.com/i.test(url)) return 'bilibili';
  if (/rss|feed/i.test(url)) return 'rss';
  return 'link';
}

export type HomeProfile = {
  avatar: string | null;
  name: string;
  school: string;
  bio: string;
  facts: HomeFact[];
};

export type HomeTimelineEntry = {
  period: string;
  title: string;
  place: string;
  description: string;
  tags: string[];
  current: boolean;
};

export type HomeContent = {
  siteName: string;
  tagline: string;
  scrollHint: string;
  background: HomeBackground;
  profile: HomeProfile;
  socials: HomeSocial[];
  techStack: HomeTech[];
  timeline: HomeTimelineEntry[];
};

/** Relative to the `home` collection's path (`content/home`). */
export const HOME_RELATIVE_PATH = 'home.json';

/**
 * Used when the document is missing or the query fails, and as the fallback for
 * every optional field. This must stay in sync with `content/home/home.json` —
 * the file is the source of truth; this is the safety net.
 */
export const DEFAULT_HOME: HomeContent = {
  siteName: '我的博客',
  tagline: '把好奇写下来，把复杂讲清楚。',
  scrollHint: '向下滚动，认识我',
  background: {
    kind: 'gradient',
    image: null,
    video: null,
    poster: null,
    dim: 52,
    blur: 20,
  },
  profile: {
    avatar: '/uploads/avatar.svg',
    name: '你的名字',
    school: '你的学校',
    bio: '你好，我是这里的作者。这里记录技术笔记、阅读和正在做的事——把学过的东西讲清楚，也把没想明白的问题留在这里。',
    facts: [
      { label: '专业', value: '计算机科学与技术' },
      { label: '方向', value: '前端工程 · 可视化' },
      { label: '坐标', value: '你的城市' },
      { label: '邮箱', value: 'hello@example.com' },
    ],
  },
  socials: [
    { label: 'GitHub', url: 'https://github.com/yourname', kind: 'github' },
    { label: 'Email', url: 'mailto:hello@example.com', kind: 'email' },
  ],
  techStack: [
    { name: 'Python', icon: 'python' },
    { name: 'React', icon: 'react' },
    { name: 'PHP', icon: 'php' },
    { name: 'TypeScript', icon: 'typescript' },
    { name: 'Next.js', icon: 'nextdotjs' },
    { name: 'Tailwind CSS', icon: 'tailwindcss' },
    { name: 'Node.js', icon: 'nodedotjs' },
    { name: 'D3.js', icon: 'd3' },
    { name: 'Figma', icon: 'figma' },
    { name: 'Git', icon: 'git' },
    { name: 'Docker', icon: 'docker' },
    { name: 'MySQL', icon: 'mysql' },
  ],
  timeline: [
    {
      period: '2026 — 现在',
      title: '开始认真写这个博客',
      place: '个人项目 · 这个站点',
      description:
        '用 Next.js 与 TinaCMS 搭起自己的角落：记录技术笔记、阅读和正在做的事，也逼自己把学过的东西讲清楚。',
      tags: ['Next.js', 'TinaCMS'],
      current: true,
    },
    {
      period: '2024 — 2026',
      title: '本科 · 你的专业',
      place: '你的大学',
      description: '把课程、研究方向、参与过的项目或值得一提的成果写在这里。',
      tags: ['学习', '项目'],
      current: false,
    },
    {
      period: '2022 — 2024',
      title: '高中',
      place: '你的中学',
      description: '一段经历、一个转折，或者第一次认真做成一件事。',
      tags: ['起点'],
      current: false,
    },
  ],
};

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function asOptionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item): item is string => item.length > 0);
}

function asNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function normaliseBackground(value: unknown): HomeBackground {
  const record = asRecord(value);
  const image = asOptionalText(record.image);
  const video = asOptionalText(record.video);
  const requested = asText(record.kind, DEFAULT_HOME.background.kind);

  // A switch to image/video without a URL must not leave the hero transparent:
  // fall back to the built-in flowing gradient.
  const kind: HomeBackgroundKind =
    requested === 'image' && image
      ? 'image'
      : requested === 'video' && video
        ? 'video'
        : 'gradient';

  return {
    kind,
    image,
    video,
    poster: asOptionalText(record.poster),
    dim: asNumber(record.dim, DEFAULT_HOME.background.dim, 0, 100),
    blur: asNumber(record.blur, DEFAULT_HOME.background.blur, 0, 40),
  };
}

function normaliseFacts(value: unknown): HomeFact[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const record = asRecord(item);
      return {
        label: asText(record.label),
        value: asText(record.value),
      };
    })
    .filter((fact) => fact.label.length > 0 && fact.value.length > 0);
}

function normaliseProfile(value: unknown): HomeProfile {
  const record = asRecord(value);

  return {
    avatar: asOptionalText(record.avatar) ?? DEFAULT_HOME.profile.avatar,
    name: asText(record.name, DEFAULT_HOME.profile.name),
    school: asText(record.school, DEFAULT_HOME.profile.school),
    bio: asText(record.bio, DEFAULT_HOME.profile.bio),
    // An EXPLICIT empty list is a decision ("show no extra facts"), so only a
    // missing/non-array field falls back to the defaults. `facts.length > 0`
    // would make it impossible to clear the list from the editor.
    facts: Array.isArray(record.facts) ? normaliseFacts(record.facts) : DEFAULT_HOME.profile.facts,
  };
}

function normaliseTechStack(value: unknown): HomeTech[] {
  if (!Array.isArray(value)) return DEFAULT_HOME.techStack;
  return value
    .map((item) => {
      const record = asRecord(item);
      return {
        name: asText(record.name),
        icon: asText(record.icon),
      };
    })
    .filter((tech) => tech.name.length > 0);
}

function normaliseSocials(value: unknown): HomeSocial[] {
  if (!Array.isArray(value)) return DEFAULT_HOME.socials;
  return value
    .map((item) => {
      const record = asRecord(item);
      const url = asText(record.url);
      const kind = socialKind(record.kind, url);
      return {
        label: asText(record.label, kind === 'link' ? '链接' : kind),
        url,
        kind,
      };
    })
    .filter((social) => social.url.length > 0 && /^(?:https?:|mailto:|tel:|\/)/i.test(social.url));
}

function normaliseTimeline(value: unknown): HomeTimelineEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const record = asRecord(item);
      return {
        period: asText(record.period),
        title: asText(record.title),
        place: asText(record.place),
        description: asText(record.description),
        tags: asStringList(record.tags),
        current: record.current === true,
      };
    })
    .filter((entry) => entry.title.length > 0);
}

/** Coerce whatever the editor saved into the shape the page renders. */
export function normaliseHome(value: unknown): HomeContent {
  const record = asRecord(value);

  return {
    siteName: asText(record.siteName, DEFAULT_HOME.siteName),
    tagline: asText(record.tagline, DEFAULT_HOME.tagline),
    scrollHint: asText(record.scrollHint, DEFAULT_HOME.scrollHint),
    background: normaliseBackground(record.background),
    profile: normaliseProfile(record.profile),
    socials: normaliseSocials(record.socials),
    techStack: normaliseTechStack(record.techStack),
    // Same rule as `facts`: a saved empty timeline means "no entries yet" and
    // renders the empty state; only a missing field restores the sample data.
    timeline: Array.isArray(record.timeline)
      ? normaliseTimeline(record.timeline)
      : DEFAULT_HOME.timeline,
  };
}

/**
 * Read the homepage document.
 *
 * `cache()` dedupes the call between the root layout (site name + metadata) and
 * the page itself within one render. A failure is logged and degrades to the
 * defaults rather than taking the whole page down — the rest of the site still
 * works if the homepage document is temporarily unavailable.
 */
export const getHomeContent = cache(async (): Promise<HomeContent> => {
  try {
    const { data } = await client.queries.home({ relativePath: HOME_RELATIVE_PATH });
    return normaliseHome(data?.home);
  } catch (error) {
    console.error('Failed to load the homepage document:', error);
    return DEFAULT_HOME;
  }
});
