'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'ghost' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-xl
    transition-all duration-200 transform-gpu will-change-transform
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    hover:scale-[1.02] active:scale-[0.98]
  `;

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700
      text-white shadow-lg hover:shadow-xl focus:ring-blue-500
    `,
    secondary: `
      bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800
      text-white shadow-lg hover:shadow-xl focus:ring-gray-500
    `,
    success: `
      bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700
      text-white shadow-lg hover:shadow-xl focus:ring-green-500
    `,
    danger: `
      bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700
      text-white shadow-lg hover:shadow-xl focus:ring-red-500
    `,
    warning: `
      bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600
      text-white shadow-lg hover:shadow-xl focus:ring-yellow-500
    `,
    info: `
      bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700
      text-white shadow-lg hover:shadow-xl focus:ring-cyan-500
    `,
    ghost: `
      text-gray-700 hover:text-gray-900 hover:bg-gray-100
      focus:ring-gray-300
    `,
    outline: `
      border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50
      focus:ring-gray-300
    `
  };

  const sizeClasses = {
    xs: 'px-3 py-1.5 text-xs',
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg',
    xl: 'px-10 py-4 text-xl'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${widthClass}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Loader2 className="animate-spin mr-2" size={size === 'xs' ? 14 : size === 'sm' ? 16 : 18} />
      )}
      
      {!loading && icon && iconPosition === 'left' && (
        <span className="mr-2">{icon}</span>
      )}
      
      <span>{children}</span>
      
      {!loading && icon && iconPosition === 'right' && (
        <span className="ml-2">{icon}</span>
      )}
    </button>
  );
};

export default Button;
