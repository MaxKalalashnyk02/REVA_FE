import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
}

export function SelectSmall({ label, className = '', children, ...props }: SelectProps) {
  return (
    <label className="flex flex-col text-slate-400 text-sm font-medium w-full">
      {label}
      <div className="relative mt-1">
        <select
          {...props}
          className={`appearance-none w-full pl-3 pr-9 py-2 bg-slate-800 border border-slate-600 rounded-md
            text-slate-200 text-sm truncate cursor-pointer hover:border-slate-500
            focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors ${className}`}
        >
          {children}
        </select>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
    </label>
  );
}
