import React, {useRef, useState, useEffect, useMemo, useCallback} from 'react';
import {View, Keyboard, Platform} from 'react-native';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import Text from '../Shared/Text';
import {colors} from '../../config/colors';
import googleLocation from '../../../googleLocation.json';
import {useTranslation} from 'react-i18next';

const GOOGLE_API_KEY = googleLocation.APIkey;

const AddressAutocomplete = ({
  label,
  value,
  onChangeText,
  onAddressSelected,
  error,
  hideError,
  mainStyles,
  placeholder,
  mt,
  disabled = false,
}) => {
  const {t} = useTranslation();
  const ref = useRef();
  const [isFocused, setIsFocused] = useState(false);
  const userHasInteractedRef = useRef(false);
  const initialValueRef = useRef(value || '');

  const currentTextRef = useRef(value || '');
  const onChangeTextRef = useRef(onChangeText);
  useEffect(() => {
    onChangeTextRef.current = onChangeText;
  });

  useEffect(() => {
    if (value !== undefined && value !== currentTextRef.current) {
      currentTextRef.current = value;
      if (ref.current && typeof ref.current.setAddressText === 'function') {
        ref.current.setAddressText(value);
      }
    }
  }, [value]);

  useEffect(() => {
    const initialText = currentTextRef.current;
    if (initialText && initialText.trim() !== '' && ref.current) {
      const setTextOnRef = () => {
        if (ref.current) {
          if (typeof ref.current.setAddressText === 'function') {
            ref.current.setAddressText(initialText);
          }
          if (
            ref.current._textInput &&
            typeof ref.current._textInput.setNativeProps === 'function'
          ) {
            ref.current._textInput.setNativeProps({text: initialText});
          }
        }
      };
      const timer1 = setTimeout(setTextOnRef, 300);
      const timer2 = setTimeout(setTextOnRef, 800);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, []);

  const handleAddressSelect = useCallback(
    (data, details = null) => {
      if (!details) {
        userHasInteractedRef.current = true;
        currentTextRef.current = data.description;
        if (onChangeTextRef.current) {
          onChangeTextRef.current(data.description);
        }
        Keyboard.dismiss();
        return;
      }

      const addressComponents = details.address_components || [];
      let postalCode = '';
      let city = '';
      let province = '';
      let provinceShort = '';
      let country = '';

      addressComponents.forEach(component => {
        const types = component.types || [];
        if (types.includes('postal_code')) {
          postalCode = component.long_name;
        }
        if (
          types.includes('locality') ||
          types.includes('administrative_area_level_2')
        ) {
          city = component.long_name;
        }
        if (types.includes('administrative_area_level_1')) {
          province = component.long_name;
          provinceShort = component.short_name;
        }
        if (types.includes('country')) {
          country = component.short_name;
        }
      });

      const addressData = {
        formatted_address: data.description,
        postal_code: postalCode,
        city: city,
        province: province,
        province_short: provinceShort,
        country: country,
        coordinates: {
          lat: details.geometry?.location?.lat,
          lng: details.geometry?.location?.lng,
        },
      };

      userHasInteractedRef.current = true;
      currentTextRef.current = data.description;

      if (onChangeTextRef.current) {
        onChangeTextRef.current(data.description);
      }
      if (onAddressSelected) {
        onAddressSelected(addressData);
      }
      Keyboard.dismiss();
    },
    [onAddressSelected],
  );

  const displayError = error;
  const borderColor = displayError
    ? colors.danger
    : isFocused
    ? '#000'
    : '#CFD3D4';

  const query = useMemo(
    () => ({
      key: GOOGLE_API_KEY,
      language: 'en',
      components: 'country:ca',
    }),
    [],
  );

  const textInputProps = useMemo(
    () => ({
      editable: !disabled,
      onFocus: () => {
        setIsFocused(true);
      },
      onBlur: () => {
        setIsFocused(false);
        Keyboard.dismiss();
      },
      onChangeText: inputText => {
        currentTextRef.current = inputText;
        if (inputText.trim() !== initialValueRef.current.trim()) {
          userHasInteractedRef.current = true;
        }
        if (onChangeTextRef.current) {
          onChangeTextRef.current(inputText);
        }
      },
      placeholderTextColor: '#ABAFB1',
    }),
    [disabled],
  );

  const googlePlacesStyles = useMemo(
    () => ({
      container: {
        flex: 0,
        zIndex: 9999,
        position: 'relative',
      },
      textInputContainer: {
        backgroundColor: 'transparent',
        borderTopWidth: 0,
        borderBottomWidth: 0,
        paddingHorizontal: 0,
        marginHorizontal: 0,
      },
      textInput: {
        backgroundColor: 'transparent',
        borderColor: borderColor,
        borderWidth: 0.8,
        borderRadius: 8,
        height: 52,
        paddingHorizontal: 14,
        color: '#323232',
        fontSize: 14,
        fontFamily: 'Roboto-Regular',
      },
      listView: {
        backgroundColor: '#fff',
        borderRadius: 8,
        marginTop: 4,
        elevation: Platform.OS === 'android' ? 3 : 0,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        maxHeight: 240,
        zIndex: 99999,
        position: 'absolute',
        top: 56,
        left: 0,
        right: 0,
      },
      row: {
        padding: 12,
        minHeight: 44,
      },
      description: {
        color: '#000',
      },
      predefinedPlacesDescription: {
        color: '#000',
      },
    }),
    [borderColor],
  );

  return (
    <View
      style={[
        {
          marginTop: mt || 12,
          display: 'flex',
          zIndex: 9999,
          position: 'relative',
        },
        mainStyles,
      ]}>
      {label && (
        <Text
          fontType={'Roboto'}
          medium
          style={{fontSize: 12, marginBottom: 3}}>
          {label}
        </Text>
      )}

      <GooglePlacesAutocomplete
        ref={ref}
        placeholder={placeholder ?? t('profile.placeholder_address')}
        textInputProps={textInputProps}
        onPress={handleAddressSelect}
        styles={googlePlacesStyles}
        onFail={err => {
          console.warn('Google Places error:', err);
        }}
        fetchDetails={true}
        query={query}
        debounce={300}
        minLength={2}
        enablePoweredByContainer={false}
        listViewDisplayed="auto"
        renderDescription={row => row.description}
        suppressDefaultStyles={false}
        enableHighAccuracyLocation={false}
        filterReverseGeocodingByTypes={[
          'locality',
          'administrative_area_level_3',
        ]}
        predefinedPlaces={[]}
        predefinedPlacesAlwaysVisible={false}
        keyboardShouldPersistTaps="always"
        nestedScrollEnabled={true}
        timeout={10000}
      />

      {!hideError && displayError && (
        <Text
          notCapitalized
          fontType={'roboto'}
          style={{
            marginTop: 2,
            marginLeft: 4,
            fontSize: 12,
            color: 'red',
          }}>
          {displayError}
        </Text>
      )}
    </View>
  );
};

export default AddressAutocomplete;
