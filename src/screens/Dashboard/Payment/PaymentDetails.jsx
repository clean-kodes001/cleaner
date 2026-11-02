import React from 'react';
import ScreenContainer from '../../../components/Shared/ScreenContainer';
import {View} from 'react-native';
import Head from '../../../components/Shared/Head';
import {useNavigation} from '@react-navigation/native';

const PaymentDetails = ({route}) => {
  const navigation = useNavigation();
  const {item} = route.params;
  return (
    <ScreenContainer style={{flex: 1, padding: 12}}>
      <Head navigation={navigation} pageTitle={''} type={2} />
      <View style={{flex: 1}}></View>
    </ScreenContainer>
  );
};

export default PaymentDetails;
