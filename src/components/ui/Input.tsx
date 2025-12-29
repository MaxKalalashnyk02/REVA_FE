import type { InputHTMLAttributes, KeyboardEvent } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Input({ label, className = '', type, onKeyDown, ...props }: InputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (type === 'number' && (e.key === '+' || e.key === '-')) {
      e.preventDefault();
    }
    onKeyDown?.(e);
  };

  return (
    <label className="flex flex-col text-slate-400 text-sm font-medium">
      {label}
      <input
        {...props}
        type={type}
        onKeyDown={handleKeyDown}
        className={`mt-1.5 px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-slate-200 
          placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 
          transition-colors ${className}`}
      />
    </label>
  );
}

export function InputSmall({ label, className = '', type, onKeyDown, ...props }: InputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (type === 'number' && (e.key === '+' || e.key === '-')) {
      e.preventDefault();
    }
    onKeyDown?.(e);
  };

  return (
    <label className="flex flex-col text-slate-400 text-sm font-medium w-full">
      {label}
      <input
        {...props}
        type={type}
        onKeyDown={handleKeyDown}
        className={`mt-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-slate-200 
          placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 
          transition-colors text-sm w-full ${className}`}
      />
    </label>
  );
}

