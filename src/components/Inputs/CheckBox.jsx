import React from 'react';
import {StyleSheet, View} from 'react-native';
// import CheckBox from '@react-native-community/checkbox';
import CheckBox from 'react-native-check-box';
import Text from '../Shared/Text';
const Checkbox = ({
  title,
  value,
  containerStyles,
  onValueChange,
  textStyle,
  cbStyles,
  invertPosition,
  disabled,
  allow,
}) => {
  return (
    <View style={[styles(disabled).container, containerStyles]}>
      {invertPosition && (
        typeof title === 'string' ? (
          <Text
            onPress={disabled ? null : () => onValueChange(!value)}
            style={[
              {color: disabled ? '#999' : '#888888', lineHeight: 20},
              textStyle,
            ]}>
            {title}
          </Text>
        ) : (
          <View style={{ flex: 1 }}>{title}</View>
        )
      )}
      <CheckBox
        style={[styles(disabled).cb, cbStyles]}
        isChecked={value}
        onClick={disabled ? null : onValueChange}
      />
      {!invertPosition && (
        typeof title === 'string' ? (
          <Text
            onPress={disabled ? null : () => onValueChange(!value)}
            style={[
              {
                color: disabled ? '#999' : '#888888',
                lineHeight: 20,
                flex: 1,
              },
              textStyle,
            ]}>
            {title}
          </Text>
        ) : (
          <View style={{ flex: 1 }}>{title}</View>
        )
      )}
    </View>
  );
};

export default Checkbox;

const styles = disabled =>
  StyleSheet.create({
    cb: {
      padding: 0,
    },
    container: {
      paddingVertical: 8,
      width: '100%',
      // flex: 1,
      // paddingHorizontal: 16,
      flexDirection: 'row',
      gap: 8,
      // alignItems: 'center',
      // backgroundColor: 'red',
      // justifyContent: 'space-between',
    },
  });
