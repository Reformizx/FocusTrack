import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, children, className = '' }: CardProps) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 ${className}`}
    >
      {title && (
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
