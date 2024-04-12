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
        'background': '#1b1145',
        'button-col': '#8749bc',
        'color-1': '#6c757d',
        'color-2': '#F4D676',
        'color-3': '#f8f9fa',
        'card-bg-color': '#12064680',
      },
      spacing: {
        '50real': '50rem',
      }
    }
  },
  plugins: [require("daisyui")],
}
