import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import ImageView from 'react-native-image-viewing';
import {useDispatch, useSelector} from 'react-redux';
import Text from '../Shared/Text';
import Button from '../Shared/Button';
import FontAwesome from '@react-native-vector-icons/fontawesome';
import {acceptClean} from '../../store/actions/dashboard/acceptClean';
import {rejectClean} from '../../store/actions/dashboard/rejectClean';
import {colors} from '../../config/colors';
import timeformatter, {calcTime} from '../../utils/timeformatter';
import {useTranslation} from 'react-i18next';

const TIMEOUT_SECONDS = 30;
const {height: SCREEN_HEIGHT} = Dimensions.get('window');

const DetailCell = ({label, value}) => (
  <View style={styles.detailsItemInner}>
    <Text color={'#525354'} fontType={'roboto'} style={{fontSize: 12}}>
      {label}
    </Text>
    <Text color={'#0B071B'} fontType={'roboto'} semibold style={{fontSize: 16}}>
      {value ?? '—'}
    </Text>
  </View>
);

const BlockingRequestModal = () => {
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const cleanRequest = useSelector(state => state.user.cleanRequest);
  const acceptedCleanRequest = useSelector(
    state => state.user.acceptedCleanRequest,
  );
  const pending = useSelector(state => state.user.pending);

  const [secondsLeft, setSecondsLeft] = useState(TIMEOUT_SECONDS);
  const [actionTaken, setActionTaken] = useState(false);
  const [avatarVisible, setAvatarVisible] = useState(false);
  const intervalRef = useRef(null);

  const visible = !!cleanRequest && !acceptedCleanRequest;

  useEffect(() => {
    if (!visible) {
      setActionTaken(false);
      return;
    }
    setSecondsLeft(TIMEOUT_SECONDS);
    setActionTaken(false);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [cleanRequest?.id, visible]);

  const handleAccept = () => {
    setActionTaken(true);
    clearInterval(intervalRef.current);
    dispatch(
      acceptClean({payload: {id: cleanRequest?.id, status: 1}, navigation: null}),
    );
  };

  const showRejectAlert = () => {
    Alert.alert(
      t('cleanerDashboard.cancel_clean_confirm'),
      null,
      [
        {text: t('common.no'), style: 'cancel'},
        {
          text: t('common.yes'),
          style: 'destructive',
          onPress: () => {
            setActionTaken(true);
            clearInterval(intervalRef.current);
            dispatch(
              rejectClean({
                payload: {id: cleanRequest?.id, status: 2},
                navigation: null,
              }),
            );
          },
        },
      ],
    );
  };

  const handleAddressPress = () => {
    const address = cleanData?.location ?? '';
    if (!address) return;
    const query = encodeURIComponent(address);
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
    });
    Linking.openURL(url).catch(() =>
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`),
    );
  };

  // cleanRequest can be the Clean model directly or a Cleaner record with nested clean
  const nestedClean = cleanRequest?.clean;
  const cleanData = nestedClean ?? cleanRequest;
  const formattedCleanData =
    cleanData?.clean_amend?.status === 1
      ? cleanData.clean_amend
      : cleanData?.clean_amend_oldest?.status === 1
      ? cleanData.clean_amend_oldest
      : cleanData;

  const customerUser = nestedClean?.user ?? cleanRequest?.user ?? null;
  const location = cleanData?.location ?? '';
  const createdAt = cleanData?.created_at ?? null;
  const secStr = secondsLeft < 10 ? `0${secondsLeft}` : `${secondsLeft}`;

  return (
    <>
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {}}
      statusBarTranslucent
      hardwareAccelerated>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>

            {/* Title */}
            <Text
              color={'#0B071B'}
              fontType={'roboto'}
              semibold
              center
              style={{fontSize: 20}}>
              {t('cleanerDashboard.you_have_cleaning_request')}
            </Text>

            <View style={[styles.detailsItem, {borderTopWidth: 0, gap: 4}]}>
              {/* Customer */}
              {customerUser ? (
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                  <TouchableOpacity onPress={() => customerUser?.avatar && setAvatarVisible(true)} activeOpacity={0.8}>
                    <Image
                      style={{height: 60, width: 60, borderRadius: 30, backgroundColor: '#E0E0E0'}}
                      source={customerUser?.avatar ? {uri: customerUser.avatar} : require('../../assets/media/images/cleaning.png')}
                    />
                  </TouchableOpacity>
                  <View style={{gap: 4, flex: 1}}>
                    <Text color={'#525354'} fontType={'roboto'} style={{fontSize: 12}}>
                      {t('cleanerDashboard.customer_name')}
                    </Text>
                    <Text color={'#0B071B'} fontType={'roboto'} capitalized semibold style={{fontSize: 16}}>
                      {customerUser?.first_name ?? customerUser?.name ?? 'Customer'}
                    </Text>
                    {customerUser?.rating ? (
                      <View style={{flexDirection: 'row', gap: 4, alignItems: 'center'}}>
                        {[1, 2, 3, 4, 5].map(i => (
                          <FontAwesome
                            key={i}
                            style={{color: '#F8C22E'}}
                            name={i <= customerUser.rating ? 'star' : 'star-o'}
                            size={14}
                          />
                        ))}
                        <Text fontType={'roboto'} bold style={{fontSize: 14}}>
                          {customerUser.rating}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              ) : null}

              {/* Address */}
              <Text color={'#525354'} fontType={'roboto'} style={{fontSize: 12}}>
                {t('cleanerDashboard.cleaning_location_address')}
              </Text>
              <TouchableOpacity onPress={handleAddressPress} activeOpacity={0.7}>
                <Text color={'#0B071B'} fontType={'roboto'} semibold style={{fontSize: 16, textDecorationLine: 'underline'}}>
                  {location}
                </Text>
              </TouchableOpacity>

              {createdAt ? (
                <Text color={'#525354'} fontType={'roboto'} style={{fontSize: 12}}>
                  {timeformatter(createdAt)}
                </Text>
              ) : null}

              {/* Countdown — stops immediately when action taken */}
              {!actionTaken ? (
                <Text color={'#525354'} fontType={'roboto'} style={{fontSize: 12}}>
                  {t('cleanDetails.time_remaining')}{' '}
                  <Text
                    color={secondsLeft <= 10 ? '#C61E2D' : '#0B071B'}
                    fontType={'roboto'}
                    semibold
                    style={{fontSize: 16}}>
                    {`00:${secStr}`}
                  </Text>
                </Text>
              ) : null}
            </View>

            {/* Accept / Reject */}
            {actionTaken || pending ? (
              <ActivityIndicator size="large" color={colors.brandPrimary} style={{marginVertical: 20}} />
            ) : (
              <View style={styles.btnContainer}>
                <Button
                  text={t('cleanerDashboard.accept')}
                  pressed={handleAccept}
                  height={52}
                  style={{width: '47%', backgroundColor: '#0CBC87', borderRadius: 8, marginVertical: 16}}
                />
                <Button
                  text={t('cleanerDashboard.reject')}
                  pressed={showRejectAlert}
                  height={52}
                  style={{width: '47%', backgroundColor: '#D6293E', borderRadius: 8, marginVertical: 16}}
                />
              </View>
            )}

            {/* Type, Cleaners, Pay, Time */}
            <View style={[styles.detailsItem, styles.detailsItemQuantity]}>
              <DetailCell label={t('cleanerDashboard.type_of_cleaning')} value={cleanData?.clean_type?.name} />
              <DetailCell label={t('cleanerDashboard.no_of_cleaners')} value={cleanData?.cleaners} />
              <DetailCell
                label={t('cleanerDashboard.estimated_pay')}
                value={`${cleanData?.country?.currency ?? 'CAD $'} ${Number(cleanData?.estimated_clean_duration_amount ?? 0).toFixed(2)}`}
              />
              <DetailCell label={t('cleanerDashboard.estimated_time')} value={calcTime(formattedCleanData?.duration)} />
            </View>

            {/* Rooms — full breakdown, matching the standard request details */}
            <View style={[styles.detailsItem, styles.detailsItemQuantity]}>
              <DetailCell label={t('cleanDetails.bedrooms')} value={formattedCleanData?.bedrooms} />
              <DetailCell label={t('cleanDetails.washrooms')} value={formattedCleanData?.washrooms} />
              <DetailCell label={t('cleanDetails.kitchens')} value={formattedCleanData?.kitchens} />
              <DetailCell label={t('cleanDetails.other_rooms')} value={formattedCleanData?.otherrooms} />
              <DetailCell label={t('cleanDetails.living_family_rooms')} value={formattedCleanData?.livingrooms} />
              <DetailCell label={t('cleanDetails.dinning_rooms')} value={formattedCleanData?.dinningrooms} />
              <DetailCell label={t('cleanDetails.laundry_rooms')} value={formattedCleanData?.laundryrooms} />
              <DetailCell label={t('cleanDetails.office_den_rooms')} value={formattedCleanData?.officerooms} />
            </View>

            {/* Extras */}
            <View style={[styles.detailsItem, styles.detailsItemQuantity]}>
              <View style={{width: '100%'}}>
                <Text fontType={'roboto'} bold style={{fontSize: 14}}>
                  {t('cleanDetails.extras_header')}
                </Text>
              </View>
              <DetailCell label={t('cleanDetails.refrigerator')} value={formattedCleanData?.extras?.refridgerator} />
              <DetailCell label={t('cleanDetails.stove')} value={formattedCleanData?.extras?.stove} />
              <DetailCell label={t('cleanDetails.dish_washer')} value={formattedCleanData?.extras?.dish_washer} />
              <DetailCell label={t('cleanDetails.microwave')} value={formattedCleanData?.extras?.microwave} />
            </View>

            {/* Note — always shown so the cleaner sees the customer's instructions */}
            <View style={styles.detailsItem}>
              <DetailCell label={t('cleanerDashboard.note')} value={formattedCleanData?.notes} />
            </View>

          </ScrollView>
        </View>
      </View>
    </Modal>

    <ImageView
      images={[{uri: customerUser?.avatar}]}
      imageIndex={0}
      visible={avatarVisible}
      onRequestClose={() => setAvatarVisible(false)}
    />
    </>
  );
};

export default BlockingRequestModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    height: SCREEN_HEIGHT * 0.75,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 8,
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 18,
    paddingBottom: 40,
  },
  detailsItem: {
    gap: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderColor,
  },
  detailsItemInner: {
    gap: 4,
    flex: 1,
    minWidth: 130,
  },
  detailsItemQuantity: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  btnContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
});
