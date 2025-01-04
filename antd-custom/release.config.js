module.exports = {
  branches: [{ name: 'master' }, {name: 'next', prerelease: true, channel: 'next'}],

  // Only verify npm and github credentials when a release is going to be made
  // https://github.com/pmowrer/semantic-release-monorepo#reduce-expensive-network-calls-50-runtime-reduction
  verifyConditions: [],
  verifyRelease: ['@semantic-release/npm', '@semantic-release/github']
    .map(require)
    .map(x => x.verifyConditions),

  extends: ['semantic-release-monorepo'],

  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
        changelogTitle: 'Changelog',
      },
    ],
    '@semantic-release/npm',
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json', 'lib/package.json'],
        // eslint-disable-next-line no-template-curly-in-string
        message: 'Build: ${nextRelease.gitTag} [skip ci]',
      },
    ],
    [
      '@semantic-release/github',
      {
        // GH comments dont work well with semantic-release-monorepo -- too much spam
        success: [],
        fail: [],
      },
    ],
  ],
}
