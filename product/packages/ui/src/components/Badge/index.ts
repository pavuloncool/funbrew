import { colors, borderRadius, spacing, typography } from '../theme';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const variantColors: Record<string, string> = {
    default: colors.neutral[100],
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,
  };

  const styles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${spacing.xs} ${spacing.sm}`,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    borderRadius: borderRadius.full,
    backgroundColor: variantColors[variant],
    color: variant === 'default' ? colors.neutral[700] : 'white',
  };

  return <span style={styles}>{children}</span>;
}