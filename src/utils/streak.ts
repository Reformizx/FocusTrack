import type { Relapse } from '../types';
import { toDateString } from './date';

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function calculateGoalStreak(
  goalId: string,
  goalCreatedAt: Date,
  relapses: Relapse[],
): number {
  const relapseDates = new Set(
    relapses
      .filter((r) => r.goalId === goalId)
      .map((r) => toDateString(r.createdAt)),
  );

  const today = startOfDay(new Date());
  const goalStart = startOfDay(goalCreatedAt);

  if (relapseDates.has(toDateString(today))) {
    return 0;
  }

  let streak = 0;
  const current = new Date(today);

  while (current >= goalStart) {
    if (relapseDates.has(toDateString(current))) {
      break;
    }
    streak++;
    current.setDate(current.getDate() - 1);
  }

  return streak;
}

export function formatStreak(days: number): string {
  if (days === 0) return '0 dias';
  if (days === 1) return '1 dia';
  return `${days} dias`;
}
