import { colors, borderRadius, shadows, spacing } from '../theme';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated';
}

export function Card({ children, className = '', variant = 'default' }: CardProps) {
  const baseStyles: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    border: `1px solid ${colors.neutral[200]}`,
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    default: {},
    elevated: { boxShadow: shadows.md },
  };

  return (
    <div style={{ ...baseStyles, ...variantStyles[variant] }} className={className}>
      {children}
    </div>
  );
}