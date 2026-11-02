import React, {useCallback, useEffect, useState} from 'react';
import {colors} from '../../config/colors';
import {useDispatch, useSelector} from 'react-redux';
import {View, StyleSheet} from 'react-native';
import Head from '../../components/Shared/Head';
import Text from '../../components/Shared/Text';
import Button from '../../components/Shared/Button';
import ScreenContainer from '../../components/Shared/ScreenContainer';
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';
import OTPTimer from '../../utils/OTPTimer';
import KeyboardAvoidingView from '../../components/Shared/KeyboardAvoidingView';

import {secureProfileEdit} from '../../store/actions/profile/secureProfileEdit';
import {useTranslation} from 'react-i18next';

const CELL_COUNT = 4;

const EditProfileOtp = ({navigation, route}) => {
  const {t} = useTranslation();
  const {data} = route.params;

  const dispatch = useDispatch();

  const [value, setValue] = useState('');
  const ref = useBlurOnFulfill({value, cellCount: CELL_COUNT});

  useEffect(() => {
    setValue('');
    (async () => {
      try {
        setValue('');
      } catch (error) {
        console.warn('getDeviceName error:', error);
      }
    })();
  }, []);

  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    value,
    setValue,
  });

  const [minutes, setMinutes] = useState(2);
  const [seconds, setSeconds] = useState(0);

  const {user} = useSelector(state => state.user);

  const handleEditProfile = useCallback(
    otpValue => {
      const formData = new FormData();

      formData.append('first_name', user.first_name);
      formData.append('last_name', user.last_name);
      formData.append('other_name', user.other_name);
      formData.append('dob', user.dob);
      // formData.append('postal_code', user?.postal_code);
      // formData.append('address', user?.address);
      // formData.append('country_id', user?.country_id);
      // formData.append('state_id', user?.state_id);
      // formData.append('city_id', user?.city_id);
      formData.append('gender_id', user?.gender_id);
      // `|| ''` is load-bearing: FormData stringifies whatever it is handed, so an
      // account with no work radius on file would post the literal "null"/"undefined"
      // and the whole save would come back rejected on `distance` — on an OTP screen
      // that is only here to confirm an email/phone/address change (BUG-0027).
      formData.append('distance', user?.distance || '');
      formData.append('phone', data?.phone);
      formData.append('email', data?.email);
      formData.append(
        'postal_code',
        data?.postal_code ? data?.postal_code.replace(/\s+/g, '') : '',
      );
      formData.append('address', data?.address);

      formData.append('country_id', data?.country.id);
      formData.append('state_id', data?.state.id);
      formData.append('city_id', data?.city.id);
      if (otpValue) {
        formData.append('otp', otpValue);
      }

      dispatch(
        secureProfileEdit({
          data: formData,
          navigation: navigation,
          resending: otpValue ? false : true,
        }),
      );
    },
    [data, dispatch, navigation, user],
  );

  useEffect(() => {
    let countDown;
    countDown = setInterval(() => {
      if (!seconds) {
        if (!minutes) {
        } else {
          setMinutes(minutes => minutes - 1);
          setSeconds(59);
        }
      }
      if (seconds > 0) {
        setSeconds(seconds => seconds - 1);
      }
    }, 1000);

    if (!minutes && !seconds) {
      clearInterval(countDown);
    }
    return () => clearInterval(countDown);
  }, [seconds, minutes]);

  const handleResendButton = () => {
    setMinutes(2);
    setSeconds(0);

    handleResend();
  };

  useEffect(() => {
    if (value.length === CELL_COUNT) {
      handleVerify(value);
    }
  }, [handleVerify, value]);

  const handleVerify = useCallback(
    otpValue => {
      handleEditProfile(otpValue);
      setValue('');
    },
    [handleEditProfile],
  );

  const handleResend = () => {
    handleEditProfile();
  };

  useEffect(() => {
    return () => dispatch({type: 'OTP_VERIFY_CLEAR'});
  }, [dispatch]);

  return (
    <ScreenContainer style={{flex: 1}}>
      <KeyboardAvoidingView>
        <View style={styles.container}>
          <Head navigation={navigation} />
          <View style={styles.box}>
            <Text medium style={{fontSize: 24, marginBottom: 12}}>{t('onboarding.otp_heading')}</Text>

            <Text center style={{fontSize: 14, width: '95%'}}>{t('onboarding.otp_instruction')}{' '}
              <Text medium style={{fontSize: 14, marginBottom: 8}}>
                {user?.email.slice(0, 4)}.....{user?.email.slice(-9)}.
              </Text>
            </Text>
            <CodeField
              ref={ref}
              {...props}
              autoFocus={true}
              value={value}
              cellCount={CELL_COUNT}
              rootStyle={styles.codeFieldRoot}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              onChangeText={value => {
                setValue(value);
              }}
              renderCell={({index, symbol, isFocused}) => (
                <View key={index} style={styles.cellContainer}>
                  <Text
                    medium
                    key={index}
                    style={[styles.cell, isFocused && styles.focusCell]}
                    onLayout={getCellOnLayoutHandler(index)}>
                    {symbol || (isFocused ? <Cursor /> : null)}
                  </Text>
                </View>
              )}
            />
            <OTPTimer minutes={minutes} seconds={seconds} />
            <Text
              center
              style={{
                fontSize: 14,
                color: colors.grayText,
                marginVertical: 4,
                paddingVertical: 4,
              }}>{t('onboarding.otp_did_not_receive')}{' '}
              <Text
                medium
                onPress={minutes || seconds ? null : handleResendButton}
                style={{
                  color:
                    minutes || seconds ? colors.fadedText : colors.primaryText,
                }}>
                {t('onboarding.otp_resend_link')}
              </Text>
            </Text>

            <Button
              // pressed={form.handleSubmit}
              height={50}
              text={t('common.back')}
              pressed={() => navigation.goBack()}
              style={{
                width: '100%',
                marginBottom: 12,
                backgroundColor: '#000',
                marginTop: 16,
              }}
            />

            <View
              style={{flexDirection: 'row', justifyContent: 'center'}}></View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

export default EditProfileOtp;

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
  codeFieldRoot: {
    marginTop: 20,
    marginBottom: 10,
    gap: 10,

    paddingLeft: 10,

    justifyContent: 'center',
  },
  cellContainer: {
    // backgroundColor: "#F9F9FA",
  },
  cell: {
    width: 44,
    height: 44,
    backgroundColor: '#fff',
    borderWidth: 0.8,
    borderColor: '#000',
    borderRadius: 8,
    lineHeight: 44,

    textAlign: 'center',
    fontSize: 24,
  },
  focusCell: {
    borderColor: colors.primary,
  },
});
