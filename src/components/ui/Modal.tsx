'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = ''
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // إغلاق المودال عند الضغط على Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // التركيز على المودال عند فتحه
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl'
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      {/* خلفية شفافة مع تأثير الضبابية */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={handleOverlayClick}
      />
      
      {/* محتوى المودال */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`
          relative bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden
          animate-scale-in transform-gpu will-change-transform
          ${sizeClasses[size]} w-full mx-4
          ${className}
        `}
        role="dialog"
        aria-labelledby="modal-title"
        aria-modal="true"
      >
        {/* شريط العنوان */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <h2 
            id="modal-title"
            className="text-xl font-bold text-white animate-slide-in-right"
          >
            {title}
          </h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-all duration-200 text-white hover:scale-110 transform"
              aria-label="إغلاق"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* محتوى المودال */}
        <div className="max-h-[calc(90vh-80px)] overflow-y-auto">
          <div className="p-6 animate-slide-in-up text-gray-900">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
