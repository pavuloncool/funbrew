import { forwardRef } from 'react';
import { colors, borderRadius, typography } from '../theme';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', ...props }, ref) => {
    const baseStyles: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: typography.fontWeight.medium,
      borderRadius: borderRadius.lg,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      border: 'none',
      fontFamily: typography.fontFamily.sans,
    };

    const sizeStyles: Record<string, React.CSSProperties> = {
      sm: { padding: '0.5rem 1rem', fontSize: typography.fontSize.sm },
      md: { padding: '0.75rem 1.5rem', fontSize: typography.fontSize.base },
      lg: { padding: '1rem 2rem', fontSize: typography.fontSize.lg },
    };

    const variantStyles: Record<string, React.CSSProperties> = {
      primary: { backgroundColor: colors.primary[600], color: 'white' },
      secondary: { backgroundColor: colors.neutral[100], color: colors.neutral[900] },
      outline: { backgroundColor: 'transparent', border: `1px solid ${colors.neutral[300]}`, color: colors.neutral[900] },
      ghost: { backgroundColor: 'transparent', color: colors.neutral[700] },
    };

    return (
      <button
        ref={ref}
        style={{ ...baseStyles, ...sizeStyles[size], ...variantStyles[variant] }}
        className={className}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';