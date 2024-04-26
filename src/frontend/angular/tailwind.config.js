/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      brightness: {
        25: '.25',
      },
      colors: {
        '42': '#292D39',
        '42-selected': '#3e4559',
        'background': '#1b1145',
        'button-col': '#8749bc',
        'color-1': '#6c757d',
        'color-2': '#F4D676',
        'color-3': '#f8f9fa',
        'card-bg-color': '#12064680',
        'sp-text': '#cfe1e6',
      },
      spacing: {
        '50real': '50rem',
      },
      backgroundImage: theme => ({
        'gradient-id-default': 'linear-gradient(to right, rgb(138 151 168), rgb(71 85 105))',
        'gradient-id-rojo': 'linear-gradient(to right, rgb(236 71 71), #7f1d1d)',
        'gradient-id-naranja': 'linear-gradient(to right, rgb(234 88 12), rgb(106 37 14))',
        'gradient-id-ambar': 'linear-gradient(to right, rgb(245 158 11), rgb(120 53 15))',
        'gradient-id-lima': 'linear-gradient(to right, rgb(101 163 13), rgb(54 83 20))',
        'gradient-id-pino': 'linear-gradient(to right, rgb(22 163 74), rgb(22 101 52))',
        'gradient-id-purpura': 'linear-gradient(to right, rgb(99 102 241), #312e81)',
      })
    }
  },
  plugins: [require("daisyui")],
}
