import { ImageResponse } from 'next/og';
import { siteUrl } from '@/lib/site';

export const alt = 'Personal blog — notes, projects and reading';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Default share card for pages that do not have a cover.
 *
 * The card uses the Latin hostname rather than the Chinese site name because
 * `next/og` ships a Latin-only default font; a page/cover that wants the full
 * Chinese title can provide its own image. The shapes and palette are the same
 * ones used across the site, so the card still reads as this blog.
 */
export default async function Image() {
  const host = new URL(siteUrl()).hostname;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: '#f7f4ec',
          color: '#0b1221',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              border: '4px solid #0b1221',
              background: 'linear-gradient(135deg,#ffd166,#ff8b7b 48%,#6d5cff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                background: '#0b1221',
                transform: 'rotate(45deg)',
                borderRadius: 4,
              }}
            />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '0.16em' }}>
            PERSONAL BLOG
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 76, fontWeight: 900, letterSpacing: '-0.03em' }}>{host}</div>
          <div style={{ fontSize: 28, fontWeight: 700, opacity: 0.62 }}>
            Notes on code, design &amp; the things in between.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 22, height: 22, borderRadius: 999, border: '4px solid #0b1221', background: '#ffd166' }} />
            <div style={{ width: 22, height: 22, borderRadius: 6, border: '4px solid #0b1221', background: '#ff8b7b' }} />
            <div style={{ width: 22, height: 22, borderRadius: 999, border: '4px solid #0b1221', background: '#5eead4' }} />
            <div style={{ width: 22, height: 22, borderRadius: 6, border: '4px solid #0b1221', background: '#6d5cff' }} />
          </div>
          <div
            style={{
              width: 360,
              height: 10,
              borderRadius: 999,
              background: 'linear-gradient(90deg,#6d5cff,#ff8b7b,#ffd166)',
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
