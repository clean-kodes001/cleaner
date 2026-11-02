import React, {useState} from 'react';
import {Pressable, TouchableOpacity, View} from 'react-native';
import Text from '../Shared/Text';
import {flexCenter} from '../../config/styles';
import AntDesign from "@react-native-vector-icons/ant-design";
import {colors} from '../../config/colors';

const NumberSelect = ({
  item: {id, name},
  form,
  least = 0,
  value,
  style = {},
  containerStyle = {},
  width,
  moreInfo,
  onClickMoreInfo,
  setFieldValue,
}) => {
  const [number, setNumber] = useState(form.values[id]);
  const formsMin = form.values[`${id}_min`];

  return (
    <View
      style={[{alignItems: 'center', width: width || '47%'}, containerStyle]}>
      <Pressable
        onPress={onClickMoreInfo}
        style={[
          {
            alignItems: 'center',
            flexDirection: 'row',
            gap: 6,
          },
        ]}>
        <Text fontType={'Roboto'} medium style={{fontSize: 12}}>
          {name}
        </Text>
        {moreInfo && (
          <AntDesign
            name="questioncircleo"
            color="#000"
            size={14}
            style={{marginBottom: 4}}
          />
        )}
      </Pressable>
      <View
        style={[
          {
            width: '100%',
            height: 45,
            paddingVertical: 6,
            paddingHorizontal: 8,
            backgroundColor: colors.primary,
            //   backgroundColor: '#302882',
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 12,
            gap: 12,
            justifyContent: 'space-between',
          },
          style,
        ]}>
        <TouchableOpacity
          disabled={
            formsMin && formsMin > 0 ? number <= formsMin : number <= least
          }
          onPress={() => {
            form.setFieldValue(id, number - 1);
            setNumber(prev => --prev);
          }}
          style={[{height: '100%', width: 30}, flexCenter]}>
          <AntDesign name="minus" size={14} color="#FFF" />
        </TouchableOpacity>

        <View
          style={[
            {backgroundColor: '#FFF', height: '100%', width: 30},
            flexCenter,
          ]}>
          <Text
            center
            fontType={'roboto'}
            bold
            style={{color: '#000', fontSize: 16}}>
            {number}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            form.setFieldValue(id, number + 1);
            setNumber(prev => ++prev);
          }}
          style={[{height: '100%', width: 30}, flexCenter]}>
          <AntDesign size={16} name="plus" color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default NumberSelect;
