import React from 'react';
import {View, TextInput, StyleSheet, Platform} from 'react-native';
import Text from '../Shared/Text';

const TextAreaInputField = ({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  hideError,
  mainStyles,
  ...props
}) => {
  return (
    <View style={[styles.container, mainStyles]}>
      {label && (
        <Text
          fontType={'Roboto'}
          medium
          style={styles.label}>
          {label}
        </Text>
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#ABAFB1"
          multiline
          numberOfLines={Platform.OS === 'ios' ? 6 : 4}
          textAlignVertical="top"
          style={[
            styles.input,
            Platform.OS === 'android' && styles.inputAndroid,
          ]}
          {...props}
        />
      </View>
      
      {!hideError && error && (
        <Text
          notCapitalized
          fontType={'roboto'}
          style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 12,
    marginBottom: 3,
  },
  inputContainer: {
    flex: 1,
    minHeight: Platform.OS === 'ios' ? 150 : 130,
    borderWidth: 0.8,
    borderColor: '#CFD3D4',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    paddingBottom: 12,
    marginBottom: 4,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    color: '#323232',
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    ...Platform.select({
      ios: {
        paddingTop: 0,
      },
      android: {
        paddingTop: 0,
        textAlignVertical: 'top',
      },
    }),
  },
  inputAndroid: {
    // Android-specific text alignment fix
    includeFontPadding: false,
  },
  errorText: {
    marginBottom: 12,
    marginLeft: 4,
    fontSize: 12,
    color: 'red',
  },
});

export default TextAreaInputField;