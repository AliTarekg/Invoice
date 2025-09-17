'use client';

import React, { forwardRef } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outline';
  loading?: boolean;
  showPasswordToggle?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  icon,
  iconPosition = 'left',
  size = 'md',
  variant = 'default',
  loading = false,
  showPasswordToggle = false,
  className = '',
  type: originalType = 'text',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [type, setType] = React.useState(originalType);

  React.useEffect(() => {
    if (showPasswordToggle && originalType === 'password') {
      setType(showPassword ? 'text' : 'password');
    }
  }, [showPassword, showPasswordToggle, originalType]);

  const baseClasses = `
    w-full transition-all duration-200 transform-gpu
    focus:outline-none focus:ring-2 focus:ring-offset-1
    disabled:opacity-50 disabled:cursor-not-allowed
    placeholder:text-gray-400
  `;

  const variantClasses = {
    default: `
      border border-gray-300 bg-white hover:border-gray-400
      focus:border-blue-500 focus:ring-blue-500/20
    `,
    filled: `
      border-0 bg-gray-100 hover:bg-gray-200
      focus:bg-white focus:ring-blue-500/20
    `,
    outline: `
      border-2 border-gray-300 bg-transparent hover:border-gray-400
      focus:border-blue-500 focus:ring-blue-500/20
    `
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm rounded-lg',
    md: 'px-4 py-2.5 text-base rounded-xl',
    lg: 'px-5 py-3 text-lg rounded-xl'
  };

  const errorClasses = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : '';

  const inputClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${errorClasses}
    ${icon ? (iconPosition === 'left' ? 'pr-4 pl-12' : 'pl-4 pr-12') : ''}
    ${showPasswordToggle ? 'pr-12' : ''}
    ${className}
  `;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2 animate-slide-in-right">
          {label}
          {props.required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className={`
            absolute inset-y-0 ${iconPosition === 'left' ? 'left-0 pl-3' : 'right-0 pr-3'} 
            flex items-center pointer-events-none text-gray-400
          `}>
            {icon}
          </div>
        )}
        
        <input
          ref={ref}
          type={type}
          className={inputClasses}
          {...props}
        />
        
        {showPasswordToggle && originalType === 'password' && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
        
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-2 flex items-center text-red-600 text-sm animate-slide-in-up">
          <AlertCircle size={16} className="mr-1 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-500 animate-slide-in-up">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
