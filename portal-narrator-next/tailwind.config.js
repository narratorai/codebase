/** @type {import('tailwindcss').Config} */
// TODO: Once the transition complete transition is made,
// this file will be rest to the default theme.
// We already removed some of the overrides.
import colors from 'tailwindcss/colors'

module.exports = {
  content: [
    './src/app/**/*.{ts,tsx,mdx}',
    './src/components/**/*.{ts,tsx,mdx}',
    './src/components/**/*.stories.{ts,tsx,mdx}',
  ],
  theme: {
    fontFamily: {
      sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'],
    },
    data: {
      // For @radix-ui/react-switch
      checked: 'state~="checked"',
      unchecked: 'state~="unchecked"',

      // For @radix-ui/react-select
      placeholder: 'placeholder',
    },
    extend: {
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      borderRadius: {
        xl: '0.625rem',
      },
      boxShadow: {
        focus: '0px 0px 0px 2px #FFF, 0px 0px 0px 4px #375DFB',
        'focus-red': '0px 0px 0px 2px #FFF, 0px 0px 0px 4px #DF1C41',
      },
      colors: {
        current: 'currentColor',
        transparent: 'transparent',
        'pink-purple': {
          100: '#FBF4FE',
          200: '#F8E8FD',
          300: '#F0CDFC',
          400: '#E8AFFA',
          500: '#E08BF9',
          600: '#D759F7',
          700: '#C050DD',
          800: '#A745BF',
          900: '#88389C',
          1000: '#60286E',
        },
        gray: {
          ...colors.gray,
          1000: '#000000',
        },
      },
    },
  },
  plugins: [
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@tailwindcss/forms'),
    ({ addUtilities }) => {
      addUtilities({
        '.bordered-gray-50': {
          '@apply border box-border border-gray-50': {},
        },
        '.bordered-gray-100': {
          '@apply border box-border border-gray-100': {},
        },
        '.bordered-gray-200': {
          '@apply border box-border border-gray-200': {},
        },
        '.bordered-b-gray-200': {
          '@apply border-b box-border border-gray-200': {},
        },
        '.bordered-transparent': {
          '@apply border box-border border-transparent': {},
        },
        '.sticky-top-0': {
          '@apply sticky top-0 z-10': {},
        },
        '.flex-x': {
          '@apply flex flex-row': {},
        },
        '.flex-x-center': {
          '@apply flex flex-row items-center': {},
        },
        '.flex-x-start': {
          '@apply flex flex-row items-start': {},
        },
        '.flex-y': {
          '@apply flex flex-col h-full': {},
        },
        '.flex-y-center': {
          '@apply flex flex-col h-full items-center': {},
        },
        '.absolute-middle': {
          '@apply absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2': {},
        },
        '.absolute-left': {
          '@apply bottom-0 left-0 top-0': {},
        },
      })
    },
  ],
  darkMode: 'selector',
}
