/**
 * @type {import('semantic-release').GlobalConfig}
 */
module.exports = {
  extends: 'semantic-release-monorepo',
  branches: ['production', { name: 'main', prerelease: 'next' }],
  plugins: [
    ['@semantic-release/commit-analyzer', { preset: 'conventionalcommits' }],
    ['@semantic-release/release-notes-generator', { preset: 'conventionalcommits' }],
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
        changelogTitle: 'Changelog',
      },
    ],
    [
      'semantic-release-yarn',
      {
        npmPublish: true,
        tarballDir: 'dist',
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json', 'packages/*/*/package.json', 'lerna.json'],
        message: 'build: ${nextRelease.gitTag} [skip ci]',
      },
    ],
    [
      '@semantic-release/github',
      {
        success: [],
        fail: [],
        publish: true,
        assets: 'dist/*.tgz',
      },
    ],
  ],
}
