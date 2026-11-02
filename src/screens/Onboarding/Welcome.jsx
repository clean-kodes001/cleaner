import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ImageBackground,
} from 'react-native';
import Text from '../../components/Shared/Text';
import Button from '../../components/Shared/Button';
import ScreenContainer from '../../components/Shared/ScreenContainer';
import {useDispatch} from 'react-redux';
import {unAuthenticated} from '../../store/actions/onboarding/unAuthenticated';
import {useTranslation} from 'react-i18next';
import LanguageToggle from '../../components/Shared/LanguageToggle';

const Welcome = ({navigation}) => {
  const {t} = useTranslation();
  const dispatch = useDispatch();
  useEffect(() => {
    // dispatch(unAuthenticated());
  }, []);
  return (
    <ImageBackground
      style={{
        flex: 1,

        alignItems: 'flex-end',
        justifyContent: 'flex-end',
      }}
      resizeMode="cover"
      source={require('../../assets/media/images/deep-cleaning.png')}>
      <StatusBar hidden />
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          flex: 1,
          justifyContent: 'flex-end',
        }}>
        <View style={{position: 'absolute', top: 50, right: 20, zIndex: 10}}>
          <LanguageToggle />
        </View>
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '65%',
            width: '100%',
          }}>
          <Text
            center
            medium
            fontType={'roboto'}
            style={{
              fontSize: 32,
              color: '#fff',
              width: '85%',
              marginBottom: 28,
            }}>
            {t('welcome.hero_text')}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              gap: 24,
              paddingHorizontal: 28,
              marginBottom: 40,
            }}>
            <Button
              text={t('onboarding.sign_in_heading')}
              singleLine
              pressed={() => navigation.navigate('login')}
              style={{flex: 1, marginBottom: 12, marginTop: 12}}
            />
            <Button
              text={t('onboarding.create_account_link')}
              outline
              singleLine
              textStyle={{color: '#fff'}}
              pressed={() => navigation.navigate('signup')}
              style={{
                flex: 1,
                borderColor: '#fff',
                marginBottom: 12,
                marginTop: 12,
              }}
            />
          </View>
        </View>
      </View>
      {/* </View> */}
    </ImageBackground>
  );
};

export default Welcome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  box: {
    borderRadius: 12,
    height: '40%',
    width: '100%',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
});
