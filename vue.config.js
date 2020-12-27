module.exports = {
  devServer: {
    proxy: {
      '/scrobbles': {
        target: 'http://localhost:8000/',
      },
    },
  },
}
