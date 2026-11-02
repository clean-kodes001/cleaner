import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  Dimensions,
  Keyboard,
  Pressable,
  PermissionsAndroid,
  Alert,
  ActivityIndicator,
  Platform,
  AppState,
} from 'react-native';
import ScreenContainer from '../../components/Shared/ScreenContainer';
import Geocoder from 'react-native-geocoding';
import axios from 'axios';
import Text from '../../components/Shared/Text';
import {useDispatch, useSelector} from 'react-redux';
import BottomSheet, {BottomSheetBackdrop} from '@gorhom/bottom-sheet';
import MapView, {Marker} from 'react-native-maps';
import Pusher from 'pusher-js/react-native';
import Echo from 'laravel-echo';
import pusherConfig from '../../../pusher.json';
import Geolocation from '@react-native-community/geolocation';
import KeepAwake from 'react-native-keep-awake';
import {getDistance} from 'geolib';
import {authenticated} from '../../store/actions/onboarding/authenticated';
import {useFocusEffect} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import Button from '../../components/Shared/Button';
import Online, {Blink} from '../../components/Buttons/Online';
import {changeStatus} from '../../store/actions/dashboard/changeStatus';
import Modal1 from '../../components/Modals/Modal1';
import timeformatter, {combineTimeAndDate} from '../../utils/timeformatter';
import {colors} from '../../config/colors';
import {
  logOut,
  resetCleanRequest,
  resetEndCleanRequest,
  setMyActiveAmend,
  setMyActiveClean,
  setMyCleanRequest,
  setRequestOppParty,
  incrementMessageCount,
  setUserOnlineStatus,
  setLivePosition,
} from '../../store/reducer/userSlice';
import CleanDetails from './CleanDetails';
import {showToast} from '../../utils/showToast';
import locationConfig from '../../../googleLocation.json';
import {logHelper} from '../../utils/logHelper';
import {evaluateFix} from '../../utils/locationFilter';
import {getClean} from '../../store/actions/dashboard/getClean';
import {updateStatus} from '../../store/actions/dashboard/updateStatus';
import {useReducedMotion} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';
const {width, height} = Dimensions.get('window');

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

const Home = ({navigation}) => {
  const {t} = useTranslation();
  Geocoder.init(locationConfig.APIkey);
  Geolocation.setRNConfiguration({
    skipPermissionRequests: false,
    authorizationLevel: 'whenInUse',
  });

  const dispatch = useDispatch();

  const mapStyle = [];

  const [token, setToken] = useState();
  const [showModal, setShowModal] = useState(false);

  const bottomSheetRef = useRef();
  const getLocationRef = useRef(null);
  const getLocationInternalRef = useRef(null);

  // Ref to track AppState for the "Hard Reset"
  const appState = useRef(AppState.currentState);
  const lastGetCleanCall = useRef(0);
  const lastUpdateStatusCall = useRef(0);
  const lastGeocodeData = useRef({lat: 0, lng: 0, time: 0});
  // Tracks the last accepted GPS fix so evaluateFix() can reject low-accuracy / teleport jumps.
  const lastFixRef = useRef({lat: null, lng: null, time: 0, rejects: 0});
  const GET_CLEAN_THROTTLE_MS = 2000; // Only allow getClean calls every 2 seconds
  const UPDATE_STATUS_THROTTLE_MS = 30000; // idle: 1 position push / 30s
  const ENROUTE_UPDATE_STATUS_THROTTLE_MS = 10000; // en-route (accepted job): 1 push / 10s

  const snapPoints = useMemo(() => [330], []);

  const handleSheetChanges = useCallback(index => {}, []);

  const {authenticated: authenticatedData} = useSelector(state => state.data);
  const userCleanRequest = useSelector(state => state.user.cleanRequest);
  const acceptedCleanRequest = useSelector(
    state => state.user.acceptedCleanRequest,
  );
  // En-route flag read by the (stable) throttledUpdateStatus closure so the push
  // cadence tightens to 10s while driving to an accepted job.
  const enRouteRef = useRef(false);
  useEffect(() => {
    enRouteRef.current = acceptedCleanRequest?.status === 1;
  }, [acceptedCleanRequest?.status]);
  const {user, lastTimeMyLocationWasUpdated, pending, pendingRating} =
    useSelector(state => state.user);

  useEffect(() => {
    pendingRating &&
      navigation.navigate('rate', {
        id: pendingRating,
        status: 7,
      });
  }, [pendingRating, navigation]);

  // Location retry state
  const [locationRetryCount, setLocationRetryCount] = useState(0);
  const MAX_LOCATION_RETRIES = 3;
  const locationRetryTimeoutRef = useRef(null);
  const hasTriggeredHardReset = useRef(false);

  // New: Hard Reset Function to wake up GPS
  const triggerGPSReset = useCallback(() => {
    console.log('⚡ Triggering GPS Hard Reset...');

    // 1. Clear existing watches
    if (watchID) Geolocation.clearWatch(watchID);

    // 2. Force a fresh hardware read (High Accuracy, No Cache)
    Geolocation.getCurrentPosition(
      pos => {
        console.log('✅ GPS Hard Reset Successful (Location Found)');
        // Reset the flag so we can do it again if needed later
        hasTriggeredHardReset.current = false;
        setLocationRetryCount(0);
        getLocationRef.current?.();
      },
      err => {
        console.log('⚠️ GPS Hard Reset Error (Still failing):', err.message);
        // Even if this "wake up" call fails, we try the standard getLocation one last time
        // or just let the user retry manually.
        // For now, let's try standard flow one more time.
        getLocationRef.current?.();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }, [watchID]);

  const requestLocationPermissionIos = async () => {
    // Don't skip permission requests - let the system handle it properly
    // Geolocation.setRNConfiguration is now done in the global useEffect

    return new Promise((resolve, reject) => {
      const authPromise = new Promise(res => {
        Geolocation.requestAuthorization(
          () => res('granted'),
          error => {
            console.log('iOS location authorization denied:', error);
            res('denied');
          },
        );
      });

      // Race against a timeout in case the callback never fires (e.g. already granted)
      const timeoutPromise = new Promise(res => {
        setTimeout(() => res('granted'), 1000); // Increased timeout to 1 second
      });

      Promise.race([authPromise, timeoutPromise]).then(status =>
        resolve(status),
      );
    });
  };

  const requestLocationPermission = useCallback(async () => {
    try {
      let granted;
      if (Platform.OS === 'ios') {
        granted = await requestLocationPermissionIos();
      } else {
        // Android: First check if permission is already granted
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );

        if (hasPermission) {
          granted = 'granted';
        } else {
          // Request permission if not already granted
          granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: t('home.location_permission_title'),
              message: t('home.location_permission_message'),
              buttonNeutral: 'Ask Me Later',
              buttonNegative: t('common.cancel'),
              buttonPositive: t('common.ok'),
            },
          );
        }
      }

      if (
        granted === PermissionsAndroid.RESULTS.GRANTED ||
        granted === 'granted'
      ) {
        return true;
      } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        // User has permanently denied permission
        showToast({
          type: 0,
          message: t('home.location_perm_denied_permanent'),
        });
        return false;
      } else {
        showToast({
          type: 0,
          message: t('home.location_perm_denied'),
        });
        return false;
      }
    } catch (err) {
      console.log('Permission request error:', err);
      showToast({
        type: 0,
        message: t('home.location_perm_failed'),
      });
      return false;
    }
  }, []);

  const [location, setLocation] = useState(false);

  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationAddress, setLocationAddress] = useState(false);
  const [myPosition, setMyPosition] = useState(false);
  const map = useRef();

  const [isCanceled, setIsCanceled] = useState(false);
  const [watchID, setWatchID] = useState(null);
  const [rejectMessage, setRejectMessage] = useState(null);

  // Retry getting location with exponential backoff
  const retryGetLocation = useCallback(retryCount => {
    if (retryCount >= MAX_LOCATION_RETRIES) {
      console.log('❌ Max location retries reached');

      // FALLBACK: Try Hard Reset if we haven't already
      if (!hasTriggeredHardReset.current) {
        console.log('⚠️ Attempting Hard Reset to fix stuck GPS...');
        hasTriggeredHardReset.current = true;

        showToast({
          type: 1,
          message: t('home.gps_resetting'),
        });

        triggerGPSReset();
        return;
      }

      // If we already tried hard reset and it failed:
      setLoadingLocation(false);
      showToast({
        type: 0,
        message: t('home.location_error_unavailable'),
      });
      // Reset flag so they can try again manually
      hasTriggeredHardReset.current = false;
      return;
    }

    const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
    console.log(
      `🔄 Retrying location in ${delay}ms (attempt ${
        retryCount + 1
      }/${MAX_LOCATION_RETRIES})`,
    );

    locationRetryTimeoutRef.current = setTimeout(() => {
      setLocationRetryCount(retryCount + 1);
      getLocationInternalRef.current?.(retryCount + 1);
    }, delay);
  }, [triggerGPSReset]);

  const getLocationInternal = useCallback(
    async (retryCount = 0, useHighAccuracy = true) => {
      try {
        const hasPermission = await requestLocationPermission();

        if (!hasPermission) {
          setLoadingLocation(false);
          return;
        }

        Geolocation.getCurrentPosition(
          position => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            let region = {
              latitude,
              longitude,
              latitudeDelta: 0,
              longitudeDelta: 0,
            };

            console.log('✅ Got location:', {latitude, longitude});
            setLocation(region);
            setMyPosition(region);
            setLoadingLocation(false);
            setLocationRetryCount(0);
          },
          error => {
            console.log(
              '❌ getCurrentPosition error:',
              error.code,
              error.message,
            );

            if (error.code === 1) {
              setLoadingLocation(false);
              showToast({
                type: 0,
                message: t('home.location_error_denied'),
              });
            } else if ((error.code === 2 || error.code === 3) && Platform.OS === 'android' && useHighAccuracy) {
              // GPS unavailable/timed out — fall back to network/WiFi location (mirrors iOS Core Location behaviour)
              getLocationInternalRef.current?.(retryCount, false);
            } else if (error.code === 2) {
              retryGetLocation(retryCount);
            } else if (error.code === 3) {
              console.log('⏱️ Location request timed out, retrying...');
              retryGetLocation(retryCount);
            } else {
              retryGetLocation(retryCount);
            }
          },
          {
            enableHighAccuracy: useHighAccuracy,
            timeout: useHighAccuracy ? 15000 : 10000,
            maximumAge: useHighAccuracy ? 5000 : 10000,
          },
        );
      } catch (error) {
        console.log('getLocationInternal error:', error);
        setLoadingLocation(false);
        showToast({
          type: 0,
          message: t('home.location_error_generic'),
        });
      }
    },
    [requestLocationPermission, retryGetLocation],
  );

  useEffect(() => {
    getLocationInternalRef.current = getLocationInternal;
  }, [getLocationInternal]);

  const getLocation = useCallback(async () => {
    // Clear any pending retry
    if (locationRetryTimeoutRef.current) {
      clearTimeout(locationRetryTimeoutRef.current);
    }

    setLoadingLocation(true);
    setLocationRetryCount(0);
    await getLocationInternal(0);
  }, [getLocationInternal]);

  useEffect(() => {
    getLocationRef.current = getLocation;
  }, [getLocation]);

  // Cleanup retry timeout on unmount
  useEffect(() => {
    return () => {
      if (locationRetryTimeoutRef.current) {
        clearTimeout(locationRetryTimeoutRef.current);
      }
    };
  }, []);

  // Return the human-readable street address AT the queried coordinate.
  //
  // Google returns several results for one coordinate, ALREADY ordered most-relevant
  // first — and the first result is the address at that point. So respect Google's order:
  // return the first real street address, skipping "plus_code" results (Open Location
  // Code, e.g. "98XX+GW"). Do NOT reorder by ROOFTOP type or by distance-to-centroid —
  // both pick a *neighbouring* building, which was the wrong address. (Distance is only a
  // last-resort fallback below.)
  const getBestAddress = (results, qLat, qLng) => {
    if (!results || results.length === 0) return null;

    const isPlusCode = r =>
      Array.isArray(r.types) && r.types.includes('plus_code');
    const ADDRESS_TYPES = [
      'street_address',
      'premise',
      'subpremise',
      'route',
      'intersection',
    ];

    // PRIMARY: the first (most-relevant) real street address that isn't a plus code.
    const ordered = results.find(
      r =>
        r.formatted_address &&
        !isPlusCode(r) &&
        Array.isArray(r.types) &&
        r.types.some(t => ADDRESS_TYPES.includes(t)),
    );
    if (ordered) return ordered.formatted_address;

    // FALLBACK: nearest non-plus-code result, else the first with an address.
    const usable = results.filter(r => r.formatted_address && !isPlusCode(r));
    if (usable.length) {
      const distTo = r => {
        const loc = r.geometry?.location;
        if (!loc || typeof qLat !== 'number' || typeof qLng !== 'number') {
          return Infinity;
        }
        const dLat = loc.lat - qLat;
        const dLng = loc.lng - qLng;
        return dLat * dLat + dLng * dLng;
      };
      return usable.reduce((a, b) => (distTo(b) < distTo(a) ? b : a))
        .formatted_address;
    }
    return results.find(r => r.formatted_address)?.formatted_address || null;
  };

  // New geocoder using axios directly
  const getAddressFromCordinate = async (lat, lng) => {
    try {
      const {data} = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${locationConfig.APIkey}`,
      );
      // [GEOCODING-FIX-OLD] returned only the first result, ignoring location_type ranking
      // return data?.results[0];

      // [GEOCODING-FIX-NEW] return full results array so getBestAddress() can pick ROOFTOP first
      return data?.results;
    } catch (error) {
      console.log('❌ Geocoding failed:', error.message || error);
      return null;
    }
  };

  const geocoder = async (latitude, longitude) => {
    try {
      // [GEOCODING-FIX-OLD] treated result as single object, read .formatted_address directly
      // const result = await getAddressFromCordinate(latitude, longitude);
      // const formatted_address = result?.formatted_address;

      // [GEOCODING-FIX-NEW] result is now the full array; getBestAddress() picks ROOFTOP first
      const results = await getAddressFromCordinate(latitude, longitude);
      const formatted_address = getBestAddress(results, latitude, longitude);

      // Validate the address before setting it
      if (
        formatted_address &&
        formatted_address !== '0' &&
        formatted_address !== 0 &&
        formatted_address.trim() !== ''
      ) {
        setLocationAddress(formatted_address);
        // console.log('✅ Geocoded address:', formatted_address);
      } else {
        console.warn(
          '⚠️ Invalid geocoded address received:',
          formatted_address,
        );
      }
    } catch (error) {
      console.log('❌ Geocoding failed:', error.message || error);
      // Don't update locationAddress on error - keep the previous valid value
    }
  };

  // Old geocoder using react-native-geocoding library (commented out)
  // const geocoder = async (latitude, longitude) => {
  //   try {
  //     const result = await Geocoder.from(latitude, longitude);
  //     const formatted_address = getBestAddress(result.results);
  //
  //     // Validate the address before setting it
  //     if (formatted_address &&
  //         formatted_address !== '0' &&
  //         formatted_address !== 0 &&
  //         formatted_address.trim() !== '') {
  //       setLocationAddress(formatted_address);
  //       // console.log('✅ Geocoded address:', formatted_address);
  //     } else {
  //       console.warn('⚠️ Invalid geocoded address received:', formatted_address);
  //     }
  //   } catch (error) {
  //     console.log('❌ Geocoding failed:', error.message || error);
  //     // Don't update locationAddress on error - keep the previous valid value
  //   }
  // };

  // 3. UPDATED WATCHER WITH KEEP AWAKE
  useEffect(() => {
    let watchId = null;

    if (user?.online && location?.latitude) {
      console.log('� User Online: Keeping Screen Awake & Watching GPS');

      // PREVENT SLEEP (iOS & Android)
      try {
        KeepAwake?.activate();
      } catch (e) {
        console.log('KeepAwake not available');
      }

      watchId = Geolocation.watchPosition(
        async pos => {
          const crd = pos.coords;
          console.log('📍 New Position:', crd.latitude, crd.longitude);

          // Smooth the Fused-provider stream (Kalman) and reject teleport glitches
          // before anything touches the map or gets pushed to the backend.
          const {accept, reason, position, nextState} = evaluateFix(
            crd,
            lastFixRef.current,
          );
          lastFixRef.current = nextState;
          if (!accept) {
            console.log(`🚫 Rejected GPS fix (${reason})`);
            return;
          }
          // Use the smoothed estimate downstream (map pin, geocode, current_position)
          // so the position stays calm like iOS CoreLocation.
          crd.latitude = position.lat;
          crd.longitude = position.lng;

          const region = {
            latitude: crd.latitude,
            longitude: crd.longitude,
            latitudeDelta: 0,
            longitudeDelta: 0,
          };

          setLocation(region);
          setMyPosition(region);

          // Publish the smoothed fix so the Arrive gate and job-site banner work on THIS tab
          // too. useGeofence reads only state.user.livePosition, which ActiveCleanWrapper
          // publishes — but that lives on a different tab, so a cleaner running the job from
          // Home had no fix at all and Arrive stayed disabled however close they got.
          dispatch(
            setLivePosition({
              lat: position.lat,
              lng: position.lng,
              accuracy: position.accuracy,
              at: Date.now(),
            }),
          );

          // Geocode the new position to keep address in sync
          // SMART THROTTLING: Only geocode if moved > 500m OR > 5 mins elapsed
          try {
            const now = Date.now();
            const timeDiff = now - lastGeocodeData.current.time;
            const dist = getDistance(
              {latitude: crd.latitude, longitude: crd.longitude},
              {
                latitude: lastGeocodeData.current.lat,
                longitude: lastGeocodeData.current.lng,
              },
            );

            console.log(
              `📍 Check Throttling: Dist=${dist}m, Time=${timeDiff}ms`,
            );

            // Thresholds: 500 meters OR 5 minutes (300000 ms)
            if (dist > 500 || timeDiff > 300000) {
              console.log('🚀 Triggering Geocoder (Threshhold met)');
              // Update ref immediately to prevent double firing
              lastGeocodeData.current = {
                lat: crd.latitude,
                lng: crd.longitude,
                time: now,
              };

              const result = await Geocoder.from(crd.latitude, crd.longitude);
              const formatted_address = getBestAddress(
                result.results,
                crd.latitude,
                crd.longitude,
              );

              // Validate the address before using it
              if (
                formatted_address &&
                formatted_address !== '0' &&
                formatted_address !== 0 &&
                formatted_address.trim() !== ''
              ) {
                setLocationAddress(formatted_address);
                // console.log('✅ Geocoded address:', formatted_address);

                // Update status with the fresh geocoded address
                if (!pending) {
                  const data = {
                    online: 1,
                    current_location: formatted_address,
                    current_position: {
                      lat: crd.latitude,
                      lng: crd.longitude,
                    },
                  };
                  throttledUpdateStatus(data);
                }
              } else {
                console.warn(
                  '⚠️ Invalid geocoded address received:',
                  formatted_address,
                );
              }
            } else {
              console.log('⏳ Throttling Geocoder: Using cached address');
              // Push coordinates regardless of whether a geocoded address exists yet —
              // live tracking must not wait on (or be blocked by) the geocoder.
              if (!pending) {
                const data = {
                  online: 1,
                  current_position: {
                    lat: crd.latitude,
                    lng: crd.longitude,
                  },
                };
                if (locationAddress) {
                  data.current_location = locationAddress; // cached address if we have one
                }
                throttledUpdateStatus(data);
              }
            }
          } catch (error) {
            console.log('error===>', error);
            console.log(
              '❌ Geocoding failed in watchPosition:',
              error.message || error,
            );
          }
        },
        error => {
          console.log('❌ Watch Error:', error.code, error.message);
        },
        {
          // High accuracy on both platforms; weak fixes are filtered by evaluateFix()
          // rather than relied upon. Kept in sync with the iOS half.
          enableHighAccuracy: true,
          distanceFilter: 10,
          interval: 5000,
          fastestInterval: 2000,
          maximumAge: 0,
          timeout: 20000,
        },
      );
      setWatchID(watchId);
    } else {
      // User is Offline -> Let phone sleep
      // Geolocation.stopObserving();
      try {
        KeepAwake?.deactivate();
      } catch (e) {
        /* KeepAwake not available */
      }
      if (watchID) Geolocation.clearWatch(watchID);
    }

    return () => {
      // Geolocation.stopObserving();
      if (watchId !== null) Geolocation.clearWatch(watchId);
      try {
        KeepAwake?.deactivate();
      } catch (e) {
        /* KeepAwake not available */
      } // Cleanup
    };
  }, [
    user?.online,
    location?.latitude,
    pending,
    locationAddress,
    throttledUpdateStatus,
    watchID,
    dispatch,
  ]);

  // Throttled version of updateStatus to prevent rate limiting
  // Using useRef to maintain stable reference and avoid useEffect dependency issues
  const throttledUpdateStatus = useRef(data => {
    const now = Date.now();
    const throttleMs = enRouteRef.current
      ? ENROUTE_UPDATE_STATUS_THROTTLE_MS
      : UPDATE_STATUS_THROTTLE_MS;
    if (now - lastUpdateStatusCall.current < throttleMs) {
      // console.log('⏱️ updateStatus throttled, skipping call');
      return;
    }
    lastUpdateStatusCall.current = now;
    console.log('✅ Calling updateStatus');
    dispatch(updateStatus({data}));
  }).current;

  const updateLocation = async location => {
    try {
      // // Hardcoded location data for now
      // const data = {
      //   online: 1,
      //   current_location: '22 Barr Street, Regina, SK, Canada',
      //   current_position: {
      //     lat: 50.4750894,
      //     lng: -104.634125,
      //   },
      // };

      throttledUpdateStatus({
        online: 1,
        current_location: locationAddress,
        current_position: {
          lat: location.latitude,
          lng: location.longitude,
        },
      });
      throttledGetClean();
    } catch (error) {
      console.warn('updateLocation error:', error);
    }
  };

  // [GEOCODING-FIX-NEW] async so we can await geocoding when locationAddress is not yet set
  // [GEOCODING-FIX-OLD] const handleGoOnline = location => {
  const handleGoOnline = async location => {
    // Check if we have coordinates (required)
    if (!location?.latitude || !location?.longitude) {
      // Location coordinates not ready yet - trigger location fetch
      console.log('📍 handleGoOnline: Coordinates not ready, fetching...', {
        hasLat: !!location?.latitude,
        hasLng: !!location?.longitude,
      });

      getLocation();

      if (loadingLocation) {
        showToast({
          type: 1,
          message: t('home.getting_location_wait'),
        });
      } else {
        showToast({
          type: 1,
          message: t('home.fetching_location_retry'),
        });
      }
      return;
    }

    // We have coordinates - use geocoded address if available, otherwise fetch it now
    // [GEOCODING-FIX-OLD] const addressToUse = locationAddress;
    // [GEOCODING-FIX-OLD] if (!locationAddress) {
    // [GEOCODING-FIX-OLD]   // geocoder(location.latitude, location.longitude); ← was commented out, sent null
    // [GEOCODING-FIX-OLD] }

    // [GEOCODING-FIX-NEW] if locationAddress not yet set, fetch synchronously so we never send null
    let addressToUse = locationAddress;
    if (!addressToUse) {
      try {
        const results = await getAddressFromCordinate(location.latitude, location.longitude);
        addressToUse = getBestAddress(results, location.latitude, location.longitude);
      } catch (e) {
        console.warn('⚠️ handleGoOnline: geocoding failed, proceeding with null address', e);
      }
    }

    {
      const data = {
        online: 1,
        user_id: userCleanRequest?.user_id,
        current_location: addressToUse,
        current_position: {
          lat: location.latitude,
          lng: location.longitude,
        },
      };

      dispatch(changeStatus({data}));
    }
  };
  const handleGoOffline = () => {
    // Reset the geocode cache + throttle so the NEXT go-online re-geocodes the
    // current position instead of re-sending the stale cached address.
    setLocationAddress(false);
    lastGeocodeData.current = {lat: 0, lng: 0, time: 0};
    const data = {
      online: 0,
    };
    dispatch(changeStatus({data}));
  };

  const ProceedToVeiwRequestDetails = () => {
    setShowModal(false);
  };

  // Pusher.logToConsole = true;
  let PusherClient = useMemo(() => {
    if (!token) {
      console.log('Pusher: Token not available yet, skipping initialization');
      return null;
    }

    try {
      console.log('Pusher: Initializing with token');
      return new PusherConstructor(pusherConfigForRuntime.key, {
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
    } catch (error) {
      console.log('Pusher: Initialization failed', error);
      return null;
    }
  }, [token]);

  let echo = useMemo(() => {
    if (!PusherClient) {
      console.log('Echo: PusherClient not ready, skipping initialization');
      return null;
    }

    try {
      console.log('Echo: Initializing with Pusher client');
      return new Echo({
        broadcaster: 'pusher',
        client: PusherClient,
      });
    } catch (error) {
      console.log('Echo: Initialization failed', error);
      return null;
    }
  }, [PusherClient]);

  // Throttled version of getClean to prevent rate limiting
  const throttledGetClean = useCallback(() => {
    const now = Date.now();
    if (now - lastGetCleanCall.current < GET_CLEAN_THROTTLE_MS) {
      console.log('⏱️ getClean throttled, skipping call');
      return;
    }
    lastGetCleanCall.current = now;
    console.log('✅ Calling getClean');
    dispatch(getClean());
  }, [dispatch]);

  // Call getClean immediately on mount to sync messageCount from server
  // This ensures the persisted count is updated with the latest server value
  // (Messages may have arrived while the app was closed)
  useEffect(() => {
    // console.log(
    //   'Home: Mounting, calling getClean to sync messageCount from server',
    // );
    dispatch(getClean());
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      getLocation();
      throttledGetClean();
    }, [getLocation, throttledGetClean]),
  );

  useEffect(() => {
    dispatch(authenticated());
  }, [dispatch]);

  useFocusEffect(useCallback(() => {}, []));

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const token = await AsyncStorage.getItem('accessToken');
          setToken(token);
          if (!token) {
            dispatch(logOut());
          }
        } catch (error) {
          console.warn('getToken error:', error);
        }
      })();
    }, [dispatch]),
  );

  // 2. "HARD RESET" WHEN RETURNING TO APP
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      // If coming from background to active
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('⚡ App woke up.');
        // Use the centralized reset function
        triggerGPSReset();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
      // Geolocation.stopObserving();
    };
  }, [triggerGPSReset]); // Updated dependency

  // Listen for app state changes (background/foreground)
  // This ensures data refreshes when user returns to app after minimizing
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      console.log('AppState changed to:', nextAppState);

      if (nextAppState === 'active') {
        console.log('🔄 App became active, refreshing data...');

        // Refresh clean request data (respects 5-second throttle)
        throttledGetClean();

        // Optionally refresh location if user is online
        if (user?.online && location) {
          console.log('📍 Refreshing location for online user');
          getLocation();
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [throttledGetClean, user?.online, location, getLocation]);

  // Monitor Pusher connection state
  useEffect(() => {
    if (!PusherClient) {
      return;
    }

    const handleConnected = () => {
      console.log('WebSocket: Pusher connected');
      // setIsConnected(true);
    };

    const handleDisconnected = () => {
      console.log('WebSocket: Pusher disconnected');
      // setIsConnected(false);
    };

    const handleError = error => {
      console.log('WebSocket: Pusher connection error', error);
    };

    PusherClient.connection.bind('connected', handleConnected);
    PusherClient.connection.bind('disconnected', handleDisconnected);
    PusherClient.connection.bind('error', handleError);

    return () => {
      if (PusherClient && PusherClient.connection) {
        PusherClient.connection.unbind('connected', handleConnected);
        PusherClient.connection.unbind('disconnected', handleDisconnected);
        PusherClient.connection.unbind('error', handleError);
      }
    };
  }, [PusherClient]);

  useEffect(() => {
    if (!echo || !user?.id) {
      console.log('WebSocket: Echo or user not ready', {
        echo: !!echo,
        userId: user?.id,
      });
      return;
    }

    console.log(`WebSocket: Subscribing to private channel clean.${user.id}`);

    echo
      .private(`clean.${user.id}`)
      .listen('Clean', e => {
        // ========== DETAILED CLEAN REQUEST LOGGING ==========
        const now = new Date();
        console.log('🔔 ========== NEW CLEAN EVENT ==========');
        console.log('🔔 Device Time:', now.toISOString());
        console.log('🔔 Device Timestamp (ms):', now.getTime());
        console.log('🔔 Raw Event Data:', JSON.stringify(e, null, 2));

        if (e?.clean) {
          console.log('🔔 Clean Status:', e.clean?.status);
          console.log('🔔 Clean ID:', e.clean?.id || e.clean?.clean?.id);
          console.log('🔔 Server created_at:', e.clean?.created_at);
          console.log('🔔 Server timeOfMatch:', e.clean?.timeOfMatch);

          if (e.clean?.created_at) {
            const serverTime = new Date(e.clean.created_at);
            console.log('🔔 Server Time (parsed):', serverTime.toISOString());
            console.log('🔔 Server Timestamp (ms):', serverTime.getTime());
            console.log(
              '🔔 Time Diff (device - server):',
              now.getTime() - serverTime.getTime(),
              'ms',
            );
          }
        }
        console.log('🔔 ===========================================');
        // ========== END LOGGING ==========

        if (e?.user && e?.user?.name !== user?.name) {
          // dispatch(setRequestOppParty(e.user));
        }
        console.log('WebSocket: Received Clean event===> ', e);

        // if (!userCleanRequest && e?.clean?.clean && user?.online) {
        const rejectMsg = e?.clean?.reject?.message;
        setRejectMessage(rejectMsg);

        if (e?.clean?.clean?.clean_amend) {
          dispatch(setMyActiveClean(e?.clean));
        }

        if (e?.clean === null) {
          console.log('📵 WebSocket: Clean request CANCELLED by customer');
          dispatch(resetCleanRequest(e?.clean));
        } else if (e?.clean?.status === 10) {
          dispatch(resetEndCleanRequest(e?.clean));
        } else if (e?.clean?.clean) {
          // Always dispatch for unaccepted requests (status 0) to get a fresh 30s timer
          // Even if it's the same request ID, the server is giving us another chance
          if (e?.clean?.status === 0) {
            console.log(
              '🔔 WebSocket: Clean request received (status 0), refreshing timer',
            );
            console.log('🔔 Setting timeOfMatch to:', e.clean.created_at);
            dispatch(
              setMyCleanRequest({
                ...e.clean.clean,
                timeOfMatch: e.clean.created_at,
              }),
            );
          } else {
            // For accepted/in-progress requests, just refresh from API
            throttledGetClean();
          }
        } else {
          throttledGetClean();
        }
      })
      .error(e => {
        console.log('WebSocket: Channel subscription error', e);
      })
      .subscribed(() => {
        console.log(`WebSocket: Successfully subscribed to clean.${user.id}`);
      });

    // Also listen for user status updates (auto-offline feature)
    // This uses a separate private channel for user-specific events
    echo
      .private(`user.${user.id}`)
      .listen('UserStatusUpdated', e => {
        console.log('WebSocket: Received UserStatusUpdated event', e);

        // Update user's online status in Redux
        if (e?.online !== undefined) {
          dispatch(setUserOnlineStatus(e.online));

          // Show toast notification to user
          if (e.online === 0 || e.online === false) {
            showToast({
              type: 1,
              message: e?.message || t('home.taken_offline'),
            });
          }
        }
      })
      .subscribed(() => {
        console.log(`WebSocket: Successfully subscribed to user.${user.id}`);
      })
      .error(e => {
        console.log(`WebSocket: Error subscribing to user.${user.id}`, e);
      });

    return () => {
      console.log('WebSocket: Cleaning up, leaving channels');
      echo.leaveAllChannels();
    };
  }, [user?.id, user?.name, echo, dispatch, throttledGetClean]); // Only reconnect if user ID or Echo instance changes

  // Listen to chat messages to update messageCount
  useEffect(() => {
    if (!userCleanRequest?.id || !user?.id || !echo) {
      console.log('Chat listener: Missing requirements', {
        hasCleanRequest: !!userCleanRequest?.id,
        hasUser: !!user?.id,
        hasEcho: !!echo,
      });
      return;
    }

    console.log(
      `Chat listener: Setting up listener for chat.${userCleanRequest.id}`,
    );

    let chatChannel;
    let timeoutId;

    const setupListener = () => {
      try {
        chatChannel = echo.join(`chat.${userCleanRequest.id}`);

        chatChannel
          .here(users => {
            console.log('Chat listener: Users in channel', users?.length || 0);
          })
          .subscribed(() => {
            console.log(
              `Chat listener: ✅ Successfully subscribed to chat.${userCleanRequest.id}`,
            );
          })
          .listen('.chat.message', ({message, user: sender}) => {
            console.log('Chat listener: 📨 Message received!', {
              senderId: sender?.id,
              currentUserId: user?.id,
              messagePreview: message?.message?.substring(0, 50),
            });
            // Only increment if message is not from current user
            if (sender?.id !== user?.id) {
              console.log('Chat listener: ➕ Incrementing message count');
              dispatch(incrementMessageCount());
            } else {
              console.log(
                'Chat listener: ⏭️ Message from current user, skipping increment',
              );
            }
          })
          .error(e => {
            console.log('Chat listener: ❌ Error', e);
          });
      } catch (error) {
        console.log('Chat listener: ❌ Failed to set up', error);
      }
    };

    // Small delay to ensure echo is ready and Pusher is connected
    timeoutId = setTimeout(setupListener, 500);

    return () => {
      console.log(`Chat listener: 🧹 Cleaning up chat.${userCleanRequest.id}`);
      clearTimeout(timeoutId);
      if (chatChannel && echo) {
        try {
          echo.leave(`chat.${userCleanRequest.id}`);
        } catch (error) {
          console.log('Chat listener: Error leaving channel', error);
        }
      }
    };
  }, [userCleanRequest?.id, user?.id, echo, dispatch]);

  const reducedMotion = useReducedMotion();
  const renderBackdrop = useCallback(
    props => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        pressBehavior={'none'}
        animatedIndex={{
          value: 0,
        }}
      />
    ),
    [],
  );

  return (
    <>
      {loadingLocation && false ? (
        <ScreenContainer
          style={{
            flex: 1,
            width,
            height,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <ActivityIndicator size={'large'} />
        </ScreenContainer>
      ) : userCleanRequest ? (
        <CleanDetails
          latitude={location?.latitude}
          longitude={location?.longitude}
          rejectMessage={rejectMessage}
        />
      ) : (
        <ScreenContainer edges={['top']} style={{flex: 1, width, height}}>
          <GestureHandlerRootView style={{flex: 1, zIndex: 10}}>
            <Pressable
              onPress={() => Keyboard.dismiss()}
              style={{
                flex: 1,
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: '100%',
              }}>
              {location ? (
                <MapView
                  zoomControlEnabled={true}
                  zoomEnabled={true}
                  style={styles.mapStyle}
                  region={{
                    latitude: location?.latitude,
                    longitude: location?.longitude,
                    latitudeDelta: 0.0043,
                    longitudeDelta: 0.0034,
                  }}
                  customMapStyle={mapStyle}>
                  {user?.current_position && (
                    <Marker
                      coordinate={{
                        latitude: location?.latitude,
                        longitude: location?.longitude,
                      }}
                      title={t('home.my_location')}
                      description={t('home.marker_description')}
                    />
                  )}
                </MapView>
              ) : (
                // Show loading indicator while fetching location
                <View style={styles.mapLoadingContainer}>
                  <ActivityIndicator size="large" color={colors.primaryText} />
                  <Text
                    style={{
                      marginTop: 16,
                      color: colors.primaryText,
                      fontSize: 14,
                    }}
                    fontType={'roboto'}
                    center>
                    {loadingLocation
                      ? `${t('home.getting_location')}${
                          locationRetryCount > 0
                            ? ` (Retry ${locationRetryCount}/${MAX_LOCATION_RETRIES})`
                            : '...'
                        }`
                      : t('home.location_required_to_map')}
                  </Text>
                  {!loadingLocation && (
                    <TouchableOpacity
                      onPress={getLocation}
                      style={{
                        marginTop: 16,
                        paddingHorizontal: 20,
                        paddingVertical: 10,
                        backgroundColor: colors.secondaryBackground,
                        borderRadius: 8,
                      }}>
                      <Text
                        style={{color: colors.primaryText}}
                        fontType={'roboto'}
                        semibold>
                        {t('home.refresh_location')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </Pressable>
            <TouchableOpacity
              onPress={() => navigation.navigate('profile')}
              style={{
                position: 'absolute',
                zIndex: 0,
                top: 0,
                left: 0,
                width: 50,
                height: 50,
                borderRadius: 25,
                marginTop: 32,
                marginLeft: 20,

                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Image
                style={{height: 50, width: 50, borderRadius: 25}}
                source={{uri: user?.avatar}}
              />
            </TouchableOpacity>
            {/* <TouchableOpacity
        // onPress={() => navigation.navigate('profile')}
        style={{
          position: 'absolute',
          zIndex: 0,
          top: 0,
          right: 0,
          width: 50,
          height: 50,
          marginTop: 32,
          marginRight: 16,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        {user.site_country_id === 2 ? (
          <Image
            source={require('../../assets/media/images/naija.svg.png')}
            style={{width: 50, height: 25}}
          />
        ) : user.site_country_id === 1 ? (
          <Image
            source={require('../../assets/media/images/canada.png')}
            style={{width: 50, height: 25}}
          />
        ) : null}
      </TouchableOpacity> */}
            <BottomSheet
              enableDynamicSizing={false}
              ref={bottomSheetRef}
              index={0}
              backdropComponent={renderBackdrop}
              animateOnMount={!reducedMotion}
              // style={{position: 'relative'}}
              snapPoints={snapPoints}
              onChange={handleSheetChanges}>
              <Pressable
                style={{marginHorizontal: 18, paddingBottom: 8}}
                // onPress={() => bottomSheetRef.current.snapToIndex(1)}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    gap: 12,
                    height: 44,
                    alignItems: 'center',
                  }}>
                  <Text
                    color={'#0B071B'}
                    fontType={'roboto'}
                    semibold
                    style={{fontSize: 24}}>
                    {user?.online ? t('home.youre_online') : t('home.youre_offline')}
                  </Text>
                  <Blink />
                </View>
                {!user?.online &&
                  (user?.online_at ? (
                    <>
                      <Text
                        style={{
                          fontSize: 16,
                          marginBottom: 8,
                          color: '#777',
                        }}
                        semibold
                        fontType={'roboto'}>
                        {t('home.wont_receive_requests')}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.orangeDark,
                        }}
                        semibold
                        fontType={'roboto'}>
                        {t('home.last_seen_online')}{' '}
                        {user?.online_at?.endsWith('Z') &&
                        user?.online_at?.includes('T')
                          ? timeformatter(user?.online_at)
                          : user?.online_at}
                      </Text>
                    </>
                  ) : (
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.primaryText,
                      }}
                      center
                      semibold
                      fontType={'roboto'}>
                      {t('home.click_button_to_start')}
                    </Text>
                  ))}
              </Pressable>

              {user?.online &&
              user?.current_location &&
              user?.current_location !== '0' &&
              user?.current_location !== 0 &&
              user?.current_location.trim() !== '' ? (
                <View style={styles.detailsItemInner}>
                  <Text
                    color={'#525354'}
                    fontType={'roboto'}
                    style={{fontSize: 12}}>
                    {t('home.your_current_location')}
                  </Text>
                  <Text
                    numberOfLines={3}
                    color={'#0B071B'}
                    fontType={'roboto'}
                    semibold
                    style={{fontSize: 16}}>
                    {user?.current_location}
                  </Text>
                </View>
              ) : (
                <></>
              )}
              <Online
                handleGoOffline={handleGoOffline}
                handleGoOnline={() => handleGoOnline(location)}
                online={user?.online}
              />
            </BottomSheet>
            {showModal && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'transparent',
                }}>
                <Modal1
                  style={{
                    position: 'relative',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    top: 0,
                    height: 'auto',
                    paddingVertical: 30,
                    justifyContent: 'space-evenly',
                    minHeight: 350,
                    alignItems: 'center',
                  }}
                  setShowModal={setShowModal}>
                  <View
                    style={{
                      alignItems: 'center',
                      gap: 20,
                      width: '75%',
                    }}>
                    <Image
                      style={{height: 90}}
                      resizeMode="contain"
                      source={require('../../assets/media/icons/success.png')}
                    />
                    <Text style={{fontSize: 20, color: '#252525'}} center bold>
                      {t('home.matched_with_user')}
                    </Text>
                  </View>
                  <Button
                    text={t('common.ok')}
                    pressed={ProceedToVeiwRequestDetails}
                    height={52}
                    style={{width: '80%'}}
                  />
                </Modal1>
              </View>
            )}
          </GestureHandlerRootView>
        </ScreenContainer>
      )}
    </>
  );
};

export default Home;

const styles = StyleSheet.create({
  mainContainer: {
    height: '100%',
    width: '100%',
    paddingTop: 20,
    paddingHorizontal: 18,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  mapStyle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,

    bottom: 80,
    // bottom: 0,
  },
  detailsItemInner: {
    gap: 4,
    marginVertical: 8,
    marginHorizontal: 18,
    width: '80%',
  },
  mapLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
