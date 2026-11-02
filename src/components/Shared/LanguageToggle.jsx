import React from 'react';
import {View, TouchableOpacity} from 'react-native';
import Text from './Text';
import {useTranslation} from 'react-i18next';
import {changeLanguage} from '../../i18n/i18n';

const LANGS = [
  {id: 'en', label: 'EN'},
  {id: 'fr', label: 'FR'},
];

/**
 * Compact EN | FR language switch. Works before login (changeLanguage updates
 * i18n + AsyncStorage locally; the backend sync no-ops until authenticated and
 * the choice rides the X-App-Language header on the next request after login).
 */
const LanguageToggle = ({style, inactiveColor = '#fff', activeColor = '#5143d9'}) => {
  const {i18n} = useTranslation();
  const current = (i18n.language || 'en').slice(0, 2);

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          backgroundColor: 'rgba(255,255,255,0.18)',
          borderRadius: 20,
          padding: 3,
        },
        style,
      ]}>
      {LANGS.map(lang => {
        const active = current === lang.id;
        return (
          <TouchableOpacity
            key={lang.id}
            onPress={() => changeLanguage(lang.id)}
            activeOpacity={0.8}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 18,
              backgroundColor: active ? activeColor : 'transparent',
            }}>
            <Text
              fontType={'roboto'}
              bold
              style={{color: active ? '#fff' : inactiveColor, fontSize: 13}}>
              {lang.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default LanguageToggle;
