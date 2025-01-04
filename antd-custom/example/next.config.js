const withLess = require('next-with-less')
const { antdOverrides } = require('@narratorai/theme')

module.exports = withLess({
  lessLoaderOptions: {
    lessOptions: {
      modifyVars: antdOverrides,
    },
  },
})
