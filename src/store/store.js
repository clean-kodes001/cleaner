import {configureStore} from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  createTransform,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {rootReducer} from './rootReducer';

// Live-session state that must never survive a relaunch.
//
// photoUploads holds in-flight/failed local camera URIs pointing at the OS cache directory.
// Those files can be purged between launches, so persisting the map would restore chips that
// can never be retried.
//
// livePosition/monitoring are job-site telemetry (BUG-016). A restored stale fix is worse
// than none: it could satisfy the Arrive gate, or fire the "you left the site" banner, before
// a single real fix of the session has landed.
//
// monitoringConfig is deliberately NOT stripped — it is a safe cached copy of the server's
// thresholds, refreshed on every sample response.
const stripEphemeralUserState = createTransform(
  inboundState => {
    const {photoUploads, livePosition, monitoring, ...rest} = inboundState || {};
    return rest;
  },
  outboundState => ({
    ...outboundState,
    photoUploads: {},
    livePosition: null,
    monitoring: {
      awaySince: null,
      lastSampleAt: null,
      permissionState: null,
    },
  }),
  {whitelist: ['user']},
);

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  // whitelist: [],
  // IMPORTANT: 'user' slice is NOT in blacklist, so messageCount is automatically persisted
  // This means messageCount survives app restarts and is restored from AsyncStorage
  blacklist: ['notification', 'ui', 'chat', 'history', 'payment'],
  transforms: [stripEphemeralUserState],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: false,
      // serializableCheck: {
      //   ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      // },
    }),
});

export const persistor = persistStore(store);
