module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      files: [
        'jest.setup.js',
        '**/__tests__/**/*.[jt]s?(x)',
        '**/?(*.)+(spec|test).[jt]s?(x)',
      ],
      env: {
        jest: true,
      },
    },
  ],
};
