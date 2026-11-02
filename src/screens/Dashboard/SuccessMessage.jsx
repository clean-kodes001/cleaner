import React from 'react';
import {useTranslation} from 'react-i18next';
import {Image, StyleSheet, View} from 'react-native';
import ScreenContainer from '../../components/Shared/ScreenContainer';
import Text from '../../components/Shared/Text';
import Button from '../../components/Shared/Button';

import {useDispatch} from 'react-redux';
import {clean} from '../../store/actions/dashboard/clean';

const SuccessMessage = ({navigation, route}) => {
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const {data, type, cleanerData} = route.params;

  const findCleaners = () => {};
  const handleContinue = () => {
    navigation.navigate('History');
  };
  return (
    <ScreenContainer
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
      }}>
      <View
        style={{
          alignItems: 'center',
          width: '100%',
          height: '70%',
          justifyContent: 'space-evenly',
          // gap: 24,
        }}>
        <Image
          style={{width: 120, height: 120}}
          source={require('../../assets/media/icons/tick.png')}
        />
        {type === 'cleanCalculate' ? (
          <>
            <Text
              fontType={'roboto'}
              center
              medium
              style={{fontSize: 20, marginBottom: 8, lineHeight: 30}}>
              {`${t('successMessage.cost_info')} (${data.currency} ${data.amount}) ${t('successMessage.and_estimated_time')} (${data.duration}).`}
            </Text>

            <Text
              fontType={'roboto'}
              center
              medium
              style={{fontSize: 20, marginBottom: 8, lineHeight: 30}}>
              {t('successMessage.find_cleaners_prompt')}
            </Text>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                width: '100%',

                justifyContent: 'space-between',
              }}>
              <Button
                outline
                text={t('common.cancel')}
                pressed={() => {
                  navigation.goBack();
                }}
                height={52}
                style={{width: '47%', borderRadius: 8, marginVertical: 16}}
              />
              <Button
                text={t('successMessage.find_cleaners_button')}
                pressed={findCleaners}
                height={52}
                style={{width: '47%', borderRadius: 8, marginVertical: 16}}
              />
            </View>
          </>
        ) : type === 'clean' ? (
          <>
            <Text
              fontType={'roboto'}
              center
              medium
              style={{fontSize: 20, marginBottom: 8, lineHeight: 30}}>
              {t('successMessage.successfully_requested')}
            </Text>
            <Button
              text={t('successMessage.view_details_button')}
              pressed={handleContinue}
              height={52}
              style={{width: '100%', borderRadius: 8, marginVertical: 16}}
            />
          </>
        ) : null}
      </View>
    </ScreenContainer>
  );
};

export default SuccessMessage;

const styles = StyleSheet.create({});
