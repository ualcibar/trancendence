/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        '42': '#292D39',
        '42-selected': '#3e4559'
      },
    }
  },
  plugins: [],
}
