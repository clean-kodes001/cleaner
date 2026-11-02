import React from 'react';
import {Image, StyleSheet, View} from 'react-native';
import Text from '../Shared/Text';
import {useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';

const ChatScreenHead = ({navigation}) => {
  const {t} = useTranslation();
  const {user} = useSelector(state => state.user);

  return (
    <>
      <View style={styles.head}>
        <View style={styles.headInner}>
          <Text style={styles.name} fontType={'roboto'} semibold>
            {/* {user?.first_name} */}
          </Text>
        </View>
        <Text fontType={'roboto'} style={styles.status}>{t('chat.online_status')}</Text>
      </View>
    </>
  );
};

export default ChatScreenHead;

const styles = StyleSheet.create({
  image: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  status: {fontSize: 14, lineHeight: 26, color: '#51C301'},
  name: {fontSize: 18, lineHeight: 26, marginLeft: 16},
  head: {
    marginHorizontal: 18,
    marginVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
