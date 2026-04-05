import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string;
  label?: string;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, error, label, fullWidth = true, ...props }, ref) => {
    return (
      <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
        {label && <label className="text-sm font-black text-black dark:text-white tracking-tight">{label}</label>}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 text-stone-400 dark:text-stone-500 pointer-events-none flex items-center justify-center">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 text-sm font-bold text-black dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:border-black dark:focus:border-white focus:bg-white dark:focus:bg-black transition-all duration-200 shadow-sm hover:border-stone-300 dark:hover:border-stone-700",
              icon && "pl-11",
              error && "border-rose-500 focus:border-rose-500 hover:border-rose-500 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400",
              className
            )}
            {...props}
          />
        </div>
        {error && <span className="text-xs font-bold text-rose-500 ml-1">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string, label?: string }>(
  ({ className, error, label, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && <label className="text-sm font-black text-black dark:text-white tracking-tight">{label}</label>}
        <textarea
          ref={ref}
          className={cn(
            "w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 text-sm font-bold text-black dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:border-black dark:focus:border-white focus:bg-white dark:focus:bg-black transition-all duration-200 shadow-sm hover:border-stone-300 dark:hover:border-stone-700 disabled:opacity-50",
            error && "border-rose-500 focus:border-rose-500 hover:border-rose-500 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400",
            className
          )}
          {...props}
        />
        {error && <span className="text-xs font-bold text-rose-500 ml-1">{error}</span>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
