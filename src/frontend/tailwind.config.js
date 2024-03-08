/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        '42': '#292D39',
        '42-selected': '#3e4559',
        'background': '#1C0658',
        'color-1': '#6c757d',
        'color-2': '#F4D676',
        'color-3': '#f8f9fa',
      },
      spacing: {
        '50real': '50rem',
      }
    }
  },
  plugins: [],
}
