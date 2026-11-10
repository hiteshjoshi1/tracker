module.exports = {
  root: true,
  extends: [require.resolve('eslint-config-expo', { paths: ['./tools/quality'] })],
  ignorePatterns: ['node_modules/', 'android/', 'ios/', '.expo/', 'dist/', 'web-build/'],
  overrides: [
    { files: ['**/*.cjs'], env: { node: true } },
    { files: ['__tests__/**/*.ts', '__tests__/**/*.tsx'], env: { jest: true } },
  ],
};
