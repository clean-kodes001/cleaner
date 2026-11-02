import React, {useCallback, useEffect, useState} from 'react';
import {colors} from '../../config/colors';
import {useDispatch} from 'react-redux';
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
import DeviceInfo from 'react-native-device-info';
import {forgotPassword} from '../../store/actions/onboarding/forgotPassword';
import {forgotPasswordOtpVerification} from '../../store/actions/onboarding/forgotPasswordOtpVerification';
import {useTranslation} from 'react-i18next';

const CELL_COUNT = 4;

const ForgotPasswordOtp = ({navigation, route}) => {
  const {t} = useTranslation();
  const {data} = route.params;

  const dispatch = useDispatch();

  const [value, setValue] = useState('');
  const ref = useBlurOnFulfill({value, cellCount: CELL_COUNT});
  const [device_name, setDeviceName] = useState();

  useEffect(() => {
    (async () => {
      try {
        const device = await DeviceInfo.getDeviceName();
        setDeviceName(device);
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

  const handleVerify = useCallback(
    otpValue => {
      const payload = {
        ...data,
        otp: otpValue,
      };

      dispatch(forgotPasswordOtpVerification({navigation, data: payload}));
    },
    [data, dispatch, navigation],
  );

  useEffect(() => {
    if (value.length === CELL_COUNT) {
      handleVerify(value);
    }
  }, [handleVerify, value]);

  const handleResend = () => {
    const payload = {
      username: data.username,
      device_name,
    };

    dispatch(forgotPassword({navigation, data: payload}));
  };

  useEffect(() => {
    // return () => dispatch({ type: "OTP_VERIFY_CLEAR" });
  }, []);

  return (
    <ScreenContainer style={{flex: 1}}>
      <KeyboardAvoidingView>
        <View style={styles.container}>
          <Head navigation={navigation} />
          <View style={styles.box}>
            <Text medium style={{fontSize: 24, marginBottom: 12}}>
              {t('onboarding.otp_heading')}
            </Text>

            <Text center style={{fontSize: 14, width: '95%'}}>
              {t('onboarding.otp_instruction')}{' '}
              <Text medium style={{fontSize: 14, marginBottom: 8}}>
                {data?.username.slice(0, 4)}.....{data?.username.slice(-9)}.
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
              }}>
              {t('onboarding.otp_did_not_receive')}{' '}
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

export default ForgotPasswordOtp;

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
