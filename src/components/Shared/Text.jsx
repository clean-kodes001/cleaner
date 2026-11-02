import React from 'react';
import {StyleSheet, Text as TextRN} from 'react-native';

const Text = ({
  color,
  size,
  bold,
  medium,
  onPress,
  semibold,
  light,
  center,
  children,
  style,
  singleLine,
  capitalized,
  fontType,
  numberOfLines,
  ...rest
}) => {
  return (
    <TextRN
      numberOfLines={singleLine ? 1 : numberOfLines}
      onPress={onPress}
      style={[
        styles(
          color,
          capitalized,
          bold,
          light,
          medium,
          semibold,
          center,
          fontType,
        ).text,
        style,
      ]}>
      {children}
    </TextRN>
  );
};

export default Text;

const styles = (
  color,
  capitalized,
  bold,
  light,
  medium,
  semibold,
  center,
  fontType,
) =>
  StyleSheet.create({
    text: {
      color: color ? color : '#000',
      textTransform: capitalized ? 'capitalize' : 'none',
      textAlign: center ? 'center' : null,
      fontFamily: 'roboto'
        /* fontType === 'inter'
          ? semibold
            ? 'Inter-Medium'
            : bold
            ? 'Inter-Bold'
            : light
            ? 'Inter-Light'
            : medium
            ? 'Inter-Medium'
            : 'Inter-Regular'
          : fontType === 'roboto'
          ? semibold
            ? 'Roboto-Medium'
            : bold
            ? 'Roboto-Bold'
            : light
            ? 'Roboto-Light'
            : medium
            ? 'Roboto-Medium'
            : 'Roboto-Regular'
          : semibold
          ? 'Poppins-Semibold'
          : bold
          ? 'Poppins-Bold'
          : light
          ? 'Poppins-Light'
          : medium
          ? 'Poppins-Medium'
          : 'Poppins-Regular', */
    },
  });
