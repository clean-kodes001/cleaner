import React from 'react';
import {TouchableOpacity} from 'react-native';

import FontAwesome5 from "@react-native-vector-icons/fontawesome5";
import {colors} from '../../config/colors';

const IconButton = ({type, setToEnd, onPress, disabled}) => {
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={{
        backgroundColor: colors.primary,
        padding: 8,
        marginVertical: 12,
        height: 40,
        width: 100,
        display: 'flex',
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignSelf: setToEnd ? 'flex-end' : 'flex-start',
        alignItems: 'center',
        opacity: disabled ? 0.8 : 1,
      }}>
      {type === 'arrow-right' ? (
        <FontAwesome5 name="arrow-right" color="#FFF" size={20} iconStyle='solid' />
      ) : type === 'arrow-left' ? (
        <FontAwesome5 name="arrow-left" color="#FFF" size={20} iconStyle='solid' />
      ) : null}
    </TouchableOpacity>
  );
};

export default IconButton;
