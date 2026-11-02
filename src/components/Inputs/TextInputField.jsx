import React from 'react';
import Text from '../Shared/Text';
import {View} from 'react-native';
import TextInputFieldRender from './TextInputFieldRender';
import {colors} from '../../config/colors';
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";
import {useTranslation} from 'react-i18next';
const TextInputField = ({
  errorText,
  label,
  data,
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
  secureTextEntry,
  borderError,
  style,
  selectPressed,
  selectValue,
  type,
  hideError,
  error,
  pickerStyle,
  numberOfLines,
  items,
  mainStyles,
  valueType,
  verified,
  mt,
  custom,
  postFix,
  ...props
}) => {
  const {t} = useTranslation();
  return (
    <View style={[{marginTop: mt || 12, display: 'flex'}, mainStyles]}>
      {label &&
        (verified ? (
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 8,
              alignItems: 'center',
              marginBottom: 1,
            }}>
            <Text
              fontType={'Roboto'}
              medium
              style={{fontSize: 12, marginTop: 4, marginBottom: 3}}>
              {label}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                gap: 5,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: colors.brandGreen,
                borderRadius: 12,
                overflow: 'hidden',
                padding: 2,
                paddingRight: 4,
                width: 80,
              }}>
              <MaterialCommunityIcons
                color={'#FFF'}
                size={14}
                name={'check-circle'}
              />
              <Text
                fontType={'roboto'}
                style={{fontSize: 10, color: '#fff'}}
                bold>{t('common.verified')}</Text>
            </View>
          </View>
        ) : (
          <Text
            fontType={'Roboto'}
            medium
            style={{fontSize: 12, marginBottom: 3}}>
            {label}
          </Text>
        ))}

      <TextInputFieldRender
        disabled={disabled}
        defaultCode={defaultCode}
        value={value}
        borderError={borderError}
        postFix={postFix}
        multiline={multiline}
        onChangeText={onChangeText}
        onChangeCountry={onChangeCountry}
        onChange={onChange}
        autoFucus={autoFucus}
        placeholder={placeholder}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        type={type}
        numberOfLines={numberOfLines}
        valueType={valueType}
        custom={custom}
      />
      {!hideError && error && (
        <Text
          notCapitalized
          fontType={'roboto'}
          style={{
            marginTop: 2,
            marginLeft: 4,
            fontSize: 12,
            color: 'red',
          }}>
          {error}
        </Text>
      )}
    </View>
  );
};

export default TextInputField;
