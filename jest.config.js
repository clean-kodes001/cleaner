module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    '^.+\\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp)$':
      'react-native/jest/assetFileTransformer.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-redux|@reduxjs)/)',
  ],
  moduleNameMapper: {
    '^@react-native-vector-icons/.*$': '<rootDir>/__mocks__/vectorIconsMock.js',
    '^react-native-swiper-flatlist$': '<rootDir>/__mocks__/swiperFlatListMock.js',
    '^react-native-toast-message$': '<rootDir>/__mocks__/toastMessageMock.js',
  },
};
