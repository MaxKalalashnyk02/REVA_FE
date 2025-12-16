import type { ReactNode } from 'react';

interface SectionProps {
  title: string;
  children: ReactNode;
}

export function Section({ title, children }: SectionProps) {
  return (
    <div className="mb-5 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
      <h2 className="text-slate-200 text-lg font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}

