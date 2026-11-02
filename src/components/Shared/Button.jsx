import React from 'react';
import {ActivityIndicator, View, TouchableOpacity} from 'react-native';
import Text from './Text';
import {colors} from '../../config/colors';
import Icon from "@react-native-vector-icons/octicons";
import {useSelector} from 'react-redux';

const Button = ({
  pressed,
  text,
  mv,
  mh,
  mt,
  mb,
  outline,
  style,
  customEndAdornment,
  endAdornment,
  textStyle,
  height,
  loading,
  startAdornment,
  disabled,
  unreadCount,
  singleLine,
}) => {
  const {messageCount} = useSelector(state => state.user);
  
  // Use prop if provided, otherwise fall back to Redux messageCount
  const displayCount = unreadCount !== undefined ? unreadCount : messageCount;

  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={pressed}
      style={{
        height: height || 58,
        borderWidth: outline ? 2 : 0,
        borderRadius: 12,
        opacity: disabled ? 0.7 : null,
        borderColor: outline ? colors.primary : 'transparent',
        backgroundColor: outline ? 'transparent' : colors.primary,
        display: 'flex',
        flexDirection: 'row',
        gap: 16,
        justifyContent: 'center',
        alignItems: 'center',
        ...style,
      }}>
      {loading ? (
        <ActivityIndicator
          color={outline == 'outline' ? colors.primary : '#fff'}
        />
      ) : (
        <>
          {/* {startAdornment === 'plus' ? (
            <AntDesign
              name="plus"
              size={18}
              color={outline === 'outline' ? colors.primary : colors.primary}
            />
          )  : null} */}
          <Text
            semibold
            fontType={'roboto'}
            numberOfLines={singleLine ? 1 : undefined}
            adjustsFontSizeToFit={singleLine}
            style={{
              fontSize: 18,
              color: outline ? colors.primary : '#fff',
              ...textStyle,
            }}>
            {text}
          </Text>
          {customEndAdornment ? (
            displayCount ? (
              <View
                style={{
                  borderRadius: 40,
                  backgroundColor: '#fff',
                  width: 30,
                  height: 30,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Text
                  semibold
                  fontType={'roboto'}
                  style={{
                    fontSize: 14,
                    marginBottom: 1,
                    color: colors.primary,
                    ...textStyle,
                  }}>
                  {displayCount}
                </Text>
              </View>
            ) : null
          ) : endAdornment === 'arrow-Right' ? (
            <Icon
              name="arrow-right"
              size={28}
              color={outline === 'outline' ? colors.primary : '#fff'}
            />
          ) : null}
        </>
      )}
    </TouchableOpacity>
  );
};

export default Button;
