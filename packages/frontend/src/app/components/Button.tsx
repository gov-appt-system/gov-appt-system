import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  children, 
  disabled,
  ...props 
}: ButtonProps) {
  const baseStyles = 'rounded-lg transition-all duration-200 inline-flex items-center justify-center gap-2';
  
  const variants = {
    primary: 'bg-[var(--gov-primary)] text-white hover:opacity-90 disabled:opacity-50',
    secondary: 'bg-[var(--gov-secondary)] text-white hover:opacity-90 disabled:opacity-50',
    outline: 'border-2 border-[var(--gov-primary)] text-[var(--gov-primary)] hover:bg-[var(--gov-primary)] hover:text-white disabled:opacity-50',
    destructive: 'bg-[var(--gov-alert)] text-white hover:opacity-90 disabled:opacity-50'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
