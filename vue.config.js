module.exports = {
  publicPath: '.',
  devServer: {
    proxy: {
      '/scrobbles': {
        target: 'http://localhost:8000/',
      },
    },
  },
}
