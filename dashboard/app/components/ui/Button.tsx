import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'transparent';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  children?: ReactNode;
  tooltip?: string;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  tooltip,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'flex items-center justify-center rounded-lg transition-colors relative group shadow-sm whitespace-nowrap';
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover',
    secondary: 'bg-white text-primary hover:bg-gray-100 border border-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    transparent: 'bg-transparent text-gray-700 hover:bg-gray-100',
  } as const;

  const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {icon}
      {children}
      {tooltip && (
        <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-0.5 rounded bg-black/90 text-white text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition whitespace-nowrap">
          {tooltip}
        </span>
      )}
    </button>
  );
} 