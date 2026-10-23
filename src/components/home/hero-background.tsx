import Image from 'next/image';
import { isUrlAllowedForOptimizer } from '@/lib/image-hosts';
import type { HomeBackground } from '@/lib/home';

/**
 * The optional media layer behind the whole homepage.
 *
 * Default (`kind: 'gradient'`) renders nothing at all, so the site-wide
 * `<Backdrop />` shows through unchanged. Choosing an image or a video replaces
 * only the colour fields, not the design system: the media is softened with the
 * editor's blur, flattened with a paper/midnight wash, and then covered by the
 * same vertical "reading band" the backdrop uses — otherwise prose would sit on
 * whatever brightness the photo happens to have.
 *
 * The layer is `absolute`, not `fixed`, on purpose. It lives inside
 * `<PageTransition>`, whose Framer wrapper can keep a transform after a route
 * change; a transformed ancestor turns `position: fixed` into "relative to the
 * wrapper". Spanning the page with `inset-0` gives the same full-page backdrop
 * without depending on that behaviour.
 *
 * Remote images use the optimizer only when the host is in the shared allowlist
 * (see `src/lib/image-hosts.ts`); otherwise they fall back to a plain <img>,
 * exactly like <Figure>. A video URL must be root-relative or http(s) — a
 * `javascript:` src is dropped rather than rendered.
 */
export function HeroBackground({ background }: { background: HomeBackground }) {
  if (background.kind === 'gradient') return null;

  const mediaUrl = safeMediaUrl(
    background.kind === 'image' ? background.image : background.video
  );
  if (!mediaUrl) return null;

  const style = {
    filter: background.blur > 0 ? `blur(${background.blur}px)` : undefined,
    transform: background.kind === 'image' ? 'scale(1.06)' : 'scale(1.04)',
  };

  const media =
    background.kind === 'image' ? (
      <ImageLayer src={mediaUrl} style={style} />
    ) : (
      <video
        aria-hidden
        tabIndex={-1}
        className="absolute inset-0 h-full w-full object-cover"
        style={style}
        src={mediaUrl}
        poster={safeMediaUrl(background.poster) ?? undefined}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
    );

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden print:hidden"
    >
      {media}

      {/* Overall dim: the editor controls the strength, so white text on a
          bright photo never has to be guessed at build time. */}
      <div
        className="absolute inset-0 bg-paper dark:bg-midnight"
        style={{ opacity: background.dim / 100 }}
      />

      {/* Same central reading band as <Backdrop />, so long body copy keeps a
          stable background no matter which part of the media is behind it. */}
      <div className="absolute inset-y-0 left-1/2 w-[min(100vw,64rem)] -translate-x-1/2 bg-[linear-gradient(to_right,transparent_0%,rgba(247,244,238,0.55)_18%,rgba(247,244,238,0.72)_40%,rgba(247,244,238,0.72)_60%,rgba(247,244,238,0.55)_82%,transparent_100%)] dark:bg-[linear-gradient(to_right,transparent_0%,rgba(6,10,18,0.58)_18%,rgba(6,10,18,0.8)_40%,rgba(6,10,18,0.8)_60%,rgba(6,10,18,0.58)_82%,transparent_100%)]" />

      {/* Top/bottom vignette so the media dissolves into the page. */}
      <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-paper via-paper/50 to-transparent dark:from-midnight dark:via-midnight/50" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-paper via-paper/50 to-transparent dark:from-midnight dark:via-midnight/50" />
    </div>
  );
}

function ImageLayer({ src, style }: { src: string; style: React.CSSProperties }) {
  const remote = /^https?:\/\//.test(src);

  let optimizerAllowed = false;
  if (remote) {
    try {
      optimizerAllowed = isUrlAllowedForOptimizer(new URL(src));
    } catch {
      optimizerAllowed = false;
    }
    if (!optimizerAllowed && process.env.NODE_ENV !== 'production') {
      console.warn(
        `[HeroBackground] Remote image host is not in ALLOWED_IMAGE_HOSTS, so the hero ` +
          `background is rendered as a plain <img> (no optimization). src="${src}"`
      );
    }
  }

  if (remote && optimizerAllowed) {
    return (
      <Image
        src={src}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
        style={style}
      />
    );
  }

  return (
    // Local files in public/ never need the optimizer; a plain image also keeps
    // an unlisted remote host working instead of silently breaking.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className="absolute inset-0 h-full w-full object-cover"
      style={style}
    />
  );
}

/**
 * Only root-relative paths and http(s) URLs are accepted.
 *
 * This is content from the editor, so `javascript:` (or a `data:` URL that
 * embeds a document) must never reach `src`. Returning null falls the hero back
 * to the built-in gradient.
 */
function safeMediaUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const url = value.trim();
  if (!url) return null;

  if (url.startsWith('/') && !url.startsWith('//')) return url;

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? url : null;
  } catch {
    return null;
  }
}
