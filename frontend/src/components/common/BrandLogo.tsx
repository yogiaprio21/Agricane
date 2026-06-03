import React from 'react';

export const BrandMark: React.FC<{ className?: string }> = ({ className = 'h-9 w-9' }) => (
  <svg
    className={className}
    viewBox="0 0 48 48"
    role="img"
    aria-label="AgriCane brand mark"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="48" height="48" rx="12" fill="#16a34a" />
    <path d="M14 34C17.8 24.2 25 16.8 36 12" stroke="#ecfdf5" strokeWidth="4" strokeLinecap="round" />
    <path d="M18 29C21 29.2 24.2 30.6 27 33.2" stroke="#bbf7d0" strokeWidth="3" strokeLinecap="round" />
    <path d="M22 23C25 23.2 28.3 24.5 31.4 27.2" stroke="#bbf7d0" strokeWidth="3" strokeLinecap="round" />
    <path d="M28 17.5C30.5 17.7 33 18.7 35.5 20.8" stroke="#bbf7d0" strokeWidth="3" strokeLinecap="round" />
    <path d="M12 36.5H36" stroke="#052e16" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
    <circle cx="16" cy="36.5" r="2.3" fill="#ecfdf5" />
    <circle cx="25" cy="36.5" r="2.3" fill="#ecfdf5" />
    <circle cx="34" cy="36.5" r="2.3" fill="#ecfdf5" />
  </svg>
);

export const BrandLogo: React.FC<{
  compact?: boolean;
  markClassName?: string;
  textClassName?: string;
  subtitle?: string;
}> = ({ compact = false, markClassName, textClassName = 'text-xl font-bold text-gray-900', subtitle }) => (
  <div className="flex items-center gap-3">
    <BrandMark className={markClassName || (compact ? 'h-8 w-8' : 'h-9 w-9')} />
    {!compact && (
      <div className="min-w-0">
        <span className={`block truncate ${textClassName}`}>AgriCane</span>
        {subtitle && <span className="block truncate text-sm text-gray-600">{subtitle}</span>}
      </div>
    )}
  </div>
);
