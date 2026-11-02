import React from 'react';
import Text from '../../components/Shared/Text';
import ScreenContainer from '../../components/Shared/ScreenContainer';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {colors} from '../../config/colors';
import EmptyState from '../../components/Shared/EmptyState';

import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";
import {useSelector} from 'react-redux';
import DetailsItem from '../../components/History/DetailsItem';
import Head from '../../components/Shared/Head';
import {useNavigation} from '@react-navigation/native';
import HistoryItem from '../../components/History/HistoryItem';
import {useTranslation} from 'react-i18next';
const HistoryDetails = ({route}) => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const {data} = route.params;
  const {user} = useSelector(state => state.user);
  return (
    <ScreenContainer style={{flex: 1, padding: 12}}>
      <Head navigation={navigation} pageTitle={t('history.history_details')} type={2} />
      <View style={{flex: 1}}>
        <HistoryItem type={2} clean={data} />
      </View>
    </ScreenContainer>
  );
};

export default HistoryDetails;

const styles = StyleSheet.create({
  head: {
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginVertical: 8,
  },
  detailsItemInner: {
    // minWidth: 130,

    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
