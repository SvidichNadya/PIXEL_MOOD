import React from 'react';
import clsx from 'clsx';

const Spinner = ({
  size = 'md',
  color = 'accent-blue',
  className = '',
  label = 'Загрузка...',
  showLabel = true,
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3 border-2',
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  };

  const colorClasses = {
    'accent-blue': 'border-accent-blue border-t-transparent',
    'accent-purple': 'border-accent-purple border-t-transparent',
    white: 'border-white border-t-transparent',
    'text-primary': 'border-text-primary border-t-transparent',
  };

  return (
    <div className={clsx('flex flex-col items-center justify-center', className)}>
      <div
        className={clsx(
          'rounded-full animate-spin',
          sizeClasses[size] || sizeClasses.md,
          colorClasses[color] || colorClasses['accent-blue']
        )}
        role="status"
        aria-label={label}
      />
      {showLabel && (
        <span className="mt-3 text-sm text-text-secondary">{label}</span>
      )}
    </div>
  );
};

// Спиннер для загрузки страницы (полноэкранный)
export const FullPageSpinner = ({ label = 'Загрузка...' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Spinner size="lg" label={label} />
    </div>
  );
};

// Спиннер для кнопок (маленький, инлайн)
export const ButtonSpinner = ({ size = 'sm' }) => {
  return (
    <span className="inline-block">
      <Spinner size={size} showLabel={false} className="inline-flex" />
    </span>
  );
};

export default Spinner;