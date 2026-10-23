/**
 * Shared section header: a numbered sticker, a title with the site's animated
 * highlighter rule, and an optional one-line description.
 *
 * The number is not decoration for its own sake — it tells the reader where they
 * are in the page's short, three-part story (01 about, 02 timeline).
 */
export function SectionHeading({
  index,
  title,
  description,
}: {
  index: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="scroll-reveal">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border-2 border-ink bg-sun text-sm font-black text-ink shadow-brutal-xs dark:border-chalk dark:shadow-chalk-xs">
          {index}
        </span>
        <h2 className="relative text-title">
          {title}
          <span
            aria-hidden
            className="absolute -bottom-1.5 left-0 block h-1.5 w-full origin-left animate-rule rounded-full bg-gradient-to-r from-iris via-blush to-sun"
          />
        </h2>
      </div>
      {description ? (
        <p className="mt-5 max-w-xl leading-relaxed text-ink/70 dark:text-slate-300">
          {description}
        </p>
      ) : null}
    </div>
  );
}
