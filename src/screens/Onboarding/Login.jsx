import React, {useEffect, useState} from 'react';
import {View, StyleSheet, TouchableOpacity, StatusBar} from 'react-native';
import Text from '../../components/Shared/Text';
import Button from '../../components/Shared/Button';
import ScreenContainer from '../../components/Shared/ScreenContainer';
import Head from '../../components/Shared/Head';
import {useFormik} from 'formik';
import {_emailSchema, _loginSchema} from '../../utils/validationSchemas';
import {formHandler} from '../../utils/formhandler';
import TextInputField from '../../components/Inputs/TextInputField';
import {colors} from '../../config/colors';
import KeyboardAvoidingView from '../../components/Shared/KeyboardAvoidingView';
import {
  submitValidations,
  validatePasswordStrength,
} from '../../utils/validatePasswordStrength';
import DeviceInfo from 'react-native-device-info';
import {login} from '../../store/actions/onboarding/login';
import {useDispatch} from 'react-redux';
import {useTranslation} from 'react-i18next';

const Login = ({navigation}) => {
  const {t} = useTranslation();
  const [passwordStrength, setPasswordStrength] = React.useState([
    {id: 1, title: t('onboarding.password_rule_min_chars'), passed: null},
    {id: 2, title: t('onboarding.password_rule_uppercase'), passed: null},
    {id: 3, title: t('onboarding.password_rule_unique'), passed: null},
    {id: 4, title: t('onboarding.password_rule_lowercase'), passed: null},
    {id: 5, title: t('onboarding.password_rule_number'), passed: null},
  ]);

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

  const handleSubmit = values => {
    const err = submitValidations(passwordStrength, form);

    if (err === true) {
    } else {
      const data = {
        ...values,
        device_name,
      };
      dispatch(login({navigation, data: data}));
    }
  };

  const form = useFormik({
    initialValues: {username: '', password: ''},
    validationSchema: _loginSchema,
    onSubmit: handleSubmit,
  });

  const validatePassword = (text, from) => {
    const updatedStrength = validatePasswordStrength(
      text,
      form.values.confirmPassword,
      passwordStrength,
    );

    setPasswordStrength(updatedStrength);

    form.setFieldValue('password', text);
  };

  return (
    <ScreenContainer style={{flex: 1}}>
      <KeyboardAvoidingView>
        <View style={styles.container}>
          <StatusBar hidden={false} />
          <Head
            navigation={navigation}
            secondButtonTitle={t('onboarding.create_account_link')}
            handleSecondButton={() => navigation.navigate('signup')}
          />
          <View style={styles.box}>
            <Text medium style={{fontSize: 24}}>
              {t('onboarding.sign_in_heading')}
            </Text>
            <TextInputField
              {...formHandler('username', form)}
              placeholder={t('login.email_placeholder')}
              label={t('login.email_label')}
              keyboardType={'email-address'}
              mainStyles={{width: '100%', margin: 0}}
            />
            <TextInputField
              secureTextEntry={true}
              {...formHandler('password', form)}
              onChangeText={validatePassword}
              placeholder={t('login.password_placeholder')}
              label={t('login.password_label')}
              type="password"
              mainStyles={{width: '100%', margin: 0}}
            />
            <Button
              pressed={form.handleSubmit}
              height={50}
              text={t('onboarding.sign_in_heading')}
              style={{width: '100%', marginBottom: 8, marginTop: 16}}
            />
            <Text
              onPress={() => navigation.navigate('forgotpassword')}
              center
              semibol
              fontType={'roboto'}
              style={{
                fontSize: 13,
                width: '90%',
                lineHeight: 16,
                padding: 8,
                color: colors.primary,
              }}>
              {t('onboarding.forgot_password')}
            </Text>
            <View
              style={{flexDirection: 'row', justifyContent: 'center'}}></View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

export default Login;

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
