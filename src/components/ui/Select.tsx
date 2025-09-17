'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  searchable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outline';
  className?: string;
  required?: boolean;
}

const Select: React.FC<SelectProps> = ({
  label,
  placeholder = 'اختر من القائمة...',
  options,
  value,
  onChange,
  error,
  disabled = false,
  searchable = false,
  size = 'md',
  variant = 'default',
  className = '',
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(option => option.value === value);

  const filteredOptions = searchable
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (option: Option) => {
    if (!option.disabled) {
      onChange(option.value);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const baseClasses = `
    relative w-full cursor-pointer transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-1
    disabled:opacity-50 disabled:cursor-not-allowed
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

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2 animate-slide-in-right">
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}

      <div ref={selectRef} className="relative">
        <div
          className={`
            ${baseClasses}
            ${variantClasses[variant]}
            ${sizeClasses[size]}
            ${errorClasses}
            ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
            flex items-center justify-between
          `}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <div className="flex items-center flex-1">
            {selectedOption?.icon && (
              <span className="mr-2 flex-shrink-0">{selectedOption.icon}</span>
            )}
            <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-hidden animate-scale-in">
            {searchable && (
              <div className="p-3 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="البحث..."
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
            )}

            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`
                      px-4 py-3 cursor-pointer transition-colors duration-150
                      flex items-center justify-between
                      ${option.disabled
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-900 hover:bg-blue-50'
                      }
                      ${value === option.value ? 'bg-blue-100 text-blue-900' : ''}
                    `}
                    onClick={() => handleSelect(option)}
                  >
                    <div className="flex items-center">
                      {option.icon && (
                        <span className="mr-2 flex-shrink-0">{option.icon}</span>
                      )}
                      <span>{option.label}</span>
                    </div>
                    {value === option.value && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-gray-500 text-center">
                  لا توجد نتائج
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 animate-slide-in-up">
          {error}
        </p>
      )}
    </div>
  );
};

export default Select;
