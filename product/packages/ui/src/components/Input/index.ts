import { forwardRef } from 'react';
import { colors, borderRadius, spacing, typography } from '../theme';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', style, ...props }, ref) => {
    const inputStyles: React.CSSProperties = {
      width: '100%',
      padding: `${spacing.sm} ${spacing.md}`,
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.sans,
      border: `1px solid ${error ? colors.error : colors.neutral[300]}`,
      borderRadius: borderRadius.md,
      outline: 'none',
      transition: 'border-color 0.2s ease',
      ...style,
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
        {label && (
          <label style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium }}>
            {label}
          </label>
        )}
        <input ref={ref} style={inputStyles} className={className} {...props} />
        {error && <span style={{ color: colors.error, fontSize: typography.fontSize.sm }}>{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';