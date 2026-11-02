import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en.json';
import fr from './fr.json';

export const LANGUAGE_KEY = 'app_language';

export const initI18n = async () => {
  const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
  return i18n.use(initReactI18next).init({
    resources: {en: {translation: en}, fr: {translation: fr}},
    lng: savedLang || 'en',
    fallbackLng: 'en',
    interpolation: {escapeValue: false},
    compatibilityJSON: 'v3',
  });
};

export const changeLanguage = async lang => {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  // Tell the backend immediately so push notifications, emails and API
  // responses follow the toggle right away (header on every request is the
  // self-healing fallback). Fire-and-forget; silent if unauthenticated/offline.
  try {
    const {Client} = require('../config/client');
    Client({
      method: 'POST',
      path: 'language',
      data: {language: lang},
      processError: false,
    }).catch(() => {});
  } catch (e) {}
  return i18n.changeLanguage(lang);
};

export default i18n;
