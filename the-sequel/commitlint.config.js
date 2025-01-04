module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Warn when body line-length is over 150
    'body-max-line-length': [1, 'always', 150],
  },
}
