import React from 'react';
import Text from '../Shared/Text';
import {ActivityIndicator, TouchableOpacity} from 'react-native';
import {colors} from '../../config/colors';

const FuntionButton = ({
  name,
  loading,
  onPress,
  style,
  textStyle,
  disabled,
}) => {
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={{
        backgroundColor: colors.primary,
        padding: 8,
        marginVertical: 12,
        height: 40,
        width: 130,
        display: 'flex',
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignSelf: 'flex-end',
        alignItems: 'center',
        opacity: disabled ? 0.8 : 1,
        ...style,
      }}>
      {loading ? (
        <ActivityIndicator color={'#FFF'} size="small" />
      ) : (
        <Text bold center style={{fontSize: 16, color: '#fff', ...textStyle}}>
          {name}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default FuntionButton;
