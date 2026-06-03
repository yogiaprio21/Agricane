import React, { ReactNode, useEffect, useRef } from 'react';
import { usePageMeta } from '../../hooks/usePageMeta';

export * from './BrandLogo';
export * from './Skeleton';

export const Button: React.FC<{
  children: ReactNode;
  onClick?: (e?: React.FormEvent) => void | Promise<void>;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  disabled?: boolean;
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled,
  isLoading,
  fullWidth,
  leftIcon,
  rightIcon,
  className = '',
  size = 'md',
}) => {
  const baseClass = 'inline-flex min-h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={`${baseClass} ${sizeClasses[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {isLoading ? <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};

export const IconButton: React.FC<{
  label: string;
  children: ReactNode;
  onClick?: () => void | Promise<void>;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  className?: string;
}> = ({ label, children, onClick, type = 'button', variant = 'ghost', disabled, className = '' }) => {
  const variants = {
    primary: 'text-primary-700 hover:bg-primary-50 focus:ring-primary-500',
    secondary: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    danger: 'text-red-600 hover:bg-red-50 focus:ring-red-500',
    ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-500',
  };

  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: ReactNode; className?: string; title?: string }> = ({
  children,
  className = '',
  title,
}) => (
  <div className={`rounded-lg border border-gray-200 bg-white p-5 shadow-sm ${className}`}>
    {title && <h3 className="mb-4 text-base font-semibold text-gray-950 sm:text-lg">{title}</h3>}
    {children}
  </div>
);

export const SectionPanel: React.FC<{
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}> = ({ title, subtitle, actions, children, className = '' }) => (
  <section className={`border-t border-gray-200 pt-5 ${className}`}>
    {(title || subtitle || actions) && (
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {title && <h2 className="text-base font-semibold text-gray-950 sm:text-lg">{title}</h2>}
          {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">{actions}</div>}
      </div>
    )}
    {children}
  </section>
);

export const MetricStrip: React.FC<{
  items: Array<{
    label: string;
    value: ReactNode;
    description?: ReactNode;
    icon?: ReactNode;
    tone?: 'green' | 'blue' | 'yellow' | 'red' | 'gray';
  }>;
  className?: string;
}> = ({ items, className = '' }) => {
  const tones = {
    green: 'border-green-500 bg-green-50 text-green-700',
    blue: 'border-blue-500 bg-blue-50 text-blue-700',
    yellow: 'border-yellow-500 bg-yellow-50 text-yellow-700',
    red: 'border-red-500 bg-red-50 text-red-700',
    gray: 'border-gray-400 bg-gray-50 text-gray-700',
  };

  return (
    <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 ${className}`}>
      {items.map((item) => {
        const tone = tones[item.tone || 'gray'];
        return (
          <div key={item.label} className={`rounded-md border-l-4 bg-white px-4 py-3 shadow-sm ${tone.split(' ')[0]}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase text-gray-500">{item.label}</p>
                <p className="mt-1 truncate text-2xl font-bold leading-tight text-gray-950">{item.value}</p>
                {item.description && <p className="mt-1 text-sm text-gray-600">{item.description}</p>}
              </div>
              {item.icon && <div className={`shrink-0 rounded-md p-2 ${tone.replace(tone.split(' ')[0], '')}`}>{item.icon}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const DataList: React.FC<{
  items: Array<{
    id: string;
    title: ReactNode;
    subtitle?: ReactNode;
    meta?: ReactNode;
    badge?: ReactNode;
    actions?: ReactNode;
  }>;
  emptyState?: ReactNode;
  className?: string;
}> = ({ items, emptyState, className = '' }) => {
  if (items.length === 0) {
    return <>{emptyState || null}</>;
  }

  return (
    <div className={`divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white ${className}`}>
      {items.map((item) => (
        <div key={item.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-gray-950">{item.title}</p>
              {item.badge}
            </div>
            {item.subtitle && <p className="mt-1 text-sm text-gray-600">{item.subtitle}</p>}
            {item.meta && <div className="mt-2 text-xs text-gray-500">{item.meta}</div>}
          </div>
          {item.actions && <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">{item.actions}</div>}
        </div>
      ))}
    </div>
  );
};

export const InfoGrid: React.FC<{
  items: Array<{ label: string; value: ReactNode; helper?: ReactNode }>;
  className?: string;
}> = ({ items, className = '' }) => (
  <dl className={`grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
    {items.map((item) => (
      <div key={item.label} className="rounded-md border border-gray-200 bg-white px-4 py-3">
        <dt className="text-xs font-semibold uppercase text-gray-500">{item.label}</dt>
        <dd className="mt-1 font-semibold text-gray-950">{item.value}</dd>
        {item.helper && <dd className="mt-1 text-sm text-gray-600">{item.helper}</dd>}
      </div>
    ))}
  </dl>
);

export const StatCard: React.FC<{
  label: string;
  value: ReactNode;
  description?: string;
  icon?: ReactNode;
  tone?: 'green' | 'blue' | 'yellow' | 'red' | 'gray';
}> = ({ label, value, description, icon, tone = 'green' }) => {
  const tones = {
    green: 'border-green-600 bg-green-50 text-green-700',
    blue: 'border-blue-600 bg-blue-50 text-blue-700',
    yellow: 'border-yellow-600 bg-yellow-50 text-yellow-700',
    red: 'border-red-600 bg-red-50 text-red-700',
    gray: 'border-gray-500 bg-gray-50 text-gray-700',
  };

  return (
    <Card className={`border-l-4 py-4 ${tones[tone].split(' ')[0]}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="mt-1 text-2xl font-bold leading-tight text-gray-950 sm:text-3xl">{value}</p>
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
        {icon && <div className={`shrink-0 rounded-lg p-2.5 ${tones[tone].replace(tones[tone].split(' ')[0], '')}`}>{icon}</div>}
      </div>
    </Card>
  );
};

export const SourceBadge: React.FC<{
  sourceType?: 'LIVE' | 'CACHE' | 'FALLBACK' | 'SIMULATED' | string;
  provider?: string;
}> = ({ sourceType = 'UNKNOWN', provider }) => {
  const variants: Record<string, string> = {
    LIVE: 'bg-green-100 text-green-800',
    CACHE: 'bg-blue-100 text-blue-800',
    FALLBACK: 'bg-yellow-100 text-yellow-800',
    HISTORY: 'bg-gray-100 text-gray-800',
    SIMULATED: 'bg-gray-100 text-gray-800',
    UNKNOWN: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${variants[sourceType] || variants.UNKNOWN}`}>
      {sourceType}
      {provider ? <span className="ml-1 text-gray-500">· {provider}</span> : null}
    </span>
  );
};

export const DataToolbar: React.FC<{
  children: ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`mb-4 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-end sm:justify-between ${className}`}>
    {children}
  </div>
);

export const ActionToolbar: React.FC<{
  filters: ReactNode;
  actions?: ReactNode;
  status?: ReactNode;
  className?: string;
}> = ({ filters, actions, status, className = '' }) => (
  <div className={`mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${className}`}>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] sm:items-end">
        {filters}
      </div>
      {(actions || status) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between lg:justify-end">
          {actions && <div className="grid grid-cols-1 gap-3 sm:flex sm:min-h-10 sm:items-center">{actions}</div>}
          {status && <div className="flex min-h-10 items-center sm:justify-end">{status}</div>}
        </div>
      )}
    </div>
  </div>
);

export const PageControlBar: React.FC<{
  filters: ReactNode;
  actions?: ReactNode;
  status?: ReactNode;
  className?: string;
}> = ({ filters, actions, status, className = '' }) => (
  <div className={`mb-5 rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${className}`}>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[repeat(auto-fit,minmax(13rem,1fr))] md:items-end">
        {filters}
      </div>
      {(actions || status) && (
        <div className="flex flex-col gap-3 md:flex-row md:items-end lg:justify-end">
          {actions && (
            <div className="grid grid-cols-1 gap-2 sm:grid-flow-col sm:auto-cols-max sm:items-center">
              {actions}
            </div>
          )}
          {status && <div className="flex min-h-9 items-center md:justify-end">{status}</div>}
        </div>
      )}
    </div>
  </div>
);

export const FilterPanel: React.FC<{
  children: ReactNode;
  className?: string;
  columnsClassName?: string;
}> = ({ children, className = '', columnsClassName = 'md:grid-cols-[repeat(auto-fit,minmax(14rem,1fr))]' }) => (
  <section className={`mb-5 rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${className}`}>
    <div className={`grid grid-cols-1 gap-3 ${columnsClassName} md:items-end`}>
      {children}
    </div>
  </section>
);

export const ChartCard: React.FC<{
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}> = ({ title, subtitle, actions, children, className = '' }) => (
  <Card className={className}>
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-gray-950 sm:text-lg">{title}</h3>
        {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
    <div className="min-h-[280px] w-full overflow-x-auto overflow-y-visible pb-1">
      <div className="min-w-0">{children}</div>
    </div>
  </Card>
);

export const ChartEmptyState: React.FC<{
  title?: string;
  description?: string;
}> = ({ title = 'No chart data yet', description = 'Generate or fetch data to populate this chart.' }) => (
  <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 text-center">
    <div>
      <p className="font-semibold text-gray-900">{title}</p>
      <p className="mt-1 text-sm text-gray-600">{description}</p>
    </div>
  </div>
);

export const PaginationControls: React.FC<{
  page: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}> = ({ page, totalPages, totalItems, pageSize, onPageChange, className = '' }) => {
  const safeTotalPages = Math.max(totalPages || 1, 1);
  const canPrevious = page > 1;
  const canNext = page < safeTotalPages;
  const start = totalItems && pageSize ? (page - 1) * pageSize + 1 : null;
  const end = totalItems && pageSize ? Math.min(page * pageSize, totalItems) : null;

  return (
    <div className={`mt-4 flex flex-col gap-3 border-t border-gray-200 pt-4 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <span>
        {totalItems && start && end
          ? `Showing ${start}-${end} of ${totalItems}`
          : `Page ${page} of ${safeTotalPages}`}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={!canPrevious} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <span className="rounded-md bg-gray-100 px-3 py-1 font-medium text-gray-800">
          {page} / {safeTotalPages}
        </span>
        <Button variant="outline" size="sm" disabled={!canNext} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
};

export interface ResponsiveTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

export function ResponsiveTable<T extends { id?: string } | Record<string, unknown>>({
  rows,
  columns,
  getRowKey,
  emptyState,
}: {
  rows: T[];
  columns: ResponsiveTableColumn<T>[];
  getRowKey?: (row: T, index: number) => string;
  emptyState?: ReactNode;
}) {
  if (rows.length === 0) {
    return <>{emptyState || null}</>;
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={`px-4 py-3 text-left text-sm font-medium text-gray-700 ${column.className || ''}`}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.map((row, index) => (
              <tr key={getRowKey?.(row, index) || String((row as any).id || index)} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column.key} className={`px-4 py-3 text-sm text-gray-700 ${column.className || ''}`}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 md:hidden">
        {rows.map((row, index) => (
          <div key={getRowKey?.(row, index) || String((row as any).id || index)} className="rounded-lg border border-gray-200 bg-white p-4">
            {columns.map((column) => (
              <div key={column.key} className="flex justify-between gap-4 py-2 text-sm first:pt-0 last:pb-0">
                <span className="font-medium text-gray-600">{column.header}</span>
                <span className="text-right text-gray-900">{column.render(row)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

export const Input: React.FC<{
  id?: string;
  label?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  step?: string;
  min?: string | number;
  max?: string | number;
  error?: string;
  helperText?: string;
}> = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  disabled,
  className = '',
  step,
  min,
  max,
  error,
  helperText,
}) => (
  <div className={`mb-4 ${className}`}>
    {label && (
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    )}
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      step={step}
      min={min}
      max={max}
      aria-invalid={!!error}
      aria-describedby={error || helperText ? `${id || label}-help` : undefined}
      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 disabled:bg-gray-100 ${
        error
          ? 'border-red-300 focus:ring-red-500'
          : 'border-gray-300 focus:ring-primary-500'
      }`}
    />
    {(error || helperText) && (
      <p id={`${id || label}-help`} className={`mt-1 text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
        {error || helperText}
      </p>
    )}
  </div>
);

export const Select: React.FC<{
  id?: string;
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
  helperText?: string;
}> = ({ id, label, value, onChange, options, required, disabled, className = '', error, helperText }) => (
  <div className={`mb-4 ${className}`}>
    {label && (
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
    )}
    <select
      id={id}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      aria-invalid={!!error}
      aria-describedby={error || helperText ? `${id || label}-help` : undefined}
      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 disabled:bg-gray-100 ${
        error
          ? 'border-red-300 focus:ring-red-500'
          : 'border-gray-300 focus:ring-primary-500'
      }`}
    >
      <option value="">Select...</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {(error || helperText) && (
      <p id={`${id || label}-help`} className={`mt-1 text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
        {error || helperText}
      </p>
    )}
  </div>
);

export const Badge: React.FC<{
  children: ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}> = ({ children, variant = 'info', className = '' }) => {
  const variants = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className={`${sizes[size]} border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin`} />
    </div>
  );
};

export const Alert: React.FC<{
  type: 'success' | 'error' | 'warning' | 'info';
  children: ReactNode;
  onClose?: () => void;
}> = ({ type, children, onClose }) => {
  const types = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
  };

  return (
    <div className={`p-4 rounded-lg border ${types[type]} mb-4 flex justify-between items-start`}>
      <div>{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close alert"
          className="ml-4 text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      )}
    </div>
  );
};

export const PageHeader: React.FC<{
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}> = ({ title, description, actions, className = '' }) => {
  usePageMeta(title, description);

  return (
    <div className={`mb-6 flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-start sm:justify-between ${className}`}>
      <div className="min-w-0">
        <h1 className="text-2xl font-bold leading-tight text-gray-950 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-600 sm:text-base">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div>}
    </div>
  );
};

export const EmptyState: React.FC<{
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}> = ({ title, description, icon, action }) => (
  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
    {icon && <div className="mb-4 flex justify-center text-gray-400">{icon}</div>}
    <h3 className="text-base font-semibold text-gray-900">{title}</h3>
    {description && <p className="mx-auto mt-2 max-w-xl text-sm text-gray-600">{description}</p>}
    {action && <div className="mt-5 flex justify-center">{action}</div>}
  </div>
);

export const ErrorState: React.FC<{
  title: string;
  description?: string;
  action?: ReactNode;
}> = ({ title, description, action }) => (
  <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-8 text-center">
    <h3 className="text-base font-semibold text-red-900">{title}</h3>
    {description && <p className="mx-auto mt-2 max-w-xl text-sm text-red-700">{description}</p>}
    {action && <div className="mt-5 flex justify-center">{action}</div>}
  </div>
);

export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}> = ({ isOpen, onClose, title, children, footer }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement;
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector);
    focusable?.[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;

      const elements = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (element) => !element.hasAttribute('disabled'),
      );
      if (elements.length === 0) return;

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1200] overflow-y-auto">
      <div className="flex min-h-screen items-start justify-center px-4 py-8 sm:items-center">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="relative z-[1210] max-h-[calc(100vh-4rem)] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 id="modal-title" className="text-xl font-semibold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          <div className="mb-4">{children}</div>
          {footer && <div className="flex justify-end gap-2">{footer}</div>}
        </div>
      </div>
    </div>
  );
};

export const ConfirmDialog: React.FC<{
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  isLoading,
  onConfirm,
  onClose,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    footer={
      <>
        <Button variant="secondary" onClick={onClose} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} disabled={isLoading}>
          {isLoading ? 'Processing...' : confirmLabel}
        </Button>
      </>
    }
  >
    <p className="text-sm text-gray-700">{description}</p>
  </Modal>
);
