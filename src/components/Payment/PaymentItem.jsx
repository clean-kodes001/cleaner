import React, {useState} from 'react';
import Text from '../../components/Shared/Text';
import {
  StyleSheet,
  View,
  Pressable,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import {colors} from '../../config/colors';
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";
import DetailsPair from './DetailsPair';
import timeformatter, {calcTime} from '../../utils/timeformatter';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import AntDesign from "@react-native-vector-icons/ant-design";
import {logHelper} from '../../utils/logHelper';

const PaymentItem = ({item, type}) => {
  const {user} = useSelector(state => state.user);
  const [ratings, setRatings] = useState(3);
  const {authenticated: authenticatedData} = useSelector(state => state.data);
  const navigation = useNavigation();

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

  // const itt = {
  //   "amount": 24.75,
  //   "clearance": 1,
  //   "country": {
  //     "currency": "CAD $",
  //     "currency_pay": "cad",
  //     "id": 1, "name":
  //     "Canada"
  //   },
  //   "country_id": 1,
  //   "created_at": "Tue, Nov 14, 2023 9:38 PM",
  //   "created_by": 14,
  //   "currency": "cad",
  //   "description": "Payment successful",
  //   "gateway": "stripe",
  //   "gateway_message": "Payment successful",
  //   "gateway_txt_id": "pi_3OCUIdHe3OcuAUuK1LGGyYqd",
  //   "id": "01HF7WA6J0670KVJ3NJ538831Q",
  //   "payable_id": "01hf7wa6d0b9qm5hvq2rm3290e",
  //   "payable_type": "App\\Models\\Clean",
  //   "payment_method": "pm_1OC7tSHe3OcuAUuK00TRytjM",
  //   "payment_type": "credit",
  //   "reference": "pi_3OCUIdHe3OcuAUuK1LGGyYqd",
  //   "status": "paid",
  //   "updated_at": "Tue, Nov 14, 2023 9:38 PM",
  //   "updated_by": 14,
  //   "user_id": 14
  // }
  
  const paymentType = (payment_type = null) => {
    return {
      credit: {type: 'Payment', color: '#d1e7dd'},
      debit: {type: 'Payment', color: '#d1e7dd'},
      refund: {type: 'Refund', color: '#fff3cd'},
      penalty: {type: 'Penalty Fee', color: '#f8d7da'},
    }[payment_type] ?? {type: 'Payment', color: '#d1e7dd'};
  };
  
  const paymentStatus = (status = null) => {
    // `written_off` means the backend gave up collecting — nothing is coming out of the
    // customer's account. It used to fall through to the 'Pending' default, which reads as
    // the exact opposite (BUG-019), so it gets a neutral grey rather than the amber that
    // signals money in flight.
    const known = {
      paid: {type: 'Paid', color: '#d1e7dd'},
      pending: {type: 'Pending', color: '#fff3cd'},
      failed: {type: 'Failed', color: '#f8d7da'},
      cancelled: {type: 'Cancelled', color: '#f8d7da'},
      written_off: {type: 'Written Off', color: '#e2e3e5'},
      // Amber, NOT the grey used for written_off: money IS still expected to leave the
      // customer's account here, so it must not read like the abandoned case.
      outstanding: {type: 'Unpaid', color: '#fff3cd'},
    }[status];

    if (!known && status) {
      logHelper(status, 'PaymentItem: unmapped payment status');
    }

    return known ?? {type: 'Pending', color: '#fff3cd'};
  };



  return (
    <Pressable
      disabled={type ? true : false}
      onPress={() => {
        // navigation.navigate('paymentdetails', {item: item});
      }}
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        height: 120,
        backgroundColor: 'rgba(244,246,249,255)',
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

        <View
            style={{
              flexDirection: 'row',
              justifyContent: 'left',
              alignItems: 'center',
              }}>
            <Text
              numberOfLines={!type ? 1 : null}
              fontType={'roboto'}
              semibold
              style={{
                fontSize: 12,
                //  color: '#161d29'
                marginBottom: 4,
              }}>
              {item?.id}
            </Text>


            <View
              style={{
                backgroundColor: paymentType(item?.payment_type)?.color,
                padding: 4,
                paddingHorizontal: 8,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 8,
                // width: 100,
                marginHorizontal: 10
              }}>
              <Text
                fontType={'roboto'}
                style={{
                  width: 'auto',
                  fontSize: 12,
                  color: colors.textBlack,
                }}>
                {paymentType(item?.payment_type)?.type}
              </Text>
            </View>
          </View>


          

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'left',
              alignItems: 'center',
              }}>
              <Text
                numberOfLines={!type ? 1 : null}
                fontType={'roboto'}
                bold
                style={{
                  fontSize: 16,
                  //  color: '#161d29'
    
                  color: colors.brandPrimary,
                  // color: colors.brandPurple,
    
                  marginBottom: 4,
                }}>
                {`${item?.country?.currency} ${Number(item?.amount).toFixed(2)}`}
              </Text>

            <View
              style={{
                backgroundColor: paymentStatus(item?.status)?.color,
                padding: 2,
                paddingHorizontal: 8,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 4,
                // width: 100,
                marginHorizontal: 10
              }}>
              <Text
                fontType={'roboto'}
                style={{
                  width: 'auto',
                  fontSize: 10,
                  color: colors.textBlack,
                }}>
                {paymentStatus(item?.status)?.type}
              </Text>
            </View>
          </View>

          <Text
            numberOfLines={!type ? 1 : null}
            fontType={'roboto'}
            style={{
              fontSize: 14,
              //  color: '#161d29'
              marginBottom: 4,
            }}>
            {timeformatter(item?.created_at)}
          </Text>

          {/* <View
              style={{
                backgroundColor:
                  item.status === 1 ? colors.activeFaded : colors.inActiveFaded,
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
                  color: item.status === 1 ? colors.active : colors.inActive,
                }}>
                {item.status === 1
                  ? 'Active'
                  : item.status === 2 || item.status === 8
                  ? 'Inactive'
                  : item.status === 3
                  ? 'Arrived'
                  : item.status === 4
                  ? 'Started'
                  : item.status === 5 || item.status === 6
                  ? 'Canceled'
                  : item.status === 7
                  ? 'Ended'
                  : item.status === 9
                  ? 'Declined'
                  : item.status === 10
                  ? 'Ended'
                  : item.status === 11
                  ? 'Amended'
                  : 'Pending'}
              </Text>
            </View> */}
        </View>
      </View>
      {!type ? (
        <MaterialCommunityIcons
          name="finance"
          color={colors.brandPrimary}
          size={30}
        />
      ) : (
        <></>
      )}
    </Pressable>
  );
};

export default PaymentItem;

const styles = StyleSheet.create({
  DetailsPairInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
