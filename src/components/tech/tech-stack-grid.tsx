import type { HomeTech } from '@/lib/home';
import { TechChip } from './tech-chip';

/** The compact 3/4-per-row tech grid used on the About page. */
export function TechStackGrid({
  techStack,
  className = '',
}: {
  techStack: HomeTech[];
  className?: string;
}) {
  if (techStack.length === 0) return null;

  return (
    <ul className={`grid grid-cols-3 gap-2 sm:grid-cols-4 ${className}`}>
      {techStack.map((tech, index) => (
        <li key={`${tech.name}-${tech.icon}-${index}`} className="min-w-0">
          <TechChip tech={tech} variant="compact" />
        </li>
      ))}
    </ul>
  );
}
