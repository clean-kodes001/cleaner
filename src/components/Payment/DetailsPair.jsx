import React from 'react';
import Text from '../Shared/Text';
import {View} from 'react-native';

const DetailsPair = ({title, value}) => {
  return (
    <View
      style={{
        gap: 4,
        flex: 1,
      }}>
      <Text color={'#525354'} fontType={'roboto'} style={{fontSize: 12}}>
        {title}
      </Text>
      <Text
        color={'#0B071B'}
        fontType={'roboto'}
        semibold
        style={{fontSize: 16}}>
        {value}
      </Text>
    </View>
  );
};

export default DetailsPair;
