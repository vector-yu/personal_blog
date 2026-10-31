import { BlueprintBranches, type BranchCard } from '@/components/home/blueprint-branches';
import { BlueprintField } from '@/components/home/blueprint-field';
import { BlueprintTimeline } from '@/components/home/blueprint-timeline';
import type { HomeTimelineEntry } from '@/lib/home';

/**
 * The homepage résumé world.
 *
 * One grid field runs behind the pinned timeline and the three exit branches,
 * continuing into the footer's top margin. The branch cards replace the old
 * "read the writing" pill: About / Start here / Notes.
 */
export function TimelineSection({
  entries,
  emptyText,
  presentLabel,
  labels,
  branches,
}: {
  entries: HomeTimelineEntry[];
  emptyText: string;
  presentLabel: string;
  labels: {
    eyebrow: string;
    title: string;
    hint: string;
    end: string;
  };
  branches: {
    eyebrow: string;
    title: string;
    hint: string;
    open: string;
    cards: BranchCard[];
  };
}) {
  return (
    <div className="blueprint-world relative">
      <BlueprintField />

      <BlueprintTimeline
        entries={entries}
        emptyText={emptyText}
        presentLabel={presentLabel}
        labels={labels}
      />

      <BlueprintBranches cards={branches.cards} labels={branches} />
    </div>
  );
}
