import React, {useEffect} from 'react';
import {StyleSheet, View, Image} from 'react-native';
import StepsTopbar from '../../components/Shared/StepsBar';
import ScreenContainer from '../../components/Shared/ScreenContainer';
import {useDispatch, useSelector} from 'react-redux';
import Button from '../../components/Shared/Button';
import {goToImageStep} from '../../store/actions/profile/goToImageStep';
import Text from '../../components/Shared/Text';
import {flexCenter} from '../../config/styles';
import {colors} from '../../config/colors';
import {useTranslation} from 'react-i18next';

const Step1 = ({navigation, route}) => {
  const {t} = useTranslation();
  const dispatch = useDispatch();
  useEffect(() => {}, []);
  const {user} = useSelector(state => state.user);

  const handleNext = () => {
    dispatch(
      goToImageStep({
        nextStage: 2,
        navigation,
        data: null,
        nextPage: 'step2',
      }),
    );
  };
  return (
    <ScreenContainer
      style={{
        flex: 1,
      }}>
      <StepsTopbar />

      <View style={styles.base}>
        <View
          style={{
            display: 'flex',
            justifyContent: 'space-evenly',
            height: '75%',
            alignItems: 'center',
          }}>
          <View
            style={[
              {
                width: '100%',
                height: 250,
                position: 'relative',
              },
              flexCenter,
            ]}>
            <View
              style={[
                {
                  // borderWidth: 3,
                  // borderColor: '#b9b3ef',
                  width: '100%',
                  height: 100,
                  // borderRadius: 50,
                  marginBottom: 12,
                },
                flexCenter,
              ]}>
              <Image source={require('../../assets/media/icons/tick.png')} />
            </View>
            <Text
              center
              medium
              style={{fontSize: 20, color: '#04040d', width: '95%'}}>
              <Text medium style={{fontSize: 20, color: colors.primaryText}}>
                {user?.email}
              </Text>{' '}
              is a verified email
            </Text>
          </View>

          <Button
            text={t('common.next')}
            pressed={handleNext}
            height={52}
            style={{width: '100%', marginVertical: 16}}
          />
        </View>
      </View>
    </ScreenContainer>
  );
};

export default Step1;

const styles = StyleSheet.create({
  base: {
    flex: 1,
    paddingHorizontal: 18,
  },
});
