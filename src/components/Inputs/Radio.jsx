import React from 'react';
import {TouchableOpacity, View} from 'react-native';
import Text from '../Shared/Text';
import {colors} from '../../config/colors';

const Radio = ({title, items, id, form}) => {
  return (
    <View
      style={{
        paddingHorizontal: 18,
        marginVertical: 16,
      }}>
      <Text fontType={'Roboto'} medium center style={{fontSize: 14}}>
        {title}
      </Text>
      <View
        style={{
          display: 'flex',
          justifyContent: 'center',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}>
        {items.map((item, index) => (
          <TouchableOpacity
            onPress={() => form.setFieldValue(id, item.id)}
            key={index}
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'row',

              marginTop: 8,
              gap: 4,
            }}>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 5,
                borderColor:
                  form.values[id] === item.id ? colors.primary : '#111',
              }}></View>
            <Text fontType={'roboto'} semibold center style={{fontSize: 14}}>
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default Radio;
