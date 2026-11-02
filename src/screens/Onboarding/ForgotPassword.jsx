import React, {useEffect, useState} from 'react';
import {View, StyleSheet} from 'react-native';
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
import {forgotPassword} from '../../store/actions/onboarding/forgotPassword';
import {useTranslation} from 'react-i18next';

const ForgotPassword = ({navigation}) => {
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
    initialValues: {email: ''},
    validationSchema: _emailSchema,
    onSubmit: values => {
      const data = {
        username: values.email,
        device_name,
      };

      dispatch(forgotPassword({navigation, data}));
    },
  });

  return (
    <ScreenContainer
      style={{
        flex: 1,
      }}>
      <KeyboardAvoidingView>
        <View style={styles.container}>
          <Head
            navigation={navigation}
            secondButtonTitle={t('onboarding.already_have_account')}
            handleSecondButton={() => navigation.navigate('login')}
          />
          <View style={styles.box}>
            <Text medium style={{fontSize: 24}}>
              {t('onboarding.forgot_password_heading')}
            </Text>
            <TextInputField
              {...formHandler('email', form)}
              placeholder={t('login.email_placeholder')}
              label={t('login.email_label')}
              keyboardType={'email-address'}
              mainStyles={{width: '100%'}}
            />
            <Button
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

export default ForgotPassword;

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
