import type { Config } from 'tailwindcss';

function optionalTailwindPlugin(name: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(name);
  } catch {
    return () => ({});
  }
}

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    '../../packages/shared/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        vs: {
          canvas: 'rgb(var(--vs-canvas) / <alpha-value>)',
          surface: 'rgb(var(--vs-surface) / <alpha-value>)',
          elevated: 'rgb(var(--vs-elevated) / <alpha-value>)',
          muted: 'rgb(var(--vs-muted) / <alpha-value>)',
          text: {
            primary: 'rgb(var(--vs-text-primary) / <alpha-value>)',
            secondary: 'rgb(var(--vs-text-secondary) / <alpha-value>)',
            muted: 'rgb(var(--vs-text-muted) / <alpha-value>)',
            inverse: 'rgb(var(--vs-text-inverse) / <alpha-value>)',
          },
          border: {
            DEFAULT: 'rgb(var(--vs-border-default) / <alpha-value>)',
            strong: 'rgb(var(--vs-border-strong) / <alpha-value>)',
            subtle: 'rgb(var(--vs-border-subtle) / <alpha-value>)',
            inverse: 'rgb(var(--vs-border-inverse) / <alpha-value>)',
          },
          accent: {
            primary: 'rgb(var(--vs-accent-primary) / <alpha-value>)',
            pressed: 'rgb(var(--vs-accent-pressed) / <alpha-value>)',
            secondary: 'rgb(var(--vs-accent-secondary) / <alpha-value>)',
            secondaryPressed: 'rgb(var(--vs-accent-secondary-pressed) / <alpha-value>)',
          },
          hero: {
            primary: 'rgb(var(--vs-hero-primary) / <alpha-value>)',
            secondary: 'rgb(var(--vs-hero-secondary) / <alpha-value>)',
            contrast: 'rgb(var(--vs-hero-contrast) / <alpha-value>)',
          },
          success: 'rgb(var(--vs-success) / <alpha-value>)',
          warning: 'rgb(var(--vs-warning) / <alpha-value>)',
          danger: 'rgb(var(--vs-danger) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['var(--vs-font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--vs-font-display)', 'system-ui', 'sans-serif'],
        mono: ['var(--vs-font-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'vs-sm': 'var(--vs-shadow-sm)',
        'vs-md': 'var(--vs-shadow-md)',
        'vs-lg': 'var(--vs-shadow-lg)',
      },
      borderRadius: {
        'vs-sm': '10px',
        'vs-md': '14px',
        'vs-lg': '18px',
      },
      backgroundImage: {
        'vs-hero': 'var(--vs-gradient-hero)',
        'vs-mesh': 'var(--vs-gradient-mesh)',
      },
      transitionDuration: {
        80: '80ms',
        140: '140ms',
        220: '220ms',
        320: '320ms',
      },
    },
  },
  plugins: [optionalTailwindPlugin('tailwindcss-animate')],
} satisfies Config;
