// postcss.config.js
module.exports = {
  plugins: [
    require('postcss-import'),
    require('postcss-nested'),
    require('tailwindcss'),
    require('autoprefixer'),
  ]
}