import type { RoutineBlock } from '../types';
import { mutedTextClassName } from '../utils/styles';

interface DayTimelineProps {
  blocks: RoutineBlock[];
  completedBlockIds: Set<string>;
  onToggle?: (block: RoutineBlock, completed: boolean) => void;
  readOnly?: boolean;
}

export function DayTimeline({
  blocks,
  completedBlockIds,
  onToggle,
  readOnly = false,
}: DayTimelineProps) {
  if (blocks.length === 0) {
    return (
      <p className={mutedTextClassName}>Nenhum bloco agendado para hoje.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {blocks.map((block) => {
        const isCompleted = completedBlockIds.has(block.id);
        return (
          <li
            key={block.id}
            className={`rounded-lg border p-4 transition-colors ${
              isCompleted
                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900'
            }`}
          >
            <div className="flex gap-3">
              {!readOnly && onToggle ? (
                <input
                  type="checkbox"
                  checked={isCompleted}
                  onChange={(e) => onToggle(block, e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600"
                  aria-label={`Marcar "${block.topic}" como concluído`}
                />
              ) : (
                <span
                  className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                    isCompleted
                      ? 'border-green-500 bg-green-500'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                  aria-hidden
                >
                  {isCompleted && (
                    <span className="block h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                  {block.startTime}
                  {block.endTime ? ` – ${block.endTime}` : ''}
                </p>
                <p
                  className={`font-medium ${
                    isCompleted
                      ? 'text-slate-500 line-through dark:text-slate-400'
                      : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {block.topic}
                </p>
                {block.linkedGoalTitle && (
                  <span className="mt-1 inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
                    Meta: {block.linkedGoalTitle}
                  </span>
                )}
                {block.description && (
                  <p className={`mt-1 ${mutedTextClassName}`}>{block.description}</p>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
