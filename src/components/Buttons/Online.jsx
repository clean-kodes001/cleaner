import React, {useEffect, useRef, useState} from 'react';
import {TouchableOpacity, View} from 'react-native';
import FontAwesome from "@react-native-vector-icons/fontawesome";
import Text from '../Shared/Text';
import {useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
const Online = ({online, handleGoOffline, handleGoOnline}) => {
  const {t} = useTranslation();
  return (
    <View style={{marginHorizontal: 18, marginTop: 0}}>
      <TouchableOpacity
        onPress={online ? handleGoOffline : handleGoOnline}
        style={{
          width: 200,
          height: 52,
          borderRadius: 28,
          backgroundColor: online ? '#f4f3f9' : '#0CBC87',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 12,
        }}>
        <FontAwesome
          name={online ? 'circle-o' : 'dot-circle-o'}
          size={20}
          color={online ? '#0f0b2d' : '#FFF'}
        />
        <Text
          style={{fontSize: 20, color: online ? '#0f0b2d' : '#fff'}}
          semibold
          fontType={'roboto'}>
          {online ? t('cleanerOnlineButton.go_offline') : t('cleanerOnlineButton.go_online')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export const Blink = () => {
  const {user} = useSelector(state => state.user);
  const online = user?.online;
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    let interval;
    if (!online) {
      setBlink(true);
    } else {
      interval = setInterval(() => {
        setBlink(blinkState => !blinkState);
      }, 1000);
    }
    return () => {
      clearInterval(interval);
    };
  }, [online]);

  return (
    <View
      style={{
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <View
        style={{
          width: blink ? 30 : 20,
          height: blink ? 30 : 20,
          borderRadius: blink ? 15 : 10,
          backgroundColor: online
            ? blink
              ? '#17ffb9'
              : '#0CBC87'
            : blink
            ? '#fa0c29'
            : '#D6293E',
        }}></View>
    </View>
  );
};

export default Online;
