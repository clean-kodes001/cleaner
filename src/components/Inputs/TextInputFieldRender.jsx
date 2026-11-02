import React, {useRef, useState} from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text as RNText,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import AntDesign from '@react-native-vector-icons/ant-design';
import {handleFormNumberValues} from '../../utils/handleFormNumberValues';
import Text from '../Shared/Text';

// Lazy load PhoneInput: it pulls in react-native-country-picker-modal and
// google-libphonenumber, third-party deps with unresolved React 16 peer
// requirements under this app's React 19. A broken install of either must
// only break the phone field itself, not every field that renders through
// this file (email, distance, the postal code input within address) — see
// BUG-0012.
let PhoneInput = null;
let phoneInputLoadError = null;
const getPhoneInput = () => {
  if (PhoneInput || phoneInputLoadError) {
    return PhoneInput;
  }
  try {
    PhoneInput = require('react-native-phone-number-input').default;
  } catch (error) {
    phoneInputLoadError = error;
    console.error('Failed to load PhoneInput:', error);
  }
  return PhoneInput;
};

const cca2ToFlagEmoji = countryCode => {
  const code = (countryCode || '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) {
    return '';
  }
  return code.replace(/[A-Z]/g, c =>
    String.fromCodePoint(127397 + c.charCodeAt(0)),
  );
};

const TextInputFieldRender = ({
  disabled,
  defaultCode,
  value,
  multiline,
  onChangeText,
  onChangeCountry,
  onChange,
  autoFucus,
  placeholder,
  keyboardType,
  type,
  numberOfLines,
  valueType,
  custom,
  postFix,
  borderError,
}) => {
  const secureTextEntry = type === 'password';
  const inputRef = useRef();
  const [showPassword, setShowPassword] = useState(false);
  if (type === 'phone') {
    const normalizedDefaultCode = (defaultCode || 'CA').toUpperCase();
    const PhoneInputComponent = getPhoneInput();

    if (!PhoneInputComponent) {
      return (
        <View
          style={[
            styles.inputContainer,
            styles.withIcon,
            {borderColor: borderError ? 'red' : '#CFD3D4', height: 52},
          ]}>
          <TextInput
            keyboardType="phone-pad"
            autoCorrect={false}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#ABAFB1"
            style={styles.inputStyle}
          />
        </View>
      );
    }

    return (
      <PhoneInputComponent
        value={value}
        onChangeText={onChangeText}
        containerStyle={[
          styles.phoneContainer,
          borderError ? {borderColor: 'red'} : null,
        ]}
        textInputStyle={styles.phoneText}
        textContainerStyle={styles.phoneTextContainer}
        codeTextStyle={styles.phoneCodeText}
        flagButtonStyle={styles.phoneFlagButton}
        onChangeCountry={onChangeCountry}
        onChangeFormattedText={text => {}}
        defaultCode={normalizedDefaultCode}
        countryPickerProps={{
          withEmoji: true,
          withFlag: true,
          renderFlagButton: ({countryCode}) => (
            <View style={styles.phoneFlagWrapper}>
              <RNText style={styles.phoneFlagEmoji}>
                {cca2ToFlagEmoji(countryCode)}
              </RNText>
            </View>
          ),
        }}
        layout="first"
      />
    );
  }

  return (
    <View
      style={[
        styles.inputContainer,
        styles.withIcon,
        {
          borderColor: borderError
            ? 'red'
            : custom
            ? '#211c5b'
            : autoFucus
            ? '#000'
            : '#CFD3D4',
          backgroundColor: type === 'search' ? '#fff' : 'transparent',
          height: type === 'text-area' ? null : 52,
        },
      ]}>
      <Pressable
        onPress={() => {
          inputRef?.current?.focus();
        }}
        style={styles.inner}>
        <TextInput
          ref={inputRef}
          keyboardType={keyboardType || 'default'}
          autoCapitalize="none"
          disabled={disabled}
          enabled={!disabled}
          editable={!disabled}
          multiline={type === 'text-area' ? true : multiline}
          placeholder={placeholder}
          autoCorrect={false}
          numberOfLines={type === 'text-area' ? 5 : numberOfLines}
          placeholderTextColor="#ABAFB1"
          value={value}
          onChange={onChange}
          onChangeText={text => {
            if (valueType === 'number') {
              handleFormNumberValues(onChangeText, text);
            } else {
              onChangeText(text);
            }
          }}
          style={[
            styles.inputStyle,
            {minHeight: Platform.OS === 'ios' ? 100 : null},
          ]}
          autoFocus={autoFucus}
          maxFontSizeMultiplier={0}
          secureTextEntry={secureTextEntry && !showPassword}
        />
        {postFix ? (
          <Text
            fontType={'roboto'}
            style={{color: '#323232', fontSize: 14, marginBottom: 1}}>
            {postFix}
          </Text>
        ) : (
          <></>
        )}
      </Pressable>
      {type === 'search' ? (
        <AntDesign name="search1" size={22} />
      ) : (
        type === 'password' && (
          <TouchableOpacity onPress={() => setShowPassword(prev => !prev)}>
            {showPassword ? (
              <Ionicons name="eye-off-outline" size={22} color="black" />
            ) : (
              <Ionicons name="eye-outline" size={22} color="black" />
            )}
          </TouchableOpacity>
        )
      )}
    </View>
  );
};

export default TextInputFieldRender;

const styles = StyleSheet.create({
  inputContainer: {
    paddingRight: 14,
    paddingLeft: 14,
    width: '100%',
    borderRadius: 8,
    borderWidth: 0.8,
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  phoneContainer: {
    width: '100%',
    backgroundColor: 'transparent',
    borderColor: '#CFD3D4',
    borderRadius: 8,
    height: 52,
    borderWidth: 0.8,
    alignItems: 'center',
  },
  phoneText: {
    color: '#323232',
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    height: 50,
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  phoneTextContainer: {
    backgroundColor: 'transparent',
    paddingVertical: 0,
    paddingHorizontal: 0,
    height: 50,
    justifyContent: 'center',
  },
  phoneCodeText: {
    color: '#323232',
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
  },
  phoneFlagButton: {
    marginLeft: 8,
    height: 50,
    justifyContent: 'center',
  },
  phoneFlagWrapper: {
    width: 30,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneFlagEmoji: {
    fontSize: 20,
  },
  inputStyle: {
    flex: 1,
    color: '#323232',
    marginEnd: 14,
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
  },
  withIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
