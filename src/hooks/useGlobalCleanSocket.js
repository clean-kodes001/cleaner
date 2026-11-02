import {useEffect, useState} from 'react';
import {Platform} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Pusher from 'pusher-js/react-native';
import Echo from 'laravel-echo';
import pusherConfig from '../../pusher.json';
import {
  setMyCleanRequest,
  resetCleanRequest,
  resetEndCleanRequest,
  setMyActiveClean,
} from '../store/reducer/userSlice';

const PusherConstructor = Pusher?.Pusher ?? Pusher?.default ?? Pusher;

const pusherConfigForRuntime =
  Platform.OS === 'ios' && __DEV__
    ? {
        ...pusherConfig,
        restServer: 'http://localhost:8000',
        httpHost: 'localhost',
        authEndpoint: 'http://localhost:8000/api/broadcasting/auth',
        wsHost: 'localhost',
      }
    : pusherConfig;

/**
 * App-level subscription to the cleaner's clean-request channel.
 *
 * Replaces the old 10s getClean poll. Home.jsx is a *lazy* bottom-tab, so its
 * own Echo subscription never starts if the cleaner opens another tab first —
 * which is why new requests didn't surface everywhere. Mounting this at the App
 * level keeps the subscription alive on every screen and removes the polling
 * loop (and the loading-state blink it caused). It only updates the clean
 * request redux state; it deliberately does NOT dispatch getClean(), so there's
 * no global loading flash.
 */
export const useGlobalCleanSocket = () => {
  const dispatch = useDispatch();
  const userId = useSelector(state => state.user?.user?.id);
  const [token, setToken] = useState(null);

  // Keep the bearer token in sync (login / logout / token refresh).
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem('accessToken')
      .then(t => mounted && setToken(t))
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!token || !userId) {
      return;
    }

    let echo;
    const channelName = `clean.${userId}`;

    try {
      const client = new PusherConstructor(pusherConfigForRuntime.key, {
        ...pusherConfigForRuntime,
        wsPort: Number(pusherConfigForRuntime.wsPort),
        wssPort: Number(pusherConfigForRuntime.wssPort),
        auth: {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        },
        userAuthentication: {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        },
      });

      echo = new Echo({broadcaster: 'pusher', client});

      echo.private(channelName).listen('Clean', e => {
        if (e?.clean?.clean?.clean_amend) {
          dispatch(setMyActiveClean(e?.clean));
        }

        if (e?.clean === null) {
          // Customer cancelled the request.
          dispatch(resetCleanRequest(e?.clean));
        } else if (e?.clean?.status === 10) {
          dispatch(resetEndCleanRequest(e?.clean));
        } else if (e?.clean?.clean && e?.clean?.status === 0) {
          // New unaccepted request — set it (with a fresh 30s timer anchor).
          dispatch(
            setMyCleanRequest({
              ...e.clean.clean,
              timeOfMatch: e.clean.created_at,
            }),
          );
        }
      });
    } catch (err) {
      console.log('useGlobalCleanSocket: setup failed', err);
    }

    return () => {
      try {
        echo?.leave?.(channelName);
        echo?.disconnect?.();
      } catch (err) {}
    };
  }, [token, userId, dispatch]);
};
