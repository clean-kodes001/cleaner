import React, {useState} from 'react';
import Text from '../../components/Shared/Text';
import {StyleSheet, View, Pressable, ScrollView, Image} from 'react-native';
import {colors} from '../../config/colors';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import DetailsItem from './DetailsItem';
import timeformatter, {calcTime} from '../../utils/timeformatter';
import {
  getCleanerAmountEarned,
  CLEANER_PAYOUT_ELIGIBLE_STATUSES,
} from '../../utils/cleanerEarnings';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import FontAwesome from '@react-native-vector-icons/fontawesome';
import {useTranslation} from 'react-i18next';

const HistoryItem = ({clean, type}) => {
  const {t} = useTranslation();
  const item = clean.clean;
  const {user} = useSelector(state => state.user);
  const navigation = useNavigation();
  const [showAmendments, setShowAmendments] = useState(false);
  const amendments = Array.isArray(item?.clean_amends)
    ? item.clean_amends
    : item?.clean_amend
    ? [item.clean_amend]
    : [];
  const amendmentsCount = amendments?.length || item?.amend_count || 0;
  const acceptedAmendments = amendments.filter(amend => amend?.status === 1);
  const latestAcceptedAmendment = acceptedAmendments
    .slice()
    .sort((a, b) => {
      const aTime = new Date(a?.updated_at || a?.created_at || 0).getTime();
      const bTime = new Date(b?.updated_at || b?.created_at || 0).getTime();
      return aTime - bTime;
    })
    .at(-1);
  const requestDetails = latestAcceptedAmendment || item;
  const cleanerAmount = latestAcceptedAmendment
    ? Number.isFinite(Number(item?.cleaner_amount))
      ? item?.cleaner_amount
      : latestAcceptedAmendment?.potential_cleaner_amount
    : item?.original_cleaner_amount;
  const requestPrice =
    requestDetails === item
      ? item?.original_cleaner_amount
      : requestDetails?.potential_cleaner_amount;

  // clean.status here is this row's own Cleaner assignment status, not the parent
  // Clean's status — a cancelled/reassigned/declined assignment must show $0 even if
  // the clean itself was later completed by a different cleaner.
  const amountEarned = getCleanerAmountEarned(clean?.status, item?.amount_earned);

  // Same eligibility gate as amountEarned: a cancelled/ignored/reassigned
  // assignment row must never show the tip, even if it still carries a value.
  const showTip =
    CLEANER_PAYOUT_ELIGIBLE_STATUSES.includes(clean?.status) &&
    clean?.tip_amount != null;

  const formatMoney = amount => {
    const value = Number(amount);
    if (Number.isFinite(value)) {
      return `${user.site_country.currency} ${value.toFixed(2)}`;
    }
    return `${user.site_country.currency} 0.00`;
  };

  const getAmendStatusLabel = status => {
    if (status === 1) {
      return {text: t('history.amend_status_accepted'), bg: '#E8FFF3', color: '#0B7A4B'};
    }
    if (status === 2) {
      return {text: t('history.amend_status_declined'), bg: '#FFECEE', color: '#C61E2D'};
    }
    return {text: t('history.amend_status_pending'), bg: '#F1F2F4', color: '#525354'};
  };

  const renderAmendmentCard = (amendment, index) => {
    const statusMeta = getAmendStatusLabel(amendment?.status);

    return (
      <View
        key={amendment?.id || index}
        style={{
          borderWidth: 1,
          borderColor: '#E5E5E7',
          borderRadius: 12,
          padding: 12,
          backgroundColor: '#fff',
        }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}>
          <Text
            color={'#000'}
            fontType={'roboto'}
            semibold
            style={{fontSize: 14}}>
            {t('history.amend_number')}{index + 1}
          </Text>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
              backgroundColor: statusMeta.bg,
            }}>
            <Text
              fontType={'roboto'}
              style={{fontSize: 12, color: statusMeta.color}}>
              {statusMeta.text}
            </Text>
          </View>
        </View>

        <View style={styles.detailsItemInner}>
          <DetailsItem
            title={t('history.created')}
            value={timeformatter(amendment?.created_at)}
          />
          <DetailsItem
            title={t('history.updated')}
            value={timeformatter(amendment?.updated_at)}
          />
        </View>

        <View style={[styles.detailsItemInner, {marginTop: 10}]}>
          <DetailsItem
            title={t('history.duration')}
            value={calcTime(amendment?.duration)}
          />
          <DetailsItem
            title={t('history.price')}
            value={formatMoney(amendment?.potential_cleaner_amount)}
          />
        </View>

        <View style={[styles.detailsItemInner, {marginTop: 10}]}>
          <DetailsItem title={t('history.bedrooms')} value={amendment?.bedrooms} />
          <DetailsItem title={t('history.washrooms')} value={amendment?.washrooms} />
        </View>
        <View style={[styles.detailsItemInner, {marginTop: 10}]}>
          <DetailsItem title={t('history.kitchens')} value={amendment?.kitchens} />
          <DetailsItem title={t('history.other_rooms')} value={amendment?.otherrooms} />
        </View>
        <View style={[styles.detailsItemInner, {marginTop: 10}]}>
          <DetailsItem title={t('history.living_family_rooms')} value={amendment?.livingrooms} />
          <DetailsItem
            title={t('history.dinning_rooms')}
            value={amendment?.dinningrooms}
          />
        </View>
        <View style={[styles.detailsItemInner, {marginTop: 10}]}>
          <DetailsItem
            title={t('history.laundry_rooms')}
            value={amendment?.laundryrooms}
          />
          <DetailsItem title={t('history.office_den_rooms')} value={amendment?.officerooms} />
        </View>
        <View style={[styles.detailsItemInner, {marginTop: 10}]}>
          <DetailsItem
            title={t('history.extras_fridge')}
            value={amendment?.extras?.refridgerator}
          />
          <DetailsItem
            title={t('history.extras_stove')}
            value={amendment?.extras?.stove}
          />
        </View>
        <View style={[styles.detailsItemInner, {marginTop: 10}]}>
          <DetailsItem
            title={t('history.extras_dishwasher')}
            value={amendment?.extras?.dish_washer}
          />
          <DetailsItem
            title={t('history.extras_microwave')}
            value={amendment?.extras?.microwave}
          />
        </View>

        {amendment?.ammendment_comment ? (
          <View style={{marginTop: 14}}>
            <Text color={'#525354'} fontType={'roboto'} style={{fontSize: 12}}>
              {t('history.comment')}
            </Text>
            <Text
              color={'#0B071B'}
              fontType={'roboto'}
              semibold
              style={{fontSize: 16, marginTop: 4}}>
              {amendment?.ammendment_comment}
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  const calculateDuration = () => {
    const t4 = clean?.status_time?.t4;
    if (t4) {
      const t7 = clean?.status_time?.t7;
      const startDate = new Date(t4);
      const endDate = t7 ? new Date(t7) : new Date(item?.updated_at);

      const diffInMillis = Math.max(0, endDate - startDate);
      const seconds = Math.floor(diffInMillis / 1000);

      let value;
      if (seconds < 60) {
        value = `${seconds} seconds`;
      } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        value = `${minutes} minute(s) and ${remainingSeconds} seconds`;
      } else {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        value = `${hours} hour(s), ${minutes} minutes`;
      }
      return {label: t('history.actual_time'), value};
    }

    return {
      label: t('history.est_duration'),
      value: calcTime(
        requestDetails === item ? item?.duration : requestDetails?.duration,
      ),
    };
  };

  const handleDisplayImages = currentIndex => {
    const _images = item?.images_link?.map(image => {
      return {
        uri: image,
      };
    });

    navigation.navigate('viewimages', {
      images: _images,
      type: 1,
      startIndex: currentIndex,
    });
  };
  const renderImages = (uri, index) => {
    return (
      <Pressable key={index} onPress={() => handleDisplayImages(index)}>
        <Image source={{uri: uri}} style={{width: 90, height: 70}} />
      </Pressable>
    );
  };

  const getCancellationStage = statusTime => {
    if (!statusTime) return null;
    if (statusTime.t4) return t('history.stage_during_cleaning');
    if (statusTime.t3) return t('history.stage_after_arrival');
    if (statusTime.t1) return t('history.stage_after_matching');
    return null;
  };

  const getTimeCleaning = (statusTime, updatedAt) => {
    const t4 = statusTime?.t4;
    if (!t4) return null;
    const t5 = statusTime?.t5;
    const start = new Date(t4);
    const end = new Date(t5 || updatedAt);
    const diffMs = Math.max(0, end - start);
    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const cancelledStatuses = [5, 6, 9];
  const cancellationStage = cancelledStatuses.includes(item?.status)
    ? getCancellationStage(clean?.status_time)
    : null;
  const cancellationTimeSpent =
    cancellationStage === t('history.stage_during_cleaning')
      ? getTimeCleaning(clean?.status_time, item?.updated_at ?? clean?.updated_at)
      : null;
  const cancelledBy =
    item?.cancelled_by === 'user'
      ? t('history.cancelled_by_user')
      : item?.cancelled_by === 'cleaner'
      ? t('history.cancelled_by_cleaner')
      : null;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Pressable
        disabled={type ? true : false}
        onPress={() => {
          navigation.navigate('historydetails', {data: clean});
        }}
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          backgroundColor: '#fff',
          paddingVertical: 16,
          paddingHorizontal: 20,
          borderRadius: 12,
          marginTop: 12,
        }}>
        <View
          style={{
            display: 'flex',

            flex: 1,
            gap: 12,
          }}>
          <View>
            {type === 2 && (
              <Text
                color={'#000'}
                bold
                fontType={'roboto'}
                style={{fontSize: 18, paddingBottom: 20}}>
                {item.clean_amend?.status === 1 ? `${t('history.final_request_details')} ` : ''}{t('history.request_details_suffix')}
              </Text>
            )}
            <Text
              numberOfLines={!type ? 1 : null}
              fontType={'roboto'}
              style={{
                fontSize: 16,
                //  color: '#161d29'
                marginBottom: 4,
              }}>
              {requestDetails?.location}
            </Text>

            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
            <View
              style={{
                backgroundColor:
                  clean.status === 5 ||
                  clean.status === 6 ||
                  clean.status === 7 ||
                  clean.status === 9 ||
                  clean.status === 2 ||
                  clean.status === 8
                    ? colors.inActiveFaded
                    : colors.activeFaded,
                padding: 4,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 8,
                width: 80,
              }}>
              <Text
                fontType={'roboto'}
                style={{
                  width: 'auto',
                  fontSize: 12,
                  color:
                    clean.status === 5 ||
                    clean.status === 6 ||
                    clean.status === 7 ||
                    clean.status === 9 ||
                    clean.status === 2 ||
                    clean.status === 8
                      ? colors.inActive
                      : colors.active,
                }}>
                {clean.status === 0
                  ? t('history.status_pending')
                  : clean.status === 1
                  ? t('history.status_active')
                  : clean.status === 2
                  ? t('history.status_rejected')
                  : clean.status === 3
                  ? t('history.status_arrived')
                  : clean.status === 4
                  ? t('history.status_started')
                  : clean.status === 5 || clean.status === 6
                  ? t('history.status_cancelled')
                  : clean.status === 7 || clean.status === 10
                  ? t('history.status_ended')
                  : clean.status === 8
                  ? t('history.status_ignored')
                  : clean.status === 9
                  ? t('history.status_user_cancelled')
                  : clean.status === 11
                  ? t('history.status_amended')
                  : clean.status === 12
                  ? t('history.status_cancelled')
                  : t('history.status_unknown')}
              </Text>
            </View>
            {showTip && (
              <View
                style={{
                  backgroundColor: '#E8FFF3',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                }}>
                <Text fontType={'roboto'} style={{fontSize: 12, color: '#0B7A4B'}}>
                  {t('history.tip')} +{formatMoney(clean.tip_amount)}
                </Text>
              </View>
            )}
            </View>
          </View>
          <View style={styles.detailsItemInner}>
            <DetailsItem
              title={t('history.occurrence')}
              value={item?.occrence ? t('history.re_occurring') : t('history.once')}
            />
            {(() => {
              const {label, value} = calculateDuration();
              return <DetailsItem title={label} value={value} />;
            })()}
          </View>
          <View style={styles.detailsItemInner}>
            <DetailsItem
              title={t('history.amount')}
              value={formatMoney(type === 2 ? requestPrice : cleanerAmount)}
            />
            <DetailsItem
              title={t('history.amount_earned')}
              value={formatMoney(amountEarned)}
            />
            {type === 2 && showTip && (
              <DetailsItem
                title={t('history.tip')}
                value={formatMoney(clean.tip_amount)}
              />
            )}
          </View>
          {type === 2 && (
            <>
              <View style={styles.detailsItemInner}>
                <DetailsItem
                  title={t('history.type_of_cleaning')}
                  value={requestDetails?.clean_type?.name}
                />
                <DetailsItem title={t('history.cleaners')} value={item?.cleaners} />
              </View>
              <View style={styles.detailsItemInner}>
                <DetailsItem
                  title={t('history.bedrooms')}
                  value={requestDetails?.bedrooms}
                />
                <DetailsItem
                  title={t('history.washrooms')}
                  value={requestDetails?.washrooms}
                />
              </View>
              <View style={styles.detailsItemInner}>
                <DetailsItem
                  title={t('history.kitchens')}
                  value={requestDetails?.kitchens}
                />
                <DetailsItem
                  title={t('history.other_rooms')}
                  value={requestDetails?.otherrooms}
                />
              </View>
              <View style={styles.detailsItemInner}>
                <DetailsItem
                  title={t('history.living_family_rooms')}
                  value={requestDetails?.livingrooms}
                />
                <DetailsItem
                  title={t('history.dinning_rooms')}
                  value={requestDetails?.dinningrooms}
                />
              </View>
              <View style={styles.detailsItemInner}>
                <DetailsItem
                  title={t('history.laundry_rooms')}
                  value={requestDetails?.laundryrooms}
                />
                <DetailsItem
                  title={t('history.office_den_rooms')}
                  value={requestDetails?.officerooms}
                />
              </View>
            </>
          )}
          <View style={styles.detailsItemInner}>
            <DetailsItem
              title={t('history.creation_date')}
              value={timeformatter(item?.created_at)}
            />
            {/* <DetailsItem
          title={t('history.first_booking_date')}
          value={'Thu Sep 28 2023 - 1:00:00 PM'}
        /> */}
          </View>
        </View>
        {!type ? (
          <MaterialCommunityIcons
            name="chevron-right"
            color={'#444'}
            size={26}
          />
        ) : (
          <></>
        )}
      </Pressable>
      {type === 2 ? (
        <>
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              backgroundColor: '#fff',
              paddingVertical: 16,
              paddingHorizontal: 20,
              borderRadius: 12,
              marginTop: 12,
            }}>
            <View
              style={{
                display: 'flex',

                flex: 1,
                gap: 12,
              }}>
              <View style={styles.detailsItemInner}>
                <DetailsItem
                  title={t('history.extras_fridge')}
                  value={requestDetails?.extras?.refridgerator}
                />
                <DetailsItem
                  title={t('history.extras_stove')}
                  value={requestDetails?.extras?.stove}
                />
              </View>

              <View style={styles.detailsItemInner}>
                <DetailsItem
                  title={t('history.extras_dishwasher')}
                  value={requestDetails?.extras?.dish_washer}
                />
                <DetailsItem
                  title={t('history.extras_microwave')}
                  value={requestDetails?.extras?.microwave}
                />
              </View>

              <View style={styles.detailsItemInner}>
                <DetailsItem
                  title={t('history.creation_date')}
                  value={timeformatter(item?.created_at)}
                />
              </View>

              <View style={styles.DetailsPairInner}>
                <DetailsItem title={t('history.notes')} value={requestDetails?.notes} />
              </View>
            </View>
          </View>

          {cancellationStage != null && cancelledBy != null && (
            <View
              style={{
                width: '100%',
                backgroundColor: '#fdecef',
                paddingVertical: 16,
                paddingHorizontal: 20,
                borderRadius: 12,
                marginTop: 12,
                gap: 12,
              }}>
              <Text
                color={'#c0392b'}
                bold
                fontType={'roboto'}
                style={{fontSize: 16}}>
                {t('history.cancellation_stage')}
              </Text>
              <View style={styles.detailsItemInner}>
                <DetailsItem
                  title={t('history.cancelled_by')}
                  value={cancelledBy}
                />
                <DetailsItem
                  title={t('history.cancellation_stage')}
                  value={cancellationStage}
                />
              </View>
              {cancellationTimeSpent != null && (
                <View style={styles.detailsItemInner}>
                  <DetailsItem
                    title={t('history.time_cleaning')}
                    value={cancellationTimeSpent}
                  />
                  <View style={{flex: 1}} />
                </View>
              )}
            </View>
          )}

          {amendmentsCount > 0 && (
            <View
              style={{
                width: '100%',
                backgroundColor: '#fff',
                paddingVertical: 16,
                paddingHorizontal: 20,
                borderRadius: 12,
                marginTop: 12,
              }}>
              <Pressable
                onPress={() => setShowAmendments(prev => !prev)}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <Text
                  color={'#000'}
                  bold
                  fontType={'roboto'}
                  style={{fontSize: 18}}>
                  {t('history.amendments_heading')} ({amendmentsCount})
                </Text>
                <MaterialCommunityIcons
                  name={showAmendments ? 'chevron-up' : 'chevron-down'}
                  color={'#444'}
                  size={26}
                />
              </Pressable>

              {showAmendments ? (
                <View style={{marginTop: 16, gap: 12}}>
                  {amendments
                    .slice()
                    .sort((a, b) => {
                      const aTime = new Date(
                        a?.created_at || a?.updated_at || 0,
                      ).getTime();
                      const bTime = new Date(
                        b?.created_at || b?.updated_at || 0,
                      ).getTime();
                      return aTime - bTime;
                    })
                    .map(renderAmendmentCard)}

                  {latestAcceptedAmendment ? (
                    <View
                      style={{
                        borderWidth: 1,
                        borderColor: '#E5E5E7',
                        borderRadius: 12,
                        padding: 12,
                        backgroundColor: '#fff',
                      }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 12,
                        }}>
                        <Text
                          color={'#000'}
                          fontType={'roboto'}
                          semibold
                          style={{fontSize: 14}}>
                          {t('history.initial_request')}
                        </Text>
                        <View
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 999,
                            backgroundColor: '#F1F2F4',
                          }}>
                          <Text
                            fontType={'roboto'}
                            style={{fontSize: 12, color: '#525354'}}>
                            {t('history.original_label')}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.detailsItemInner}>
                        <DetailsItem
                          title={t('history.created')}
                          value={timeformatter(item?.created_at)}
                        />
                        <DetailsItem
                          title={t('history.updated')}
                          value={timeformatter(item?.updated_at)}
                        />
                      </View>

                      <View style={[styles.detailsItemInner, {marginTop: 10}]}>
                        <DetailsItem
                          title={t('history.duration')}
                          value={calcTime(item?.duration)}
                        />
                        <DetailsItem
                          title={t('history.price')}
                          value={formatMoney(item?.original_cleaner_amount)}
                        />
                      </View>

                      <View style={[styles.detailsItemInner, {marginTop: 10}]}>
                        <DetailsItem
                          title={t('history.bedrooms')}
                          value={item?.bedrooms}
                        />
                        <DetailsItem
                          title={t('history.washrooms')}
                          value={item?.washrooms}
                        />
                      </View>
                      <View style={[styles.detailsItemInner, {marginTop: 10}]}>
                        <DetailsItem
                          title={t('history.kitchens')}
                          value={item?.kitchens}
                        />
                        <DetailsItem
                          title={t('history.other_rooms')}
                          value={item?.otherrooms}
                        />
                      </View>
                      <View style={[styles.detailsItemInner, {marginTop: 10}]}>
                        <DetailsItem
                          title={t('history.living_family_rooms')}
                          value={item?.livingrooms}
                        />
                        <DetailsItem
                          title={t('history.dinning_rooms')}
                          value={item?.dinningrooms}
                        />
                      </View>
                      <View style={[styles.detailsItemInner, {marginTop: 10}]}>
                        <DetailsItem
                          title={t('history.laundry_rooms')}
                          value={item?.laundryrooms}
                        />
                        <DetailsItem
                          title={t('history.office_den_rooms')}
                          value={item?.officerooms}
                        />
                      </View>
                      <View style={[styles.detailsItemInner, {marginTop: 10}]}>
                        <DetailsItem
                          title={t('history.extras_fridge')}
                          value={item?.extras?.refridgerator}
                        />
                        <DetailsItem
                          title={t('history.extras_stove')}
                          value={item?.extras?.stove}
                        />
                      </View>
                      <View style={[styles.detailsItemInner, {marginTop: 10}]}>
                        <DetailsItem
                          title={t('history.extras_dishwasher')}
                          value={item?.extras?.dish_washer}
                        />
                        <DetailsItem
                          title={t('history.extras_microwave')}
                          value={item?.extras?.microwave}
                        />
                      </View>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          )}

          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              backgroundColor: '#fff',
              paddingVertical: 16,

              borderRadius: 12,
              marginTop: 12,
            }}>
            <View
              style={{
                display: 'flex',

                flex: 1,
                gap: 12,
              }}>
              <Text
                color={'#000'}
                bold
                fontType={'roboto'}
                style={{fontSize: 18, paddingHorizontal: 20}}>
                {t('history.property_images')}
              </Text>
              {item?.images_link && item?.images_link?.length > 0 ? (
                <ScrollView
                  showsHorizontalScrollIndicator={false}
                  horizontal
                  contentContainerStyle={{
                    gap: 12,
                    paddingHorizontal: 16,
                    // marginRight: 30,
                  }}>
                  {/* {item.images.map(renderImages)} */}
                  {item?.images_link?.map(renderImages)}
                </ScrollView>
              ) : (
                <Text
                  color={'#000'}
                  fontType={'roboto'}
                  style={{fontSize: 12, paddingHorizontal: 20}}>
                  {t('history.no_images')}
                </Text>
              )}
            </View>
          </View>
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              backgroundColor: '#fff',
              paddingVertical: 16,
              paddingHorizontal: 20,
              borderRadius: 12,
              marginTop: 12,
            }}>
            <View
              style={{
                display: 'flex',

                flex: 1,
                gap: 8,
              }}>
              <Text
                color={'#000'}
                bold
                fontType={'roboto'}
                style={{fontSize: 18}}>
                {t('history.reviews')}
              </Text>
              {clean?.review?.rating ? (
                <>
                  <View>
                    <Text bold style={{fontSize: 26}}>
                      {clean?.review?.rating}.0
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        gap: 2,

                        alignItems: 'center',
                      }}>
                      {[1, 2, 3, 4, 5].map(index => (
                        <View key={index}>
                          <FontAwesome
                            fill={'red'}
                            style={{color: '#F8C22E'}}
                            name={
                              index <= clean?.review?.rating ? 'star' : 'star-o'
                            }
                            size={24}
                          />
                        </View>
                      ))}
                    </View>
                  </View>
                  <View>
                    {clean?.review?.comments ? (
                      <Text
                        color={'#333'}
                        fontType={'roboto'}
                        style={{fontSize: 14}}>
                        {clean?.review?.comments}
                      </Text>
                    ) : (
                      <></>
                    )}
                    <Text
                      color={'#333'}
                      fontType={'roboto'}
                      style={{fontSize: 14, marginVertical: 2}}>
                      {clean?.review?.reviewer?.first_name}
                    </Text>
                    <Text
                      color={'#333'}
                      fontType={'roboto'}
                      style={{fontSize: 12}}>
                      {clean?.review?.created_at}
                    </Text>
                  </View>
                </>
              ) : (
                <Text color={'#000'} fontType={'roboto'} style={{fontSize: 12}}>
                  {t('history.no_review')}
                </Text>
              )}
            </View>
          </View>
        </>
      ) : (
        <></>
      )}
    </ScrollView>
  );
};

export default HistoryItem;

const styles = StyleSheet.create({
  detailsItemInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  DetailsPairInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
