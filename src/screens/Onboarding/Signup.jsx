import React, {useEffect, useState} from 'react';
import {View, StyleSheet, StatusBar, Linking} from 'react-native';
import Text from '../../components/Shared/Text';
import Button from '../../components/Shared/Button';
import ScreenContainer from '../../components/Shared/ScreenContainer';
import Head from '../../components/Shared/Head';
import {useFormik} from 'formik';
import {_emailSchema} from '../../utils/validationSchemas';
import {formHandler} from '../../utils/formhandler';
import TextInputField from '../../components/Inputs/TextInputField';
import {colors} from '../../config/colors';
import {useDispatch} from 'react-redux';
import {register} from '../../store/actions/onboarding/register';
import KeyboardAvoidingView from '../../components/Shared/KeyboardAvoidingView';
import DeviceInfo from 'react-native-device-info';
import Checkbox from '../../components/Inputs/CheckBox';
// import Checkbox from '../../components/Inputs/CheckBox';
import {useTranslation} from 'react-i18next';

const SignUp = ({navigation}) => {
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const [device_name, setDeviceName] = useState();
  useEffect(() => {
    (async () => {
      try {
        const device = await DeviceInfo.getDeviceName();
        setDeviceName(device);
      } catch (error) {
        console.warn('getDeviceName error:', error);
      }
    })();
  }, []);

  const form = useFormik({
    initialValues: {email: '', referral_code: ''},
    validationSchema: _emailSchema,
    onSubmit: values => {
      const data = {
        ...values,
        device_name,
      };

      dispatch(register({navigation, data}));
    },
  });

  const [checked, setChecked] = useState(true);
  const handleChange = value => {
    setChecked(prev => !prev);
  };
  const [checked2, setChecked2] = useState(false);
  const handleChange2 = value => {
    setChecked2(prev => !prev);
  };

  return (
    <ScreenContainer
      style={{
        flex: 1,
      }}>
      <KeyboardAvoidingView>
        <View style={styles.container}>
          <StatusBar hidden={false} />
          <Head
            navigation={navigation}
            secondButtonTitle={t('onboarding.already_have_account')}
            handleSecondButton={() => navigation.navigate('login')}
          />
          <View style={styles.box}>
            <Text medium style={{fontSize: 24}}>
              {t('onboarding.create_account_heading')}
            </Text>
            <TextInputField
              {...formHandler('email', form)}
              placeholder={t('login.email_placeholder')}
              label={t('login.email_label')}
              keyboardType={'email-address'}
              mainStyles={{width: '100%'}}
            />

            <TextInputField
              {...formHandler('referral_code', form)}
              placeholder={t('login.referral_code_placeholder')}
              label={t('login.referral_code_label')}
              mainStyles={{width: '100%', marginTop: 12}}
            />

            <Checkbox
              containerStyles={{marginTop: 12}}
              value={checked}
              onValueChange={handleChange}
              title={
                <Text
                  style={{
                    fontSize: 14,
                    lineHeight: 18,
                  }}
                  color="#828282">
                  {t('onboarding.marketing_consent')}
                </Text>
              }
            />

            <Checkbox
              value={checked2}
              onValueChange={handleChange2}
              title={
                <Text
                  style={{
                    fontSize: 14,
                    lineHeight: 18,
                  }}
                  color="#828282">
                  {t('onboarding.terms_consent')}{' '}
                  <Text
                    onPress={() => {
                      Linking.openURL(
                        'https://swipeklin.com/pages/terms-of-use',
                      );
                    }}
                    color={colors.primaryText}>
                    {t('onboarding.terms_of_use')}
                  </Text>{' '}
                  {t('onboarding.and')}{' '}
                  <Text
                    onPress={() => {
                      Linking.openURL(
                        'https://swipeklin.com/pages/privacy-policy',
                      );
                    }}
                    color={colors.primaryText}>
                    {t('onboarding.privacy_policy')}
                  </Text>{' '}
                  {t('onboarding.terms_consent_suffix')}
                </Text>
              }
            />
            <Button
              disabled={!checked2}
              pressed={form.handleSubmit}
              height={50}
              text={t('common.continue')}
              style={{width: '100%', marginBottom: 12, marginTop: 16}}
            />
            {/* <Text
              center
              style={{
                fontSize: 12,
                width: '90%',
                lineHeight: 16,
                color: colors.grayText,
              }}>{t('onboarding.consent')}</Text> */}
            <View
              style={{flexDirection: 'row', justifyContent: 'center'}}></View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  box: {
    borderRadius: 12,
    padding: 16,
    width: '100%',

    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
