import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './_posts/**/*.mdx',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'Menlo', 'monospace'],
        headline: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'ui-xs': ['0.625rem', { lineHeight: '1rem', letterSpacing: '0.08em' }],
        'ui-sm': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.06em' }],
        'ui-base': ['0.75rem', { lineHeight: '1.25rem', letterSpacing: '0.02em' }],
        'ui-md': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.01em' }],
        'ui-lg': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],
        'h6': ['clamp(0.875rem, 0.8rem + 0.375vw, 1.125rem)', { lineHeight: '1.4', letterSpacing: '0.01em', fontWeight: '700' }], // Min: 14px, Max: 18px
        'h5': ['clamp(1rem, 0.95rem + 0.25vw, 1.25rem)', { lineHeight: '1.4', letterSpacing: '0.005em', fontWeight: '700' }], // Min: 16px, Max: 20px
        'h4': ['clamp(1.125rem, 1.05rem + 0.375vw, 1.5rem)', { lineHeight: '1.35', letterSpacing: '0', fontWeight: '700' }], // Min: 18px, Max: 24px
        'h3': ['clamp(1.25rem, 1.15rem + 0.5vw, 1.75rem)', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '800' }], // Min: 20px, Max: 28px
        'h2': ['clamp(1.5rem, 1.35rem + 0.75vw, 2.25rem)', { lineHeight: '1.25', letterSpacing: '-0.02em', fontWeight: '800' }], // Min: 24px, Max: 36px
        'h1': ['clamp(1.875rem, 1.6rem + 1.375vw, 3.25rem)', { lineHeight: '1.15', letterSpacing: '-0.03em', fontWeight: '900' }], // Min: 30px, Max: 52px
        'display-sm': ['clamp(2.25rem, 1.85rem + 2vw, 4.25rem)', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '900' }], // Min: 36px, Max: 68px
        'display-md': ['clamp(2.5rem, 2.05rem + 2.25vw, 4.75rem)', { lineHeight: '1.05', letterSpacing: '-0.04em', fontWeight: '900' }], // Min: 40px, Max: 76px
        'display-lg': ['clamp(3rem, 2.4rem + 3vw, 6rem)', { lineHeight: '1.0', letterSpacing: '-0.05em', fontWeight: '900' }], // Min: 48px, Max: 96px
        'article-sm': ['clamp(0.9375rem, 0.9rem + 0.1875vw, 1.125rem)', { lineHeight: '1.75', letterSpacing: '0.01em' }], // Min: 15px, Max: 18px
        'article-base': ['clamp(1.0625rem, 1rem + 0.3125vw, 1.25rem)', { lineHeight: '1.8', letterSpacing: '0.005em' }], // Min: 17px, Max: 20px
        'article-lg': ['clamp(1.125rem, 1.05rem + 0.375vw, 1.5rem)', { lineHeight: '1.85', letterSpacing: '0' }], // Min: 18px, Max: 24px
      },
      spacing: {
        'px-component': '1rem',
        'px-section': '1.5rem',
        'px-page': '1.25rem',
        'prose-gap-sm': '0.75rem',
        'prose-gap': '1.5rem',
        'prose-gap-lg': '2.5rem',
        'prose-gap-xl': '4rem',
        'section-sm': '3rem',
        'section-md': '5rem',
        'section-lg': '7.5rem',
        'section-xl': '10rem',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg) scale(1)' },
          '15%': { transform: 'rotate(-18deg) scale(1.1)' },
          '30%': { transform: 'rotate(16deg) scale(1.1)' },
          '45%': { transform: 'rotate(-12deg) scale(1.05)' },
          '60%': { transform: 'rotate(10deg) scale(1.05)' },
          '75%': { transform: 'rotate(-6deg) scale(1.02)' },
          '90%': { transform: 'rotate(4deg) scale(1.02)' },
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        wiggle: 'wiggle 0.7s ease-in-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
} satisfies Config;
