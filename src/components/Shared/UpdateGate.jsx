import React, {useEffect, useRef, useState} from 'react';
import {Alert, Image, Linking, Modal, Platform, StyleSheet, View} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import Text from './Text';
import Button from './Button';
import {Client} from '../../config/client';
import {VERSION_CHECK} from '../../config/apis';
import {useTranslation} from 'react-i18next';

// "1.2.10" vs "1.3" style comparison; missing parts count as 0.
const compareVersions = (a, b) => {
  const pa = String(a).split('.').map(n => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x !== y) {
      return x < y ? -1 : 1;
    }
  }
  return 0;
};

// On app open, asks the backend for the platform's minimum/latest version.
// Below minimum -> non-dismissible full-screen update screen (forced).
// Below latest -> one dismissible "update available" alert (soft).
// Network/API failures never block the app.
const UpdateGate = () => {
  const {t} = useTranslation();
  const [forced, setForced] = useState(false);
  const [storeUrl, setStoreUrl] = useState(null);
  const promptedRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const {data} = await Client({
          method: 'GET',
          path: `${VERSION_CHECK}?platform=${Platform.OS}`,
          processError: false,
        });

        const current = DeviceInfo.getVersion();
        const url = data?.store_url || null;
        setStoreUrl(url);

        if (data?.min_version && compareVersions(current, data.min_version) < 0) {
          setForced(true);
          return;
        }

        if (
          !promptedRef.current &&
          data?.latest_version &&
          compareVersions(current, data.latest_version) < 0
        ) {
          promptedRef.current = true;
          Alert.alert(
            t('update.available_title'),
            t('update.available_message'),
            [
              {text: t('update.later'), style: 'cancel'},
              {
                text: t('update.update_now'),
                onPress: () => url && Linking.openURL(url),
              },
            ],
          );
        }
      } catch (error) {
        // Never block the app when the check itself fails.
        console.warn('Version check failed:', error?.message);
      }
    })();
  }, [t]);

  if (!forced) {
    return null;
  }

  return (
    <Modal visible animationType="fade" onRequestClose={() => {}}>
      <View style={styles.container}>
        <Image
          style={styles.icon}
          source={require('../../assets/media/icons/icons8-easy-100.png')}
        />
        <Text fontType={'roboto'} bold center style={styles.title}>
          {t('update.required_title')}
        </Text>
        <Text fontType={'roboto'} center style={styles.message}>
          {t('update.required_message')}
        </Text>
        <Button
          text={t('update.update_now')}
          height={52}
          style={styles.button}
          pressed={() => storeUrl && Linking.openURL(storeUrl)}
        />
      </View>
    </Modal>
  );
};

export default UpdateGate;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  icon: {
    width: 96,
    height: 96,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    width: '90%',
    marginBottom: 8,
  },
  button: {
    width: '100%',
    marginTop: 24,
  },
});
