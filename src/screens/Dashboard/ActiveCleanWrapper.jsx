import React, {useState, useEffect, useCallback, useRef} from 'react';
import {Platform, PermissionsAndroid, AppState} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import Geolocation from '@react-native-community/geolocation';
import CleanDetails from './CleanDetails';
import {useTranslation} from 'react-i18next';
import {evaluateFix} from '../../utils/locationFilter';
import {updateStatus} from '../../store/actions/dashboard/updateStatus';
import {postLocationSample} from '../../store/actions/dashboard/postLocationSample';
import {
  setLivePosition,
  setPermissionState,
} from '../../store/reducer/userSlice';

const ENROUTE_PUSH_MS = 10000; // en-route: push position to the backend every 10s

// Cleaner.status values that are monitored for BUG-016: arrived and cleaning.
export const MONITORED_STATUSES = [3, 4];

// Only used until the server's sample_interval_seconds arrives.
const DEFAULT_SAMPLE_INTERVAL_MS = 60000;

/**
 * Wrapper component for CleanDetails that handles location fetching.
 * Used by the "Active Clean" tab in Dashboard to ensure location props are passed.
 *
 * This is the single owner of the job-flow location stream: it smooths every fix through
 * evaluateFix and publishes the result to Redux, so useGeofence (the Arrive gate) and the
 * job-site banner both derive from one filtered source instead of opening their own watchers.
 */
const ActiveCleanWrapper = () => {
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const [location, setLocation] = useState(null);
  const [rejectMessage, setRejectMessage] = useState(null);
  // Tracks the last accepted GPS fix so evaluateFix() can reject low-accuracy / teleport jumps.
  const lastFixRef = useRef({lat: null, lng: null, time: 0, rejects: 0});
  // En-route backend pushes from this screen so live tracking doesn't depend on the
  // Home watcher staying mounted. Ref-synced to avoid stale closures in the watcher.
  const acceptedCleanRequest = useSelector(
    state => state.user.acceptedCleanRequest,
  );
  const monitoringConfig = useSelector(state => state.user.monitoringConfig);

  const statusRef = useRef(null);
  const cleanerIdRef = useRef(null);
  useEffect(() => {
    statusRef.current = acceptedCleanRequest?.status ?? null;
    cleanerIdRef.current = acceptedCleanRequest?.id ?? null;
  }, [acceptedCleanRequest?.status, acceptedCleanRequest?.id]);

  const monitoringEnabledRef = useRef(true);
  const sampleIntervalRef = useRef(DEFAULT_SAMPLE_INTERVAL_MS);
  useEffect(() => {
    monitoringEnabledRef.current = monitoringConfig?.enabled !== false;
    sampleIntervalRef.current = monitoringConfig?.sample_interval_seconds
      ? monitoringConfig.sample_interval_seconds * 1000
      : DEFAULT_SAMPLE_INTERVAL_MS;
  }, [monitoringConfig?.enabled, monitoringConfig?.sample_interval_seconds]);

  const lastPushRef = useRef(0);
  const lastSampleRef = useRef(0);

  const isMonitored = status => MONITORED_STATUSES.includes(status);

  const requestLocationPermission = useCallback(async () => {
    if (Platform.OS === 'ios') {
      // Previously `return true` unconditionally, which made a mid-clean revocation
      // undetectable on iOS. requestAuthorization reports the real authorization state.
      return new Promise(resolve => {
        try {
          Geolocation.requestAuthorization(
            () => resolve(true),
            () => resolve(false),
          );
        } catch (err) {
          console.warn('iOS location authorization error:', err);
          resolve(false);
        }
      });
    }
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: t('common.location_access_message'),
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Location permission error:', err);
      return false;
    }
  }, [t]);

  const getLocation = useCallback(async () => {
    try {
      const hasPermission = await requestLocationPermission();
      dispatch(setPermissionState(hasPermission ? 'granted' : 'denied'));

      if (hasPermission) {
        Geolocation.getCurrentPosition(
          position => {
            const {latitude, longitude} = position.coords;
            setLocation({latitude, longitude});
          },
          error => {
            console.log('Location error:', error);
          },
          {enableHighAccuracy: true, timeout: 30000, maximumAge: 10000},
        );
      }
    } catch (error) {
      console.log('getLocation error:', error);
    }
  }, [requestLocationPermission, dispatch]);

  // Get location on mount
  useEffect(() => {
    getLocation();
  }, [getLocation]);

  const sendSample = useCallback(
    (coords, source) => {
      if (!monitoringEnabledRef.current) return;
      if (!isMonitored(statusRef.current)) return;
      if (!cleanerIdRef.current) return;

      dispatch(
        postLocationSample({
          id: cleanerIdRef.current,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
          accuracy_m: coords?.accuracy != null ? Math.round(coords.accuracy) : null,
          source,
        }),
      );
    },
    [dispatch],
  );

  // Watch position for updates
  useEffect(() => {
    let watchId = null;

    if (location?.latitude && location?.longitude) {
      watchId = Geolocation.watchPosition(
        position => {
          // Smooth the Fused-provider stream (Kalman) and reject teleport glitches.
          const {accept, reason, position: smoothed, nextState} = evaluateFix(
            position.coords,
            lastFixRef.current,
          );
          lastFixRef.current = nextState;
          if (!accept) {
            console.log(`🚫 Rejected GPS fix (${reason})`);
            return;
          }
          setLocation({latitude: smoothed.lat, longitude: smoothed.lng});

          // Publish the smoothed fix so the Arrive gate and the job-site banner read one
          // filtered stream instead of each opening a watcher on raw coords.
          dispatch(
            setLivePosition({
              lat: smoothed.lat,
              lng: smoothed.lng,
              accuracy: smoothed.accuracy,
              at: Date.now(),
            }),
          );

          const now = Date.now();
          const status = statusRef.current;

          // While en route to an accepted job, push the position to the backend
          // (throttled) so the customer's map tracks the cleaner live. The
          // updateStatus action resolves which customer to alert from the store.
          if (status === 1 && now - lastPushRef.current >= ENROUTE_PUSH_MS) {
            lastPushRef.current = now;
            dispatch(
              updateStatus({
                data: {
                  online: 1,
                  current_position: {lat: smoothed.lat, lng: smoothed.lng},
                },
              }),
            );
          }

          if (
            isMonitored(status) &&
            now - lastSampleRef.current >= sampleIntervalRef.current
          ) {
            lastSampleRef.current = now;
            sendSample(smoothed, 'heartbeat');
          }
        },
        error => {
          console.log('Watch position error:', error);

          // code 1 = PERMISSION_DENIED. During an active job this is a deliberate
          // revocation rather than a signal gap, so report it: the backend flags it
          // separately and the app prompts the cleaner to turn location back on.
          if (error?.code === 1 && isMonitored(statusRef.current)) {
            dispatch(setPermissionState('denied'));
            sendSample(null, 'permission_lost');
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000,
          distanceFilter: 10,
        },
      );
    }

    return () => {
      if (watchId !== null) {
        Geolocation.clearWatch(watchId);
      }
    };
  }, [location?.latitude, location?.longitude, dispatch, sendSample]);

  // Opportunistic sampling: a fresh fix every time the app returns to the foreground.
  // This is the sampling that actually catches a cleaner who left and is checking their
  // phone — backgrounding itself is normal, honest behaviour and is never held against them.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState !== 'active') return;
      if (!monitoringEnabledRef.current) return;
      if (!isMonitored(statusRef.current)) return;

      Geolocation.getCurrentPosition(
        position => {
          const {latitude, longitude, accuracy} = position.coords;
          dispatch(setPermissionState('granted'));
          lastSampleRef.current = Date.now();
          sendSample({lat: latitude, lng: longitude, accuracy}, 'foreground');
        },
        error => {
          if (error?.code === 1) {
            dispatch(setPermissionState('denied'));
            sendSample(null, 'permission_lost');
          }
        },
        {enableHighAccuracy: true, timeout: 15000, maximumAge: 0},
      );
    });

    return () => subscription.remove();
  }, [dispatch, sendSample]);

  return (
    <CleanDetails
      latitude={location?.latitude}
      longitude={location?.longitude}
      rejectMessage={rejectMessage}
    />
  );
};

export default ActiveCleanWrapper;
