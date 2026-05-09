import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas:        '#09090E',
        surface:       '#111117',
        'surface-2':   '#18181F',
        border:        '#26263A',
        'border-muted':'#1C1C28',
        accent:        '#E8A930',
        'accent-dim':  '#C48C20',
        'accent-fg':   '#09090E',
        success:       '#3DD68C',
        warning:       '#F0A030',
        danger:        '#FF5555',
        'text-primary':   '#EDE8D8',
        'text-secondary': '#9490A8',
        'text-muted':     '#58566A',
      },
      fontFamily: {
        sans:  ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono:  ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      animation: {
        'fade-in':    'fadeIn 0.25s ease-out',
        'slide-up':   'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-left': 'slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-dot': 'bounceDot 1.2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:   { '0%': { opacity: '0' },                                              '100%': { opacity: '1' } },
        slideUp:  { '0%': { opacity: '0', transform: 'translateY(10px)' },               '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideInLeft: { '0%': { opacity: '0', transform: 'translateX(-12px)' },           '100%': { opacity: '1', transform: 'translateX(0)' } },
        bounceDot:{ '0%, 80%, 100%': { transform: 'translateY(0)' },                    '40%': { transform: 'translateY(-5px)' } },
      },
    },
  },
  plugins: [],
};

export default config;
