/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        leaf: {
          50:  '#f1faf3',
          100: '#dcf3e1',
          200: '#bae6c4',
          300: '#8bd29e',
          500: '#2fb15a',
          600: '#1f9247',
          700: '#167339',
          900: '#0c4723'
        },
        sun: {
          500: '#f5b301',
          600: '#d79a00'
        },
        ink: {
          900: '#0d1b12'
        }
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'Georgia', 'serif']
      }
    }
  },
  plugins: []
};