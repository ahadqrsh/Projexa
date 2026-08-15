const withAlpha = (variable) => `rgb(var(${variable}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: withAlpha('--primary-50'),
          400: withAlpha('--primary-400'),
          500: withAlpha('--primary-500'),
          600: withAlpha('--primary-600'),
          700: withAlpha('--primary-700'),
        },
        accent: {
          400: withAlpha('--accent-400'),
          500: withAlpha('--accent-500'),
          600: withAlpha('--accent-600'),
        },
        cyber: {
          400: withAlpha('--cyber-400'),
          500: withAlpha('--cyber-500'),
        },
        success: withAlpha('--success'),
        warning: withAlpha('--warning'),
        danger: withAlpha('--danger'),
        info: withAlpha('--info'),
        base: withAlpha('--bg-base'),
        surface: withAlpha('--bg-surface'),
        elevated: withAlpha('--bg-elevated'),
        subtle: withAlpha('--border-subtle'),
        strong: withAlpha('--border-strong'),
        content: {
          primary: withAlpha('--text-primary'),
          secondary: withAlpha('--text-secondary'),
          muted: withAlpha('--text-muted'),
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: { sm: '6px', md: '10px', lg: '14px', xl: '20px', '2xl': '28px' },
      boxShadow: {
        glow: '0 0 32px -6px rgb(var(--primary-500) / 0.55)',
        'glow-lg': '0 0 60px -10px rgb(var(--accent-500) / 0.6)',
        card: '0 4px 24px -8px rgb(0 0 0 / 0.35)',
        lifted: '0 18px 50px -18px rgb(0 0 0 / 0.55)',
      },
      backgroundImage: {
        'grid-fade':
          'linear-gradient(to bottom, transparent, rgb(var(--bg-base))), radial-gradient(circle at 50% 0%, rgb(var(--primary-500) / 0.18), transparent 60%)',
        aurora:
          'conic-gradient(from 180deg at 50% 50%, rgb(var(--primary-500)), rgb(var(--accent-500)), rgb(var(--cyber-500)), rgb(var(--primary-500)))',
      },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'pulse-soft': { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.55' } },
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
        'border-flow': { to: { '--angle': '360deg' } },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
        float: 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
        'spin-slow': 'spin-slow 14s linear infinite',
      },
      transitionTimingFunction: { smooth: 'cubic-bezier(0.4, 0, 0.2, 1)' },
    },
  },
  plugins: [],
};
