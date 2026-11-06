'use client';

import { useLocaleCopy } from '@/i18n/client';

export interface ProblemMetaProps {
  review?: string | null;
  difficulty?: string | null;
}

type Difficulty = 'Easy' | 'Medium' | 'Hard';

const difficultyStyles: Record<Difficulty, string> = {
  Easy: 'border-emerald-400 bg-emerald-50 text-emerald-900 dark:border-emerald-300/70 dark:bg-emerald-500/15 dark:text-emerald-100',
  Medium:
    'border-amber-400 bg-amber-50 text-amber-950 dark:border-amber-300/70 dark:bg-amber-500/15 dark:text-amber-100',
  Hard: 'border-rose-400 bg-rose-50 text-rose-950 dark:border-rose-300/70 dark:bg-rose-500/15 dark:text-rose-100',
};

function normalizeDifficulty(value?: string | null): Difficulty | string {
  const normalized = (value ?? '').trim().toLowerCase();
  if (normalized === 'easy' || normalized === 'eazy') return 'Easy';
  if (normalized === 'medium') return 'Medium';
  if (normalized === 'hard') return 'Hard';
  return value?.trim() || '—';
}

/**
 * The “one-line review + difficulty” card at the top of a daily-problem post.
 * It is intentionally small: it should frame the article, not compete with the
 * problem statement.
 */
export function ProblemMeta({ review, difficulty }: ProblemMetaProps) {
  const { copy } = useLocaleCopy();
  const level = normalizeDifficulty(difficulty);
  const badgeClass =
    difficultyStyles[level as Difficulty] ??
    'border-ink/20 bg-ink/5 text-ink dark:border-chalk/20 dark:bg-white/5 dark:text-slate-200';

  return (
    <aside className="not-prose my-8 grid gap-5 rounded-2xl border-2 border-ink/15 bg-paper/85 p-5 shadow-brutal-sm backdrop-blur-sm dark:border-chalk/20 dark:bg-midnight/80 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
      <div className="min-w-0">
        <p className="font-mono text-[0.68rem] font-black tracking-[0.18em] text-ink/45 uppercase dark:text-slate-400">
          {copy.problemReview}
        </p>
        <p className="mt-2 text-base leading-relaxed font-semibold text-ink dark:text-slate-100">
          {review?.trim() || '—'}
        </p>
      </div>

      <div className="flex items-center gap-2 sm:flex-col sm:items-end">
        <span className="font-mono text-[0.68rem] font-bold tracking-[0.14em] text-ink/45 uppercase dark:text-slate-400">
          {copy.problemDifficulty}
        </span>
        <span
          className={`inline-flex items-center rounded-full border-2 px-3 py-1 text-xs font-black tracking-wide shadow-brutal-xs ${badgeClass}`}
        >
          {level}
        </span>
      </div>
    </aside>
  );
}
