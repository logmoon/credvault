import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#E8600A',
          dark: '#C4500A',
          light: '#FF7A28',
        },
        surface: {
          window: '#141414',
          DEFAULT: '#1C1C1C',
          raised: '#252525',
          overlay: '#2E2E2E',
          hover: '#FFFFFF0D',
        },
        text: {
          primary: '#F0EFEC',
          secondary: '#A09E9A',
          muted: '#6B6966',
          inverse: '#141414',
        },
        status: {
          success: '#3A8A5C',
          warning: '#C4840A',
          error: {
            DEFAULT: '#C43030',
            muted: '#C430301A',
          },
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;
