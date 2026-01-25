import React from 'react';

// ============================================
// BUTTON COMPONENT
// ============================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    children: React.ReactNode;
}

export function Button({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    className = '',
    disabled,
    children,
    ...props
}: ButtonProps) {
    const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
        primary: 'bg-primary text-primary-foreground hover:opacity-90 focus:ring-primary',
        secondary: 'bg-muted text-foreground hover:bg-muted/80 focus:ring-muted',
        ghost: 'bg-transparent hover:bg-muted text-foreground focus:ring-muted',
        danger: 'bg-danger text-danger-foreground hover:opacity-90 focus:ring-danger',
        outline: 'border border-border bg-transparent hover:bg-muted text-foreground focus:ring-primary'
    };

    const sizeClasses = {
        sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
        md: 'h-10 px-4 text-sm rounded-lg gap-2',
        lg: 'h-12 px-6 text-base rounded-xl gap-2.5'
    };

    return (
        <button
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            )}
            {children}
        </button>
    );
}

// ============================================
// CARD COMPONENT
// ============================================

interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
    const paddingClasses = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8'
    };

    return (
        <div className={`bg-card text-card-foreground border border-border rounded-xl shadow-sm ${paddingClasses[padding]} ${className}`}>
            {children}
        </div>
    );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`pb-4 border-b border-border mb-4 ${className}`}>
            {children}
        </div>
    );
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <h3 className={`text-lg font-bold text-foreground ${className}`}>
            {children}
        </h3>
    );
}

export function CardDescription({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <p className={`text-sm text-muted-foreground mt-1 ${className}`}>
            {children}
        </p>
    );
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`pt-4 border-t border-border mt-4 flex items-center gap-3 ${className}`}>
            {children}
        </div>
    );
}

// ============================================
// INPUT COMPONENT
// ============================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
}

export function Input({ label, error, hint, className = '', id, ...props }: InputProps) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="space-y-1.5">
            {label && (
                <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
                    {label}
                </label>
            )}
            <input
                id={inputId}
                className={`
                    w-full h-10 px-3 text-sm bg-background border rounded-lg
                    transition-colors duration-200
                    placeholder:text-muted-foreground
                    focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${error ? 'border-danger focus:ring-danger' : 'border-input hover:border-muted-foreground'}
                    ${className}
                `}
                {...props}
            />
            {hint && !error && (
                <p className="text-xs text-muted-foreground">{hint}</p>
            )}
            {error && (
                <p className="text-xs text-danger">{error}</p>
            )}
        </div>
    );
}

// ============================================
// SELECT COMPONENT
// ============================================

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
}

export function Select({ label, error, options, className = '', id, ...props }: SelectProps) {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="space-y-1.5">
            {label && (
                <label htmlFor={selectId} className="block text-sm font-medium text-foreground">
                    {label}
                </label>
            )}
            <select
                id={selectId}
                className={`
                    w-full h-10 px-3 text-sm bg-background border rounded-lg
                    transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${error ? 'border-danger focus:ring-danger' : 'border-input hover:border-muted-foreground'}
                    ${className}
                `}
                {...props}
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            {error && (
                <p className="text-xs text-danger">{error}</p>
            )}
        </div>
    );
}

// ============================================
// BADGE COMPONENT
// ============================================

interface BadgeProps {
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    children: React.ReactNode;
    className?: string;
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
    const variantClasses = {
        default: 'bg-muted text-muted-foreground',
        success: 'bg-success/10 text-success border-success/20',
        warning: 'bg-warning/10 text-warning border-warning/20',
        danger: 'bg-danger/10 text-danger border-danger/20',
        info: 'bg-info/10 text-info border-info/20'
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full border ${variantClasses[variant]} ${className}`}>
            {children}
        </span>
    );
}

// ============================================
// SKELETON COMPONENT
// ============================================

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div className={`animate-pulse bg-muted rounded ${className}`} />
    );
}
