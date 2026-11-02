import React, {useEffect, useRef, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import Text from '../Shared/Text';
import {Picker} from '@react-native-picker/picker';

const Select = ({
  label,
  style,
  mt,
  error,
  hideError,
  onChangeText,
  value,
  borderError,
  list,
  fullWidth,
  placeholder,
  disabled,
  width,
  multiple,
  max,
}) => {
  return (
    <View
      style={{
        marginTop: mt || 12,
        display: 'flex',
        width: fullWidth ? '100%' : width ? width : '47%',
      }}>
      {label && (
        <Text
          fontType={'Roboto'}
          medium
          style={{fontSize: 12, marginBottom: 3}}>
          {label}
        </Text>
      )}
      <View
        style={{
          borderWidth: 1,
          borderStyle: 'solid',
          borderRadius: 8,
          backgroundColor: 'transparent',
          borderColor: '#CFD3D4',
        }}>
        <Picker
          // useNativeAndroidPickerStyle={false}

          onValueChange={onChangeText}
          items={list}
        />
      </View>
      {!hideError && error && (
        <Text
          fontType={'roboto'}
          style={{
            marginTop: 2,
            marginLeft: 4,
            fontSize: 12,
            color: 'red',
          }}>
          {error}
        </Text>
      )}
    </View>
  );
};

export default Select;

const styles = StyleSheet.create({
  select: {
    width: '100%',
    borderRadius: 8,
    borderWidth: 0.8,
    backgroundColor: '#FFF',
    borderColor: '#BDBDBD',
  },
  btnText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'left',
    color: '#4F4F4F',
  },
  borderErrorStyle: {
    borderWidth: 2,
    borderColor: 'red',
  },
});
