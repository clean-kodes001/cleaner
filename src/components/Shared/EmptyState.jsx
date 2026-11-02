import React from 'react';
import {View} from 'react-native';
import Text from './Text';

const EmptyState = ({text}) => {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Text
        fontType={'roboto'}
        center
        medium
        color={'#000'}
        style={{fontSize: 14}}>
        {text}
      </Text>
    </View>
  );
};

export default EmptyState;
