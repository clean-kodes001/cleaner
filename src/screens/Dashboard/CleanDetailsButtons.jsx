import React, {useState, useEffect, useMemo} from 'react';
import {StyleSheet, View, Alert, Text} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import {colors} from '../../config/colors';
import {cancelClean} from '../../store/actions/dashboard/cancelClean';
import {useDispatch, useSelector} from 'react-redux';
import Button from '../../components/Shared/Button';
import {endClean} from '../../store/actions/dashboard/endClean';
import {arrive} from '../../store/actions/dashboard/arrive';
import {start} from '../../store/actions/dashboard/start';
import {rejectWalkthrouh} from '../../store/actions/dashboard/handleRejectWalkthrouh';
import {useNavigation} from '@react-navigation/native';
import {beginWalkThrough} from '../../store/actions/dashboard/beginWalkThrough';
import useGeofence from '../../hooks/useGeofence';
import {postLocationSample} from '../../store/actions/dashboard/postLocationSample';
import {useTranslation} from 'react-i18next';

const CleanDetailsButtons = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();

  const data = useSelector(state => state.user.cleanRequest);
  const {
    cleanRequest,
    // walkThroughState, // Fix for wrongly managed global state
    arrivedState,
  } = useSelector(state => state.user);

  const dispatch = useDispatch();
  const acceptedCleanRequest = useSelector(
    state => state.user.acceptedCleanRequest,
  );
  const photoUploads = useSelector(state => state.user.photoUploads);
  const livePosition = useSelector(state => state.user.livePosition);

  const unfinishedPhotos = useMemo(
    () =>
      Object.values(photoUploads || {}).filter(
        entry => entry.status === 'uploading' || entry.status === 'failed',
      ),
    [photoUploads],
  );

  // Memoize serviceLocation to prevent unnecessary re-renders
  // Only recreate the object when lat/lng actually change
  const serviceLocation = useMemo(() => {
    const lat = acceptedCleanRequest?.clean?.position?.lat;
    const lng = acceptedCleanRequest?.clean?.position?.lng;

    if (lat && lng) {
      return {lat, lng};
    }
    return null;
  }, [
    acceptedCleanRequest?.clean?.position?.lat,
    acceptedCleanRequest?.clean?.position?.lng,
  ]);

  const {isWithinRange, hasFix} = useGeofence(serviceLocation);

  // Fix for wrongly managed global state
  const [walkThroughState, setWalkThroughState] = useState(
    cleanRequest?.images_time?.start,
  );
  useEffect(() => {
    setWalkThroughState(cleanRequest?.images_time?.start);
  }, [cleanRequest?.images_time?.start]);

  const confirmEndClean = () => {
    Alert.alert(t('cleanerDashboard.end_clean_confirm'), null, [
      {
        text: t('common.no'),
        style: 'default',
      },
      {
        text: t('common.yes'),
        onPress: () => showImageCapturedAlert('end'),
        style: 'destructive',
      },
    ]);
  };

  const handleEndCleanInit = () => {
    if (unfinishedPhotos.length > 0) {
      Alert.alert(
        t('cleanerDashboard.photos_unfinished_title'),
        t('cleanerDashboard.photos_unfinished_body', {
          count: unfinishedPhotos.length,
        }),
        [
          {
            text: t('common.cancel'),
            style: 'cancel',
          },
          {
            // Deferred for the same reason as showImageCapturedAlert: an Alert
            // chained synchronously from another Alert's onPress never renders
            // on Android.
            text: t('cleanerDashboard.end_anyway'),
            onPress: () => setTimeout(confirmEndClean, 300),
            style: 'destructive',
          },
        ],
      );
      return;
    }
    confirmEndClean();
  };

  // Anchors the trail at the moment the job actually ends. Deliberately here rather than in
  // handleEndCleanInit: a cleaner who backs out of the unfinished-photos warning has not
  // ended anything, and must not leave an "ended" sample behind.
  const sampleStatusChange = () => {
    if (!acceptedCleanRequest?.id) return;

    dispatch(
      postLocationSample({
        id: acceptedCleanRequest.id,
        lat: livePosition?.lat ?? null,
        lng: livePosition?.lng ?? null,
        accuracy_m:
          livePosition?.accuracy != null
            ? Math.round(livePosition.accuracy)
            : null,
        source: 'status_change',
      }),
    );
  };

  const handleEndClean = () => {
    sampleStatusChange();

    const payload = {
      id: acceptedCleanRequest?.id,
      status: 7,
      review_rating: 0,
      review_comment: null,
      comments: '',
    };

    dispatch(endClean({payload, navigation}));
  };

  const handleCancelInit = () => {
    Alert.alert(t('cleanerDashboard.cancel_clean_confirm'), null, [
      {
        text: t('common.no'),
        style: 'default',
      },
      {
        text: t('common.yes'),
        onPress: () => showImageCapturedAlert('cancel'),
        style: 'destructive',
      },
    ]);
  };

  const showImageCapturedAlert = action => {
    // Defer so Android reliably renders this second dialog after the first
    // (end/cancel) confirmation finishes dismissing. Chaining Alert.alert
    // synchronously from another Alert's onPress fails to show on Android,
    // which made the cleaner tap "End" repeatedly with nothing happening.
    setTimeout(() => {
      Alert.alert(
        t('cleanerDashboard.photo_check_prompt'),
        null,
        [
          {
            text: t('common.no'),
            style: 'default',
          },
          {
            text: t('common.yes'),
            onPress: () => (action == 'end' ? handleEndClean() : handleCancel()),
            style: 'destructive',
          },
        ],
      );
    }, 300);
  };

  const handleCancel = () => {
    const payload = {
      id: acceptedCleanRequest?.id,
      status: 5,
      review_rating: 0,
      review_comment: null,
    };
    dispatch(cancelClean({payload, navigation}));
  };

  const handleStart = () => {
    sampleStatusChange();

    const payload = {
      id: acceptedCleanRequest?.id,
      status: 4,
    };
    dispatch(start({payload, navigation}));
  };
  const handleAmend = () => {
    navigation.navigate('amend', {
      id: acceptedCleanRequest?.id,
      status: 10,
      data:
        data?.clean_amend?.status === 1
          ? data?.clean_amend
          : data?.clean_amend_oldest?.status === 1
          ? data?.clean_amend_oldest
          : data,
      // data: data?.clean_amend || data,
    });
  };

  const handleCancelAccepted = () => {
    Alert.alert(t('cleanerDashboard.cancel_clean_confirm'), null, [
      {text: t('common.no'), style: 'default'},
      {
        text: t('common.yes'),
        style: 'destructive',
        onPress: () => {
          const payload = {
            id: acceptedCleanRequest?.id,
            status: 2,
            review_rating: 0,
            review_comment: null,
          };
          dispatch(cancelClean({payload, navigation}));
        },
      },
    ]);
  };

  const handleArrive = () => {
    const payload = {
      id: acceptedCleanRequest?.id,
      status: 3,
    };
    dispatch(arrive({payload, navigation}));
  };

  const startWalkThrough = () => {
    const startTime = new Date();

    const formData = new FormData();
    formData.append('status', acceptedCleanRequest.status);
    formData.append('images_time', 'start');

    dispatch(
      beginWalkThrough({
        navigation,
        data: formData,
        type: 'start',
      }),
    );
    // dispatch(initiateWalkThorugh(startTime));
  };

  const confirmRejectWalkthrouh = () => {
    const payload = {
      id: acceptedCleanRequest?.id,
      status: 5,
    };
    dispatch(rejectWalkthrouh({payload, navigation}));
  };

  const handleRejectWalkthrouh = () => {
    Alert.alert(t('cleanerDashboard.cancel_clean_confirm'), null, [
      {
        text: t('common.no'),
        style: 'default',
      },
      {
        text: t('common.yes'),
        onPress: () => confirmRejectWalkthrouh(),
        style: 'destructive',
      },
    ]);
  };

  switch (acceptedCleanRequest?.status) {
    case 10:
    case 9:
    case 8:
    case 7:
    case 6:
    case 5:
    case 2:
      return <></>;
    case 1:
      return (
        <>
          {!isWithinRange && (
            // Before the first fix lands this must read "locating…", not "you are not at the
            // property" — the cleaner may be standing in the right place with no GPS yet.
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: hasFix ? '#FFEBEE' : '#EEEEEE',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                marginBottom: 0,
                alignSelf: 'flex-start',
              }}>
              <Ionicons
                name="information-circle"
                size={16}
                color={hasFix ? 'red' : '#525354'}
                style={{marginRight: 6}}
              />
              <Text
                fontType={'roboto'}
                style={{fontSize: 12, color: hasFix ? 'red' : '#525354'}}>
                {hasFix
                  ? t('cleanerDashboard.not_within_service_area')
                  : t('cleanerDashboard.locating')}
              </Text>
            </View>
          )}
          <Button
            text={t('cleanerDashboard.arrive')}
            pressed={handleArrive}
            height={52}
            style={{
              width: '100%',
              backgroundColor: colors.brandGreen,
              borderRadius: 8,
              marginVertical: 8,
            }}
          />
          <Button
            text={t('cleanerDashboard.cancel')}
            pressed={handleCancelAccepted}
            height={52}
            style={{
              width: '100%',
              backgroundColor: colors.orangeDark,
              borderRadius: 8,
              marginVertical: 8,
            }}
          />
        </>
      );
    case 3:
      return walkThroughState ? (
        <>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <Button
              text={t('cleanerDashboard.start')}
              pressed={handleStart}
              height={52}
              style={{
                width: '47%',
                backgroundColor: colors.brandGreen,
                borderRadius: 8,
                marginVertical: 8,
              }}
            />
            <Button
              text={t('cleanerDashboard.amend')}
              disabled={acceptedCleanRequest?.clean?.amend_count >= 3}
              pressed={handleAmend}
              height={52}
              style={{
                width: '47%',
                backgroundColor: colors.brandPurple,
                borderRadius: 8,
                marginVertical: 8,
              }}
            />
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <Button
              text={t('cleanerDashboard.cancel')}
              pressed={handleRejectWalkthrouh}
              height={52}
              style={{
                width: '100%',
                backgroundColor: colors.orangeDark,
                borderRadius: 8,
                marginVertical: 8,
              }}
            />
          </View>
        </>
      ) : (
        <>
          <Button
            text={t('cleanerDashboard.start_walk_through')}
            pressed={startWalkThrough}
            height={52}
            style={{
              width: '100%',
              backgroundColor: colors.brandGreen,
              borderRadius: 8,
              marginVertical: 16,
            }}
          />
          {(() => {
            // Check if arrivedState exists before calculating
            // const isDisabled = arrivedState
            //   ? (new Date() - new Date(arrivedState)) / 1000 / 60 < 5
            //   : false;
            const isDisabled = false;
            return (
              <Button
                disabled={isDisabled}
                text={t('cleanerDashboard.cancel')}
                pressed={handleRejectWalkthrouh}
                height={52}
                style={{
                  width: '100%',
                  backgroundColor: colors.orangeDark,
                  opacity: isDisabled ? 0.5 : 1,
                  borderRadius: 8,
                  marginVertical: 8,
                }}
              />
            );
          })()}
        </>
      );
    case 4:
      return (
        <>
          <View
            style={{
              // flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <Button
              text={t('cleanerDashboard.cancel')}
              pressed={handleCancelInit}
              height={52}
              style={{
                width: '100%',
                borderRadius: 8,
                backgroundColor: colors.orangeDark,
                marginVertical: 16,
              }}
            />
            <Button
              // disabled={
              //   parseInt(
              //     (new Date() - new Date(acceptedCleanRequest?.status_time?.t4)) /
              //       1000,
              //   ) < data?.duration
              // }
              text={t('cleanerDashboard.end')}
              pressed={handleEndCleanInit}
              height={52}
              style={{
                width: '100%',
                backgroundColor: colors.brandGreen,
                borderRadius: 8,
                marginVertical: 8,
              }}
            />
          </View>
        </>
      );
    default:
      return <></>;
  }
};

export default CleanDetailsButtons;

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
    // bottom: -25,
    bottom: 0,
  },
});
