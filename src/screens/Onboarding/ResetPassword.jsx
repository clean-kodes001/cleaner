import React from 'react';
import {View, StyleSheet, Touchable, Keyboard} from 'react-native';
import Text from '../../components/Shared/Text';
import Button from '../../components/Shared/Button';
import ScreenContainer from '../../components/Shared/ScreenContainer';
import Head from '../../components/Shared/Head';
import {useFormik} from 'formik';
import {_createPasswordSchema} from '../../utils/validationSchemas';
import {formHandler} from '../../utils/formhandler';
import TextInputField from '../../components/Inputs/TextInputField';
import {colors} from '../../config/colors';
import {useDispatch} from 'react-redux';
// import {register} from '../../store/actions/onboarding/register';
import KeyboardAvoidingView from '../../components/Shared/KeyboardAvoidingView';
import {
  submitValidations,
  validatePasswordStrength,
} from '../../utils/validatePasswordStrength';
import {forgotPassword} from '../../store/actions/onboarding/forgotPassword';
import {useTranslation} from 'react-i18next';

const ResetPassword = ({navigation, route}) => {
  const {t} = useTranslation();
  const [passwordStrength, setPasswordStrength] = React.useState([
    {id: 1, title: t('onboarding.password_rule_min_chars'), passed: null},
    {id: 2, title: t('onboarding.password_rule_uppercase'), passed: null},
    {id: 3, title: t('onboarding.password_rule_unique'), passed: null},
    {id: 4, title: t('onboarding.password_rule_lowercase'), passed: null},
    {id: 5, title: t('onboarding.password_rule_number'), passed: null},
  ]);
  const dispatch = useDispatch();
  const {data} = route.params;

  const onSubmit = values => {
    const payload = {
      ...data,
      ...values,
    };

    const err = submitValidations(passwordStrength, form);

    if (err === true) {
    } else {
      dispatch(forgotPassword({navigation, data: payload}));
    }
  };

  const form = useFormik({
    initialValues: {password: '', password_confirmation: ''},
    validationSchema: _createPasswordSchema,
    onSubmit,
  });

  const validatePassword = text => {
    const updatedStrength = validatePasswordStrength(
      text,
      form.values.confirmPassword,
      passwordStrength,
    );

    setPasswordStrength(updatedStrength);

    form.setFieldValue('password', text);
  };

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
              {t('onboarding.create_password_heading')}
            </Text>
            <TextInputField
              {...formHandler('password', form)}
              onChangeText={validatePassword}
              placeholder={t('login.confirm_password_placeholder')}
              label={t('login.password_label')}
              type="password"
              mainStyles={{width: '100%'}}
            />
            <TextInputField
              {...formHandler('password_confirmation', form)}
              placeholder={t('login.confirm_password_placeholder')}
              label={t('login.confirm_password_label')}
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

export default ResetPassword;

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
