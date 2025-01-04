module.exports = {
  roots: ['<rootDir>/tests'],
  testSequencer: '<rootDir>/tests/sequencer.js',
  testMatch: ['**/*.test.{js,ts}'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
}
