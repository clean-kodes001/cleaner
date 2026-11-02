import Text from '../../../components/Shared/Text';
import React, {useCallback, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {useFocusEffect} from '@react-navigation/native';
import {
  StyleSheet,
  View,
  Pressable,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import ScreenContainer from '../../../components/Shared/ScreenContainer';
import EmptyState from '../../../components/Shared/EmptyState';
import {useDispatch, useSelector} from 'react-redux';
import FuntionButton from '../../../components/Buttons/FuntionButton';
import {handleViewMore} from '../../../utils/viewMore';
import CustomScrollView from '../../../components/Shared/CustomScrollView';
import {CardField, useStripe} from '@stripe/stripe-react-native';
import {getPayment} from '../../../store/actions/payment/getPayment';
import PaymentItem from '../../../components/Payment/PaymentItem';

const Payments = ({navigation}) => {
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const {confirmPayment} = useStripe();
  const [showbottomSheet, setShowbottomSheet] = useState(false);

  useFocusEffect(useCallback(() => {}, []));

  const {user} = useSelector(state => state.user);

  const {authenticated: authenticatedData} = useSelector(state => state.data);

  const {payments, paymentData, pending, allPending} = useSelector(
    state => state.payment,
  );

  const [lastViewedList, setLastViewedList] = useState([]);
  const [token, setToken] = useState(null);
  const [list, setList] = useState([]);
  const [nextPage, setNextPage] = useState();
  const [prevPage, setPrevPage] = useState();
  const [searchText, setSearchText] = useState('');

  const searchEngine = text => {
    const lowerCaseText = text.toLowerCase();

    if (text.length > 0) {
      const dataToBeFiltered = [...lastViewedList];
      const filteredItems = dataToBeFiltered?.filter(item => {
        return item.location?.toLowerCase()?.includes(lowerCaseText);
      });
      setList(filteredItems);
    } else {
      setList(lastViewedList);
    }
  };

  const [stateOfDisplayList, setStateOfDisplayList] = useState('All');

  const handleSearch = text => {
    setSearchText(text);
    searchEngine(text);
  };

  useFocusEffect(
    useCallback(() => {
      if (payments?.data?.length > 0) {
        setList(paymentData);
        setLastViewedList(paymentData);
        setNextPage(payments?.next_page_url);
        setPrevPage(payments?.prev_page_url);
      }
    }, [paymentData, payments]),
  );

  useFocusEffect(
    useCallback(() => {
      dispatch(getPayment());
    }, []),
  );

  const renderHistoryData = (item, index) => {
    return (
      // <View key={index} style={{flex: 1}}>
      // </View>
      (<PaymentItem key={index} item={item} />)
    );
  };

  const handleRefresh = () => {
    dispatch(getPayment());
  };

  return (
    <ScreenContainer
      edges={['top']}
      style={{
        flex: 1,
        backgroundColor: '#fff',
      }}>
      <View style={{padding: 12, flex: 1}}>
        <Pressable
          onPress={() => Keyboard.dismiss()}
          style={styles.head}></Pressable>
        {allPending ? (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <ActivityIndicator size={'large'} />
          </View>
        ) : (paymentData && paymentData?.length < 1) || [...list].length < 1 ? (
          <EmptyState text={t('payment.no_payments')} />
        ) : (
          <CustomScrollView
            canRefresh={!pending && !allPending}
            onRefresh={handleRefresh}
            styles={{
              paddingBottom: 80,
              justifyContent: 'space-between',
              display: 'flex',
            }}>
            {[...list].length < 1 ? (
              <View
                style={{
                  flex: 1,
                  backgroundColor: 'red',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Text
                  fontType={'roboto'}
                  light
                  color={'#000'}
                  style={{fontSize: 24}}>
                  {t('payment.no_payments_found')}
                </Text>
              </View>
            ) : (
              [...list].map(renderHistoryData)
            )}
            <View
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'row',
              }}>
              {nextPage && (
                <FuntionButton
                  loading={pending}
                  disabled={!nextPage || pending}
                  style={{marginBottom: 0, justifySelf: 'flex-end'}}
                  onPress={() =>
                    handleViewMore({
                      dispatch,
                      pageUrl: nextPage,
                      distructurer: 'payments',
                      setNextPage,
                      setPrevPage,
                      setPage: setList,
                      setLastViewedList,
                    })
                  }
                  name={t('common.more')}
                />
              )}
            </View>
          </CustomScrollView>
        )}
      </View>
    </ScreenContainer>
  );
};

export default Payments;

const styles = StyleSheet.create({
  head: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 6,
    marginVertical: 4,
  },
});
