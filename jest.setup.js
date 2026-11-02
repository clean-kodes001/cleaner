jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('redux-persist', () => {
  const actual = jest.requireActual('redux-persist');

  return {
    ...actual,
    persistStore: () => ({
      purge: jest.fn(),
      flush: jest.fn(),
      pause: jest.fn(),
      persist: jest.fn(),
      subscribe: jest.fn(),
      getState: jest.fn(),
      dispatch: jest.fn(),
    }),
  };
});

jest.mock('react-native-splash-screen', () => ({
  hide: jest.fn(),
  show: jest.fn(),
}));

jest.mock('react-native-onesignal', () => ({
  OneSignal: {
    initialize: jest.fn(),
    Notifications: {
      requestPermission: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    User: {
      pushSubscription: {
        getIdAsync: jest.fn().mockResolvedValue(null),
      },
    },
  },
  LogLevel: {},
}));

jest.mock('react-native-notifications', () => ({
  Notifications: {
    postLocalNotification: jest.fn(),
  },
}));
