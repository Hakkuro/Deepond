import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth = false, children, ...props }, ref) => {
    
    const baseStyles = "inline-flex items-center justify-center font-black rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none tracking-tight";
    
    const variants = {
      primary: "bg-black text-white hover:bg-stone-800 dark:bg-white dark:text-black dark:hover:bg-stone-200 shadow-md hover:shadow-lg",
      secondary: "bg-stone-100 text-black hover:bg-stone-200 dark:bg-stone-800 dark:text-white dark:hover:bg-stone-700",
      danger: "bg-rose-500 text-white hover:bg-rose-600 shadow-md hover:shadow-lg",
      ghost: "text-stone-500 hover:bg-stone-50 hover:text-black dark:text-stone-400 dark:hover:bg-stone-900 dark:hover:text-white",
      outline: "border border-stone-200 text-black hover:bg-stone-50 dark:border-stone-700 dark:text-white dark:hover:bg-stone-800"
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2.5 text-sm",
      lg: "px-6 py-3 text-base",
      icon: "p-2"
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
