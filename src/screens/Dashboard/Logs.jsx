import React from 'react';
import Text from '../../components/Shared/Text';
import ScreenContainer from '../../components/Shared/ScreenContainer';
import {StyleSheet, ScrollView, View} from 'react-native';
import {useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';

const Logs = () => {
  const {t} = useTranslation();
  const {logs} = useSelector(state => state.log);
  return (
    <ScreenContainer style={{flex: 1, padding: 12}}>
      <View style={styles.head}>
        <Text fontType={'roboto'} medium color={'#000'} style={{fontSize: 18}}>
          {t('logs.title')}
        </Text>

        <ScrollView>
          <Text>{JSON.stringify(logs)}</Text>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
};

export default Logs;

const styles = StyleSheet.create({
  head: {
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginVertical: 8,
  },
});
