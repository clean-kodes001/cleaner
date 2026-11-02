import React, {useCallback, useEffect, useState} from 'react';
import {initI18n} from './src/i18n/i18n';
import BlockingRequestModal from './src/components/CleanRequest/BlockingRequestModal';
import UpdateGate from './src/components/Shared/UpdateGate';
// import * as SplashScreen from 'expo-splash-screen';
import {Routes} from './src/config/routes';
import {AppState} from 'react-native';
import Toast from 'react-native-toast-message';
import {Provider, useDispatch, useSelector} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {persistor, store} from './src/store/store';
import Loading from './src/components/Shared/Loading';
import SplashScreen from 'react-native-splash-screen';
import {unAuthenticated} from './src/store/actions/onboarding/unAuthenticated';
import {setNotify} from './src/store/reducer/notificationSlice';
import {OneSignal} from 'react-native-onesignal';
import {BaseToast, ErrorToast, InfoToast} from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {logOut, setPendingRatingFromNotification} from './src/store/reducer/userSlice';
import {getClean} from './src/store/actions/dashboard/getClean';
import {Client} from './src/config/client';
import {useGlobalCleanSocket} from './src/hooks/useGlobalCleanSocket';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import ErrorBoundary from './src/components/Shared/ErrorBoundary';

// Lazy load notifications to avoid NativeEventEmitter error in bridgeless mode
const getNotifications = () => {
  try {
    return require('react-native-notifications').Notifications;
  } catch (error) {
    return null;
  }
};

const toastConfig = {
  success: props => (
    <BaseToast
      {...props}
      text2NumberOfLines={6}
      contentContainerStyle={{
        paddingVertical: 10,
        paddingHorizontal: 10,
      }}
      style={{
        borderLeftColor: '#198754',
        height: '100%',
        width: '90%',
      }}
      onPress={() => Toast.hide()}
    />
  ),

  error: props => (
    <ErrorToast
      {...props}
      text2NumberOfLines={6}
      contentContainerStyle={{
        paddingVertical: 10,
        paddingHorizontal: 10,
      }}
      style={{
        borderLeftColor: '#dc3545',
        height: '100%',
        width: '90%',
      }}
      onPress={() => Toast.hide()}
    />
  ),

  info: props => (
    <InfoToast
      {...props}
      text2NumberOfLines={6}
      contentContainerStyle={{
        paddingVertical: 10,
        paddingHorizontal: 10,
      }}
      style={{
        borderLeftColor: '#0dcaf0',
        height: '100%',
        width: '90%',
      }}
      onPress={() => Toast.hide()}
    />
  ),
};

const Pages = () => {
  const dispatch = useDispatch();
  const {pending, user, profilePending} = useSelector(state => state.user);
  const {pending: uiPending} = useSelector(state => state.ui);
  const pendingProfile = useSelector(state => state.profile.pending);
  const {notify} = useSelector(state => state.notification);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');

        if (token) {
          // console.log(token);
        } else {
          dispatch(logOut());
        }
      } catch (error) {}
    })();
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      unAuthenticated(() => {
        SplashScreen.hide();
      }),
    );

    // Remove this method to stop OneSignal Debugging
    // OneSignal.Debug.setLogLevel(LogLevel.Verbose);
    // OneSignal.Debug.setAlertLevel(LogLevel.Verbose);

    // OneSignal Initialization
    OneSignal.initialize('ddccaa61-5e9c-430e-a9c7-70bc62cbc6e2');

    // requestPermission will show the native iOS or Android notification permission prompt.
    // We recommend removing the following code and instead using an In-App Message to prompt for notification permission
    OneSignal.Notifications.requestPermission(true);
    // requestPermission Triggering Programmatically

    // Method for listening for notification clicks
    // When a notification is clicked, refresh the cleaning request data
    const handleNotificationClick = event => {
      try {
        console.log('OneSignal: notification clicked:', event);
        // Refresh cleaning request data when notification is clicked
        // This ensures the app has the latest data when opening from notification
        dispatch(getClean());

        // "Cleaning ended" pushes (customer completed the job) carry the cleaner
        // row id in additionalData. If the app was closed when the live Pusher
        // event fired, getClean() alone can't recover the "rate the customer"
        // prompt (GET /clean excludes completed assignments) — so fetch that
        // specific assignment's history and, if it hasn't been reviewed yet, set
        // pendingRating directly. Home.jsx's existing effect then navigates to the
        // Rate screen exactly as it would from the live-event path.
        (async () => {
          try {
            const data = event?.notification?.additionalData;
            if (data?.type !== 'cleaning_ended' || !data?.cleaner_id) return;

            const res = await Client({
              method: 'GET',
              path: `history/${data.cleaner_id}`,
            });
            const history = res?.data?.history;
            if (history && !history.review) {
              dispatch(setPendingRatingFromNotification(data.cleaner_id));
            }
          } catch (error) {
            console.error(
              'OneSignal: error handling cleaning_ended notification click:',
              error,
            );
          }
        })();
      } catch (error) {
        console.error('OneSignal: Error handling notification click:', error);
      }
    };

    OneSignal.Notifications.addEventListener('click', handleNotificationClick);

    return () => {
      // Cleanup: remove event listener when component unmounts
      OneSignal.Notifications.removeEventListener('click', handleNotificationClick);
    };
  }, [dispatch]);

  const [appState, setAppState] = useState(AppState.currentState);

  const handleAppStateChange = useCallback((nextAppState, notifyValue, userValue) => {
    // Trigger when app comes to foreground (from background or inactive)
    if (nextAppState === 'active' && appState !== 'active') {
      // Refresh clean data when app returns to foreground
      if (userValue?.id) {
        dispatch(getClean());
      }
    } else if (
      appState === 'active' &&
      nextAppState.match(/inactive|background/) &&
      !notifyValue &&
      userValue?.online
    ) {
      const Notifications = getNotifications();
      if (Notifications) {
        try {
          Notifications.postLocalNotification({
            body: 'Running in background',
            // silent: true,
          });
        } catch (error) {
          console.warn('Failed to post notification:', error);
        }
      }
      dispatch(setNotify());
    }
    setAppState(nextAppState);
  }, [appState, dispatch]);

  useEffect(() => {
    const Sub = AppState.addEventListener('change', nextAppState =>
      handleAppStateChange(nextAppState, notify, user),
    );
    return () => {
      Sub.remove();
    };
  }, [handleAppStateChange, notify, user]);

  return (
    <>
      <Routes />
      {(pending || pendingProfile || uiPending || profilePending) && (
        <Loading />
      )}
      <BlockingRequestModal />
      <UpdateGate />
    </>
  );
};

// Global clean-request poll — runs every 10s while cleaner is online.
// Ensures the BlockingRequestModal fires on ANY screen, not just Home.
const PagesWithPoll = () => {
  // App-level real-time subscription to clean requests (replaces the old poll).
  useGlobalCleanSocket();
  return null;
};

export default function App() {
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    initI18n().then(() => setI18nReady(true));
    (async () => {
      try {
        await AsyncStorage.getItem('accessToken');
      } catch (error) {}
    })();
  }, []);

  if (!i18nReady) return null;

  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <PersistGate loading={<Loading />} persistor={persistor}>
          <ErrorBoundary>
            <Pages />
          </ErrorBoundary>
          <PagesWithPoll />
          <Toast config={toastConfig} />
        </PersistGate>
      </Provider>
    </SafeAreaProvider>
  );
}
