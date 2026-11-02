import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  Dimensions,
  Keyboard,
  Pressable,
  Alert,
  AppState,
  Linking,
  Platform,
  Clipboard,
} from 'react-native';
import ScreenContainer from '../../components/Shared/ScreenContainer';
import {showToast} from '../../utils/showToast';
import {colors} from '../../config/colors';
import {getClean} from '../../store/actions/dashboard/getClean';
import {acceptClean} from '../../store/actions/dashboard/acceptClean';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import MapView, {Marker} from 'react-native-maps';
import timeformatter from '../../utils/timeformatter';
import {useDispatch, useSelector} from 'react-redux';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import BottomSheet, {BottomSheetScrollView} from '@gorhom/bottom-sheet';
import Text from '../../components/Shared/Text';
import Button from '../../components/Shared/Button';
import AntDesign from '@react-native-vector-icons/ant-design';
import FontAwesome from '@react-native-vector-icons/fontawesome';
import {resetCleanRequest} from '../../store/reducer/userSlice';
import {rejectClean} from '../../store/actions/dashboard/rejectClean';
import CleanDeepDetails from './CleanDeepDetails';
import CleanDetailsButtons from './CleanDetailsButtons';
import JobSiteBanner from '../../components/Dashboard/JobSiteBanner';
import JobSiteDisclosure from '../../components/Dashboard/JobSiteDisclosure';
import MapViewDirections from 'react-native-maps-directions';
import ImageView from 'react-native-image-viewing';
const {width, height} = Dimensions.get('window');
import {getDistance, getPreciseDistance} from 'geolib';
import {
  formatDistance,
  originDriftThresholdM,
} from '../../utils/distanceDisplay';
import {timeElapsed} from '../../utils/timeElapsed';
// useCountdownTimer hook removed - using direct timer implementation instead
import {useTranslation} from 'react-i18next';

const CleanDetails = ({latitude, longitude, rejectMessage}) => {
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const GOOGLE_MAPS_APIKEY = 'AIzaSyDn0UxJc8Jvk-e_mAabhB1F_AQynS9y3g0';

  const acceptedCleanRequest = useSelector(
    state => state.user.acceptedCleanRequest,
  );
  const data = useSelector(state => state.user.cleanRequest);

  // cleanRequest can be a Clean model (data.user = customer) or a Cleaner model
  // (data.user = cleaner's own user, data.clean.user = customer). Try both paths.
  const customerUser = data?.clean?.user ?? data?.user ?? null;

  const [viewerVisible, setViewerVisible] = useState(false);
  const [distanceKm, setDistanceInKm] = useState(null);
  // Set when Directions can't produce a route at all. The ETA and the distance both come
  // from that one result, so if it fails there is nothing honest to put in the row.
  const [routeFailed, setRouteFailed] = useState(false);
  // Throttled origin for the driving directions/ETA: it only moves when the cleaner actually
  // progresses, so the route + distance/time don't recompute on every 10 m / 5 s GPS tick
  // (that per-tick recompute, plus a second distance writer below, was the "blink"). The live
  // map marker still uses the raw latitude/longitude, so it keeps animating smoothly.
  const [directionsOrigin, setDirectionsOrigin] = useState(null);
  const lastOriginRef = useRef(null);

  const handleAddressPress = () => {
    const address = data?.location;
    if (!address) return;
    
    const query = encodeURIComponent(address);
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
    });

    Linking.openURL(url).catch(err => {
      console.warn('Cannot open map URL:', err);
      // Fallback to Google Maps web URL if native scheme fails
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
      Linking.openURL(googleMapsUrl).catch(() => 
        showToast({type: 0, message: t('common.error')})
      );
    });
  };

  const handleAddressLongPress = () => {
    if (!data?.location) return;
    Clipboard.setString(data?.location);
    showToast({type: 1, message: t('cleanerDashboard.address_copied')});
  };

  // Commit a new directions origin only when the cleaner has drifted a meaningful distance, so
  // the route/ETA (and the distance/time text) don't recompute on every GPS fix. The threshold
  // tightens on final approach so the number doesn't freeze over the last stretch.
  useEffect(() => {
    if (!latitude || !longitude || acceptedCleanRequest?.status !== 1) return;
    const next = {latitude, longitude};
    if (
      !lastOriginRef.current ||
      getPreciseDistance(lastOriginRef.current, next) >=
        originDriftThresholdM(distanceKm)
    ) {
      lastOriginRef.current = next;
      setDirectionsOrigin(next);
    }
  }, [latitude, longitude, acceptedCleanRequest?.status, distanceKm]);
  const _timeOfMatch = acceptedCleanRequest?.created_at || data?.timeOfMatch

  const {
    user,
    cleanRequest,
    activeAmend,
    // walkThroughState, // Fix for wrongly managed global state
    localTimeRequestCameIn,
    arrivedState,
    serverTimeOffset, // Offset between server and device time for accurate timer
    cleanStartedState,
    amendStartedAt,
    amendState,
  } = useSelector(state => state.user);

  // Fix for wrongly managed global state
  const [walkThroughState, setWalkThroughState] = useState(
    cleanRequest?.images_time?.start,
  );
  useEffect(() => {
    setWalkThroughState(cleanRequest?.images_time?.start);
  }, [cleanRequest?.images_time?.start]);

  const mapStyle = [];

  const [time, setTime] = useState({
    min: '00',
    sec: '30'
  });
  const [timeDis, setTimeDis] = useState({
    min: '00',
    sec: '00',
  });

  const [workingTimer, setWorkingTimer] = useState({});
  const [timeinterval, setTimeinterval] = useState();

  // Arrived timer state (5 minute countdown)
  const [arrivedTimer, setArrivedTimer] = useState({ min: '05', sec: '00' });
  const arrivedTimerFormatted = `${arrivedTimer.min}:${arrivedTimer.sec}`;
  
  // Initialize walkThroughTimer - must come after walkThroughState is defined
  const [walkThroughTimer, setWalkThroughTimer] = useState(() => {
    // Use data (cleanRequest) directly since walkThroughState isn't set yet on first render
    const initialWalkThroughState = data?.images_time?.start;
    
    // Safely initialize timer - handle null/undefined
    if (!initialWalkThroughState) {
      return {hr: '00', min: '00', sec: '00'};
    }
    
    const walkThroughDate = new Date(initialWalkThroughState);
    // Check if date is valid
    if (isNaN(walkThroughDate.getTime())) {
      return {hr: '00', min: '00', sec: '00'};
    }
    
    const elapsed = new Date() - walkThroughDate;
    const hr = Math.floor((elapsed / (1000 * 60 * 60)) % 24);
    const min = Math.floor((elapsed / (1000 * 60)) % 60);
    const sec = Math.floor((elapsed / 1000) % 60);
    
    return {
      hr: hr < 10 ? `0${hr}` : String(hr),
      min: min < 10 ? `0${min}` : String(min),
      sec: sec < 10 ? `0${sec}` : String(sec),
    };
  });

  const [walkThroughTimerTimeinterval, setWalkThroughTimerTimeinterval] =
    useState();

  const activeSnapPoints = useMemo(() => ['45%', '75%', '100%'], []);
  const snapPoints = useMemo(() => [210, 210], []);

  // callbacks
  const handleSheetChanges = useCallback(index => {}, []);

  const showRejectAlert = () => {
    if (rejectMessage != null) {
      Alert.alert(rejectMessage, null, [
        {
          text: t('common.cancel'),
          style: 'default',
        },
        {
          text: t('common.continue'),
          onPress: handleReject,
          style: 'destructive',
        },
      ]);
    } else {
      handleReject();
    }
  };

  const handleReject = () => {
    const payload = {
      id: data?.id,
      status: 2,
    };
    dispatch(rejectClean({payload, navigation}));
  };

  const handleAccept = () => {
    clearInterval(timeinterval);
    setTimeinterval(null);
    const payload = {
      id: data?.id,
      status: 1,
    };
    dispatch(acceptClean({payload, navigation}));
  };

  // Walkthrough timer - counts UP from start time
  // Uses serverTimeOffset to sync with server time (handles clock skew)
  useEffect(() => {
    let _timeinterval;
    
    if (!walkThroughState && walkThroughTimerTimeinterval) {
      clearInterval(walkThroughTimerTimeinterval);
      setWalkThroughTimerTimeinterval(null);
    } else if (walkThroughState) {
      _timeinterval = setInterval(() => {
        // Use offset-adjusted time to sync with server clock
        const deviceNow = new Date().getTime();
        const adjustedNow = deviceNow + (serverTimeOffset || 0);
        let elapsed = adjustedNow - new Date(walkThroughState).getTime();
        
        // Clamp to 0 if still negative (shouldn't happen with correct offset)
        if (elapsed < 0) elapsed = 0;
        
        const checkHr = Math.floor((elapsed / (1000 * 60 * 60)) % 24);
        const checkMin = Math.floor((elapsed / (1000 * 60)) % 60);
        const checkSec = Math.floor((elapsed / 1000) % 60);

        const hrStr = checkHr > 300 ? '--' : checkHr < 10 ? `0${checkHr}` : checkHr;
        const minStr = checkMin > 300 ? '--' : checkMin < 10 ? `0${checkMin}` : checkMin;
        const secStr = checkSec > 300 ? '--' : checkSec < 10 ? `0${checkSec}` : checkSec;

        setWalkThroughTimer({
          hr: hrStr,
          min: minStr,
          sec: secStr,
        });
        setWalkThroughTimerTimeinterval(_timeinterval);
      }, 1000);
    }
    return () => clearInterval(walkThroughTimerTimeinterval);
  }, [walkThroughState, serverTimeOffset]);

  // Arrived timer - 5 minute countdown from arrivedState
  // Uses serverTimeOffset to sync with server time (handles clock skew)
  useEffect(() => {
    let _interval;
    
    if (arrivedState && acceptedCleanRequest?.status === 3 && !walkThroughState) {
      // Calculate remaining time using offset-adjusted "now"
      // adjustedNow = deviceTime + offset = serverTime (approximately)
      const calcRemaining = () => {
        const deviceNow = new Date().getTime();
        const adjustedNow = deviceNow + (serverTimeOffset || 0);
        const start = new Date(arrivedState).getTime();
        const limitMs = 5 * 60 * 1000; // 5 minutes
        let remaining = limitMs - (adjustedNow - start);
        if (remaining < 0) remaining = 0;
        if (remaining > limitMs) remaining = limitMs;
        return remaining;
      };
      
      // Set initial value immediately
      const initial = calcRemaining();
      const initMin = Math.floor(initial / 60000);
      const initSec = Math.floor((initial % 60000) / 1000);
      setArrivedTimer({
        min: initMin < 10 ? `0${initMin}` : String(initMin),
        sec: initSec < 10 ? `0${initSec}` : String(initSec),
      });
      
      // Start interval
      _interval = setInterval(() => {
        const remaining = calcRemaining();
        const min = Math.floor(remaining / 60000);
        const sec = Math.floor((remaining % 60000) / 1000);
        setArrivedTimer({
          min: min < 10 ? `0${min}` : String(min),
          sec: sec < 10 ? `0${sec}` : String(sec),
        });
      }, 1000);
    } else {
      // Reset to full duration when not active
      setArrivedTimer({ min: '05', sec: '00' });
    }
    
    return () => clearInterval(_interval);
  }, [arrivedState, acceptedCleanRequest?.status, walkThroughState, serverTimeOffset]);

  const handleGoToChat = () => {
    navigation.navigate('chatroom');
  };

  // Counts UP from t4, matching the customer app and the elapsed time the cancellation fee
  // is calculated from. It previously counted DOWN against the estimate, which meant the
  // cleaner saw a different number from the customer under the same label, and saw 00:00:00
  // once they passed the estimate.
  useEffect(() => {
    if (!cleanStartedState) {
      setWorkingTimer({hr: '00', min: '00', sec: '00'});
      return;
    }

    const tick = () => {
      const now = new Date(Date.now() + (serverTimeOffset || 0));
      const elapsedMs = Math.max(0, now - new Date(cleanStartedState));
      const totalSeconds = Math.floor(elapsedMs / 1000);
      const hr = Math.floor(totalSeconds / 3600);
      const min = Math.floor((totalSeconds % 3600) / 60);
      const sec = totalSeconds % 60;

      setWorkingTimer({
        hr: hr < 10 ? `0${hr}` : `${hr}`,
        min: min < 10 ? `0${min}` : `${min}`,
        sec: sec < 10 ? `0${sec}` : `${sec}`,
      });
    };

    tick();
    const _timeinterval = setInterval(tick, 1000);

    return () => clearInterval(_timeinterval);
  }, [cleanStartedState, serverTimeOffset]);

  useEffect(() => {
    console.log('localTimeRequestCameIn changed===>', localTimeRequestCameIn);
  }, [localTimeRequestCameIn]);

  // useEffect(() => {
  //   let _timeinterval;
  //   console.log('localTimeRequestCameIn===>', localTimeRequestCameIn);
  //   if (
  //     !acceptedCleanRequest &&
  //     localTimeRequestCameIn &&
  //     (new Date() - new Date(localTimeRequestCameIn)) / 1000 < 31
  //   ) {
  //   _timeinterval = setInterval(() => {
  //     const current = new Date();
  //     // Use robust remaining time calculation to handle API clock skew
  //     const limitMs = 30 * 1000;
  //     const elapsed = current - new Date(localTimeRequestCameIn);
  //     let remainingMs = limitMs - elapsed;
      
  //     // Handle clock skew (if future start time)
  //     if (remainingMs > limitMs) remainingMs = limitMs;
  //     // Handle expiration
  //     if (remainingMs < 0) remainingMs = 0;

  //     const checkSec = Math.floor(remainingMs / 1000);

  //     setTime({
  //       sec: checkSec < 10 ? `0${checkSec}` : checkSec,
  //     });
  //   }, 1000);

  //   setTimeinterval(_timeinterval);
  //   }
  //   return () => clearInterval(_timeinterval);
  // }, [data, acceptedCleanRequest, localTimeRequestCameIn]);




// Helper function to calculate time
const calculateRemainingTime = (startTime) => {
    if (!startTime) return 0;
    const limitMs = 31 * 1000;
    const elapsed = new Date() - new Date(startTime);
    const remaining = limitMs - elapsed;
    return Math.max(0, Math.floor(remaining / 1000));
};

useEffect(() => {
    console.log('🔄 Timer useEffect triggered, localTimeRequestCameIn:', localTimeRequestCameIn);
    // 1. Immediate Calculation on Mount (Fixes the initial delay)
    const initialSeconds = calculateRemainingTime(localTimeRequestCameIn);
    setTime({ sec: initialSeconds < 10 ? `0${initialSeconds}` : initialSeconds });

    // If time is already up, don't start interval
    if (initialSeconds <= 0 && localTimeRequestCameIn) {
      console.log('initialSeconds==>', initialSeconds)
      console.log('🔄 Timer expired, dispatching resetCleanRequest');
       // Optional: Handle expiration immediately here
        dispatch(resetCleanRequest()); 
       return;
    }

    let _timeinterval;

    if (!acceptedCleanRequest && localTimeRequestCameIn) {
        
        // 2. The Interval
        _timeinterval = setInterval(() => {
            const checkSec = calculateRemainingTime(localTimeRequestCameIn);
            setTime({
                sec: checkSec < 10 ? `0${checkSec}` : checkSec,
            });
            
            // Clear if time is up
            if (checkSec <= 0) {
                clearInterval(_timeinterval);
                dispatch(resetCleanRequest());
            }
        }, 1000);
    }

    // 3. AppState Listener (Handles minimizing/maximizing)
    const subscription = AppState.addEventListener('change', nextAppState => {
        if (nextAppState === 'active') {
             // Force an immediate update when app wakes up
             const freshSec = calculateRemainingTime(localTimeRequestCameIn);
             setTime({ sec: freshSec < 10 ? `0${freshSec}` : freshSec });
             
             // If time is up when app wakes, clear the request
             if (freshSec <= 0 && localTimeRequestCameIn) {
                 dispatch(resetCleanRequest());
             }
        }
    });

    return () => {
        clearInterval(_timeinterval);
        subscription.remove();
    };
}, [localTimeRequestCameIn, acceptedCleanRequest]);

  useEffect(() => {
    if (
      timeinterval &&
      (new Date() - new Date(localTimeRequestCameIn)) / 1000 > 31
    ) {
      setTime({
        sec: '00',
      });
      clearInterval(timeinterval);
      setTimeinterval(null);
      if (!acceptedCleanRequest) {
        dispatch(resetCleanRequest());
      }
    }
  }, [time, walkThroughTimer]);

  // Refresh data only when truly needed to avoid overwriting fresh WebSocket data
  // WebSocket updates happen in real-time in Home.jsx, so we only need to fetch
  // when there's no data (e.g., cold start, or after logout/navigation)
  useFocusEffect(
    useCallback(() => {
      // Only fetch if we don't have current data
      // This prevents stale API responses from overwriting fresh WebSocket updates
      if (!data && !acceptedCleanRequest) {
        console.log('🔄 CleanDetails: No existing data, fetching from API...');
        dispatch(getClean());
      } else {
        console.log('✅ CleanDetails: Using existing data (WebSocket or cached)');
      }
    }, [dispatch, data, acceptedCleanRequest])
  );

  return (
    <ScreenContainer
      key={data?.id}
      style={{flex: 1, width, height}}>
      <GestureHandlerRootView style={{flex: 1, zIndex: 10}}>
        <Pressable
          onPress={() => Keyboard.dismiss()}
          style={{
            flex: 1,
            position: 'relative',
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '100%',
          }}>
          {data?.position?.lat &&
            data?.position?.lng &&
            latitude &&
            longitude && (
              <MapView
                zoomControlEnabled={true}
                zoomEnabled={true}
                style={styles.mapStyle}
                region={{
                  latitude: data?.position?.lat,
                  longitude: data?.position?.lng,
                  latitudeDelta: 0.0043,
                  longitudeDelta: 0.0034,
                }}
                customMapStyle={mapStyle}>
                <Marker
                  coordinate={{
                    latitude: latitude,
                    longitude: longitude,
                  }}
                  title={t('home.my_location')}
                  description={t('home.marker_description')}
                />
                {acceptedCleanRequest?.status === 1 &&
                  latitude &&
                  longitude && (
                    <>
                      <Marker
                        coordinate={{
                          latitude: data?.position?.lat,
                          longitude: data?.position?.lng,
                        }}
                        title={"Client's location"}
                        description={t('home.marker_description')}
                      />
                      <MapViewDirections
                        strokeColor={colors.brandPrimary}
                        strokeWidth={10}
                        timePrecision={'now'}
                        optimizeWaypoints={true}
                        onReady={result => {
                          // ONE source for both halves of the row: result.distance is
                          // already km and result.duration already minutes, so the pair is
                          // always internally consistent and matches the customer app.
                          // Do NOT reintroduce a straight-line writer here — two writers
                          // racing into distanceKm is what caused BUG-1001. (The row is
                          // gated to status 1 and unmounts on arrival, so a road distance
                          // never needs to count down to zero.)
                          setRouteFailed(false);
                          setDistanceInKm(result?.distance);
                          setTimeDis({
                            min: parseInt(result?.duration).toFixed(),
                            sec: parseInt(
                              (result?.duration * 60) % 60,
                            ).toFixed(),
                          });
                        }}
                        onError={errorMessage => {
                          console.log('Directions error:', errorMessage);
                          setRouteFailed(true);
                        }}
                        precision={'high'}
                        origin={directionsOrigin || {latitude, longitude}}
                        destination={{
                          latitude: data?.position?.lat,
                          longitude: data?.position?.lng,
                        }}
                        apikey={GOOGLE_MAPS_APIKEY}
                      />
                    </>
                  )}
              </MapView>
            )}
        </Pressable>
        <TouchableOpacity
          onPress={() => navigation.navigate('profile')}
          style={{
            position: 'absolute',
            zIndex: 0,
            top: 5,
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
    {/* here */}

    <BottomSheet
          enableDynamicSizing={false}
          index={1}
          style={{backgroundColor: 'transparent'}}
          snapPoints={data ? activeSnapPoints : snapPoints}
          onChange={handleSheetChanges}>
          <BottomSheetScrollView contentContainerStyle={styles.mainContainer}>
            {data ? (
              <View style={[styles.detailsItem, {borderTopWidth: 0, gap: 4}]}>
                {acceptedCleanRequest?.status === 1 && !routeFailed && (
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 12,
                      marginBottom: 8,
                    }}>
                    {distanceKm == null ? (
                      <Text
                        fontType={'roboto'}
                        bold
                        style={{fontSize: 20, color: colors.brandPrimary}}>
                        {t('cleanDetails.distance_calculating')}
                      </Text>
                    ) : (
                      <>
                        <Text
                          fontType={'roboto'}
                          bold
                          style={{fontSize: 20, color: colors.brandPrimary}}>
                          {(() => {
                            const min = parseInt(timeDis?.min || 0, 10);
                            const sec = parseInt(timeDis?.sec || 0, 10);
                            const hours = Math.floor(min / 60);
                            const remainingMin = min % 60;

                            if (hours > 0) {
                              return `${hours} hr${
                                hours > 1 ? 's' : ''
                              } ${remainingMin} min`;
                            } else if (min >= 1) {
                              return `${min} min${sec > 0 ? ` ${sec} sec` : ''}`;
                            } else {
                              return `${sec} sec`;
                            }
                          })()}
                        </Text>
                        <View
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: colors.brandPrimary,
                          }}></View>
                        <Text
                          fontType={'roboto'}
                          bold
                          style={{fontSize: 20, color: colors.brandPrimary}}>
                          {formatDistance(distanceKm)}
                        </Text>
                      </>
                    )}
                  </View>
                )}
                <Text
                  color={'#0B071B'}
                  fontType={'roboto'}
                  semibold
                  center
                  style={{fontSize: 20}}>
                  {acceptedCleanRequest?.status === 3 && walkThroughState
                    ? t('cleanerDashboard.walk_through_in_progress')
                    : acceptedCleanRequest?.status === 4
                    ? t('cleanerDashboard.cleaning_in_progress')
                    : t('cleanerDashboard.you_have_cleaning_request')}
                </Text>
                <View style={[styles.detailsItem, {borderTopWidth: 0, gap: 4}]}>
                  {customerUser ? (
                    <View
                      style={[
                        styles.detailsItem,
                        {
                          borderTopWidth: 0,
                          gap: 12,
                          flexDirection: 'row',
                          alignItems: 'center',
                        },
                      ]}>
                      <TouchableOpacity onPress={() => setViewerVisible(true)}>
                        <Image
                          style={{height: 50, width: 50, borderRadius: 25}}
                          source={{uri: customerUser?.avatar}}
                        />
                      </TouchableOpacity>
                      <View style={{gap: 4, flex: 1}}>
                        <Text
                          color={'#525354'}
                          fontType={'roboto'}
                          style={{fontSize: 12}}>
                          {t('cleanerDashboard.customer_name')}
                        </Text>
                        <Text
                          color={'#0B071B'}
                          fontType={'roboto'}
                          capitalized
                          semibold
                          style={{fontSize: 16}}>
                          {customerUser?.first_name ?? customerUser?.name ?? 'Customer'}
                        </Text>

                        {customerUser?.rating ? (
                          <View
                            style={{
                              alignItems: 'center',
                              flexDirection: 'row',
                              gap: 4,
                            }}>
                            <View
                              style={{
                                flexDirection: 'row',
                                gap: 2,
                                alignItems: 'center',
                              }}>
                              {[1, 2, 3, 4, 5].map(index => (
                                <View key={index}>
                                  <FontAwesome
                                    style={{color: '#F8C22E'}}
                                    name={
                                      index <= customerUser?.rating
                                        ? 'star'
                                        : 'star-o'
                                    }
                                    size={18}
                                  />
                                </View>
                              ))}
                            </View>
                            <Text
                              fontType={'roboto'}
                              bold
                              style={{fontSize: 20}}>
                              {customerUser?.rating}
                            </Text>
                          </View>
                        ) : (
                          <></>
                        )}
                      </View>
                      <ImageView
                        images={[{uri: customerUser?.avatar}]}
                        imageIndex={0}
                        visible={viewerVisible}
                        onRequestClose={() => setViewerVisible(false)}
                      />
                    </View>
                  ) : (
                    <></>
                  )}
                  <Text
                    color={'#525354'}
                    fontType={'roboto'}
                    style={{fontSize: 12}}>
                    {t('cleanerDashboard.cleaning_location_address')}
                  </Text>
                  <TouchableOpacity
                    onPress={handleAddressPress}
                    onLongPress={handleAddressLongPress}
                    activeOpacity={0.7}>
                    <Text
                      color={'#0B071B'}
                      fontType={'roboto'}
                      semibold
                      style={{fontSize: 16, textDecorationLine: 'underline'}}>
                      {data?.location}
                    </Text>
                  </TouchableOpacity>
                  <Text
                    color={'#525354'}
                    fontType={'roboto'}
                    style={{fontSize: 12}}>
                    {timeformatter(data?.created_at)}
                  </Text>
              {acceptedCleanRequest ? (
                    <>
                      <Text
                        color={'#525354'}
                        fontType={'roboto'}
                        style={{fontSize: 12}}>
                        {t('cleanerDashboard.accepted_clean_info')}{' '}
                        <Text
                          color={'#0B071B'}
                          fontType={'roboto'}
                          semibold
                          style={{fontSize: 16}}>
                          1{' '}
                        </Text>
                        of{' '}
                        <Text
                          color={'#0B071B'}
                          fontType={'roboto'}
                          semibold
                          style={{fontSize: 16}}>
                          {data?.cleaners}{' '}
                        </Text>
                        {t('cleanerDashboard.of_cleaners')}
                      </Text>
                      {acceptedCleanRequest?.status === 3 &&
                        !walkThroughState && (
                          <Text
                            color={'#525354'}
                            fontType={'roboto'}
                            style={{fontSize: 12}}>
                            {t('cleanerDashboard.arrived_timer')}{' '}
                            <Text
                              color={'#0B071B'}
                              fontType={'roboto'}
                              semibold
                              style={{fontSize: 16}}>
                              {arrivedTimerFormatted}
                            </Text>
                          </Text>
                        )}

                      {acceptedCleanRequest?.status === 4 && (
                        <Text
                          color={'#525354'}
                          fontType={'roboto'}
                          style={{fontSize: 12}}>
                          {t('cleanerDashboard.work_timer')}{' '}
                          <Text
                            color={'#0B071B'}
                            fontType={'roboto'}
                            semibold
                            style={{fontSize: 16}}>
                            {`${workingTimer.hr}:${workingTimer.min}:${workingTimer.sec}`}
                          </Text>
                        </Text>
                      )}
                      {acceptedCleanRequest?.status === 3 &&
                        walkThroughState && (
                          <Text
                            color={'#525354'}
                            fontType={'roboto'}
                            style={{fontSize: 12}}>
                            {t('cleanerDashboard.walk_through_timer')}{' '}
                            <Text
                              color={'#0B071B'}
                              fontType={'roboto'}
                              semibold
                              style={{fontSize: 16}}>
                              {`${walkThroughTimer.hr}:${walkThroughTimer.min}:${walkThroughTimer.sec}`}
                            </Text>
                          </Text>
                        )}
                      {((acceptedCleanRequest?.clean?.clean_amend &&
                        acceptedCleanRequest?.clean?.clean_amend?.status !==
                          0) ||
                        (activeAmend && activeAmend?.status !== 0)) && (
                        <Text
                          color={colors.brandPrimary}
                          fontType={'roboto'}
                          semibold
                          style={{fontSize: 16}}>
                          {acceptedCleanRequest?.clean?.clean_amend?.status ===
                            1 || activeAmend?.status === 1 ? (
                            t('cleanerDashboard.amend_accepted')
                          ) : acceptedCleanRequest?.clean?.clean_amend
                              ?.status === 2 || activeAmend?.status === 2 ? (
                            t('cleanerDashboard.amend_rejected')
                          ) : (
                            <></>
                          )}
                        </Text>
                      )}
                    </>
                  ) : (
                    <Text
                      color={'#525354'}
                      fontType={'roboto'}
                      style={{fontSize: 12}}>
                      {t('cleanDetails.time_remaining')}{' '}
                      <Text
                        color={'#0B071B'}
                        fontType={'roboto'}
                        semibold
                        style={{fontSize: 16}}>
                        {`00:${time.sec}`}
                      </Text>
                    </Text>
                  )}
                </View>
                {acceptedCleanRequest ? (
                  <Button
                    text={t('cleanerDashboard.chat')}
                    pressed={handleGoToChat}
                    height={52}
                    style={{
                      width: '100%',
                      // backgroundColor: '#D6293E',
                      borderRadius: 8,
                      marginVertical: 16,
                    }}
                    customEndAdornment={true}
                  />
                ) : (
                  <View style={styles.btnContainer}>
                    <Button
                      text={t('cleanerDashboard.accept')}
                      pressed={handleAccept}
                      height={52}
                      style={{
                        width: '47%',
                        backgroundColor: '#0CBC87',
                        borderRadius: 8,
                        marginVertical: 16,
                      }}
                    />
                    <Button
                      text={t('cleanerDashboard.reject')}
                      pressed={showRejectAlert}
                      height={52}
                      style={{
                        width: '47%',
                        backgroundColor: '#D6293E',
                        borderRadius: 8,
                        marginVertical: 16,
                      }}
                    />
                  </View>
                )}

                <CleanDeepDetails />

                <JobSiteBanner />

                <CleanDetailsButtons />
              </View>
            ) : (
              <View
                style={[
                  {
                    borderTopWidth: 0,
                    gap: 4,
                  },
                ]}>
                <Text
                  color={'#0B071B'}
                  fontType={'roboto'}
                  semibold
                  center
                  style={{fontSize: 20}}>
                  {t('cleanerDashboard.active_requests_placeholder')}
                </Text>
              </View>
            )}
          </BottomSheetScrollView>
        </BottomSheet>
      </GestureHandlerRootView>
      <JobSiteDisclosure />
    </ScreenContainer>
  );
};

export default CleanDetails;

const styles = StyleSheet.create({
  mainContainer: {
    paddingTop: 20,
    paddingHorizontal: 18,
    paddingBottom: 100,
  },

  mapStyle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 80,
    // bottom: 0,
  },

  detailsItem: {
    gap: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderColor,
  },

  btnContainer: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
});
