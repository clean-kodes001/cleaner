import React, {useEffect, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import Text from '../../components/Shared/Text';
import Button from '../../components/Shared/Button';
import ScreenContainer from '../../components/Shared/ScreenContainer';
import Head from '../../components/Shared/Head';
import {useFormik} from 'formik';
import {
  _createPasswordSchema,
  _enterPasswordSchema,
} from '../../utils/validationSchemas';
import {formHandler} from '../../utils/formhandler';
import TextInputField from '../../components/Inputs/TextInputField';
import {colors} from '../../config/colors';
import {useDispatch} from 'react-redux';
// import {register} from '../../store/actions/onboarding/register';
import KeyboardAvoidingView from '../../components/Shared/KeyboardAvoidingView';
import DeviceInfo from 'react-native-device-info';
import {login} from '../../store/actions/onboarding/login';
import {useTranslation} from 'react-i18next';

const EnterPassword = ({navigation, route}) => {
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const {data} = route.params;

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

  const onSubmit = values => {
    const payload = {
      ...values,
      username: data.email,
      device_name,
    };

    dispatch(login({navigation, data: payload}));
  };

  const form = useFormik({
    initialValues: {password: ''},
    validationSchema: _enterPasswordSchema,
    onSubmit,
  });

  const validatePassword = text => {
    // const updatedStrength = validatePasswordStrength(
    //   text,
    //   form.values.confirmPassword,
    //   passwordStrength,
    // );

    // setPasswordStrength(updatedStrength);
    form.setFieldValue('password', text);
  };

  return (
    <ScreenContainer
      style={{
        flex: 1,
      }}>
      <KeyboardAvoidingView>
        <View style={styles.container}>
          <Head navigation={navigation} />
          <View style={styles.box}>
            <Text style={{fontSize: 24}} medium>
              {t('onboarding.enter_password_heading')}
            </Text>
            <TextInputField
              {...formHandler('password', form)}
              onChangeText={validatePassword}
              placeholder={t('login.password_placeholder')}
              label={t('login.password_label')}
              type="password"
              mainStyles={{width: '100%'}}
            />
            <Button
              pressed={form.handleSubmit}
              height={50}
              text={t('common.continue')}
              // pressed={() => navigation.replace('login')}
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

export default EnterPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',

    alignItems: 'center',
    paddingHorizontal: 18,
  },

  box: {
    borderRadius: 12,

    padding: 28,
    width: '100%',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
