import { GridStreaks } from '@/components/home/grid-streaks';

/**
 * The blueprint sheet that continues behind the résumé and the three exit
 * branches, all the way into the footer's top margin.
 *
 * The outer field is absolutely positioned (so it never takes layout height)
 * and stretches five rem past the world bottom, exactly the footer's top
 * margin. The inner sheet is sticky on desktop with motion, so the grid stays
 * steady while the timeline is pinned and then keeps going behind the exit
 * cards; on phones and with reduced motion it simply fills the world instead.
 */
export function BlueprintField() {
  return (
    <div
      aria-hidden
      className="blueprint-field pointer-events-none absolute inset-x-0 top-0 -bottom-20 z-0"
    >
      <div className="blueprint-field-inner">
        <div className="relative mx-auto h-full w-full max-w-7xl">
          <div className="blueprint-grid absolute inset-0" />
          <GridStreaks active />
        </div>
      </div>
    </div>
  );
}
