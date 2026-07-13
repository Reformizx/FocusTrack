export const selectClassName =
  'block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100';

export const labelClassName = 'block text-sm font-medium text-slate-700 dark:text-slate-300';

export const alertErrorClassName =
  'rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300';

export const alertSuccessClassName =
  'rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300';

export const pageTitleClassName = 'text-2xl font-bold text-slate-900 dark:text-slate-100';

export const pageSubtitleClassName = 'text-sm text-slate-600 dark:text-slate-400';

export const mutedTextClassName = 'text-sm text-slate-600 dark:text-slate-400';

export function tabClass(active: boolean): string {
  return active
    ? 'rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors dark:bg-indigo-500'
    : 'rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700';
}
