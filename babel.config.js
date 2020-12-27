module.exports = {
  presets: [
    // https://github.com/vuejs/jsx/issues/34#issuecomment-479816621
    ['@vue/cli-plugin-babel/preset', {
      useBuiltIns: 'entry',
      jsx: {
        injectH: false,
      },
    }],
    '@vue/babel-preset-jsx',
  ],
  plugins: [
    'babel-plugin-vue-jsx-scoped-css',
  ],
}
