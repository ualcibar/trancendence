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
        'base': '#1C0658',
        'a': '#6c757d',
        'b': '#F4D676',
        'c': '#f8f9fa',
      },
      spacing: {
        '50real': '50rem',
      }
    }
  },
  plugins: [],
}
