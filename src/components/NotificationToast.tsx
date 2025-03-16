'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface NotificationToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export default function NotificationToast({
  message,
  type = 'info',
  isVisible,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000,
}: NotificationToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  
  // Handle auto-close
  useEffect(() => {
    if (isVisible && autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoClose, autoCloseDelay]);
  
  // Handle close with animation
  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsExiting(false);
      onClose();
    }, 300); // Match animation duration
  };
  
  if (!isVisible) return null;
  
  // Define appearance based on type
  const bgColor = 
    type === 'success' ? 'bg-green-900' : 
    type === 'error' ? 'bg-red-900' : 
    'bg-blue-900';
  
  const borderColor = 
    type === 'success' ? 'border-green-700' : 
    type === 'error' ? 'border-red-700' : 
    'border-blue-700';
  
  const textColor = 
    type === 'success' ? 'text-green-100' : 
    type === 'error' ? 'text-red-100' : 
    'text-blue-100';
  
  const icon = 
    type === 'success' ? (
      <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ) : type === 'error' ? (
      <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ) : (
      <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  
  // Animation classes
  const animationClasses = isExiting 
    ? 'animate-fade-out' 
    : 'animate-slide-in-right';
  
  return (
    <div 
      className={`fixed top-4 right-4 z-50 shadow-lg rounded-lg ${animationClasses}`}
      style={{animationDuration: '300ms'}}
    >
      <div className={`flex items-center p-4 ${bgColor} ${borderColor} border ${textColor} rounded-lg`}>
        <div className="flex-shrink-0 mr-3">
          {icon}
        </div>
        <div className="flex-1">
          {message}
        </div>
        <button 
          onClick={handleClose}
          className="ml-4 text-gray-400 hover:text-white focus:outline-none"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
      
      {/* Progress bar for auto-close */}
      {autoClose && (
        <div className="h-1 bg-gray-700 rounded-b-lg overflow-hidden">
          <div 
            className={`h-full ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}
            style={{
              width: '100%',
              animation: `shrink ${autoCloseDelay}ms linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  );
}

// Add these animations to your global CSS
// Or add the styles here with a style tag
const styles = `
@keyframes shrink {
  from { width: 100%; }
  to { width: 0%; }
}

@keyframes slide-in-right {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

.animate-slide-in-right {
  animation: slide-in-right 300ms ease-out forwards;
}

.animate-fade-out {
  animation: fade-out 300ms ease-out forwards;
}
`; 