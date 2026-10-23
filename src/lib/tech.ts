/**
 * Tech-stack catalogue.
 *
 * The CMS stores only `{ name, icon }`. `icon` is one of the keys below; the
 * matching SVG lives in `public/tech/<key>.svg` (downloaded from Simple Icons,
 * CC0). The chip uses the SVG as an alpha mask and paints it with the brand
 * colours here, so the same files work in light and dark themes.
 *
 * An unknown/empty icon is not an error: the chip falls back to a monogram.
 * Adding a new brand later means dropping its SVG into `public/tech` and adding
 * an entry here (and to the select options in `tina/config.ts`).
 */
const CATALOG = {
  python: { label: 'Python', light: '#3776AB', dark: '#7FBBE5' },
  react: { label: 'React', light: '#087EA4', dark: '#61DAFB' },
  php: { label: 'PHP', light: '#777BB4', dark: '#B3B8E6' },
  typescript: { label: 'TypeScript', light: '#3178C6', dark: '#7CB3EF' },
  javascript: { label: 'JavaScript', light: '#A88B00', dark: '#F7DF1E' },
  nextdotjs: { label: 'Next.js', light: '#0B1221', dark: '#E9EEF8' },
  tailwindcss: { label: 'Tailwind CSS', light: '#0891B2', dark: '#67E8F9' },
  nodedotjs: { label: 'Node.js', light: '#4D8A3D', dark: '#8FD07D' },
  d3: { label: 'D3.js', light: '#D97706', dark: '#F9A03C' },
  figma: { label: 'Figma', light: '#E03A12', dark: '#FF8A65' },
  git: { label: 'Git', light: '#E0442A', dark: '#FF7A5C' },
  docker: { label: 'Docker', light: '#1D7FC4', dark: '#6AB8F7' },
  mysql: { label: 'MySQL', light: '#3B6A8F', dark: '#7FB6D9' },
  postgresql: { label: 'PostgreSQL', light: '#3457C9', dark: '#8FA8F0' },
  vite: { label: 'Vite', light: '#5A5FE0', dark: '#A5A8FF' },
} as const;

export type TechIconKey = keyof typeof CATALOG;

export type TechCatalogEntry = (typeof CATALOG)[TechIconKey];

export const TECH_CATALOG = CATALOG;

export const TECH_OPTIONS = (Object.keys(CATALOG) as TechIconKey[]).map((value) => ({
  value,
  label: CATALOG[value].label,
}));

export function techEntry(icon: string | null | undefined): TechCatalogEntry | null {
  if (!icon || !Object.prototype.hasOwnProperty.call(CATALOG, icon)) return null;
  return CATALOG[icon as TechIconKey];
}
