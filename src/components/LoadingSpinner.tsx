
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', text }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div
        className={`animate-spin rounded-full border-blue-500 border-t-transparent ${sizeClasses[size]}`}
      ></div>
      {text && <p className="text-sm text-slate-500 dark:text-slate-400">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;