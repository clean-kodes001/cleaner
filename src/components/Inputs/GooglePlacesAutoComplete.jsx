import React, {useEffect, useRef} from 'react';
import {Alert, Keyboard, Pressable} from 'react-native';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import Text from '../Shared/Text';
import {showToast} from '../../utils/showToast';
import {useTranslation} from 'react-i18next';

const GooglePlacesInput = ({handleAddressChanged, bottomSheetRef}) => {
  const {t} = useTranslation();
  const ref = useRef();

  useEffect(() => {});

  return (
    <View style={{flex: 1}}>
      <GooglePlacesAutocomplete
        placeholder={t('googlePlaces.search_placeholder')}
        ref={ref}
        onPress={(data, details = null) => {
          handleAddressChanged({
            formatted_address: data.description,
            lng: details.geometry.location.lng,
            lat: details.geometry.location.lat,
          });
        }}
        keyboardShouldPersistTaps="handled"
        // numberOfLines={5}
        styles={{
          textInputContainer: {
            fontSize: 16,
            // backgroundColor: 'grey',
            marginHorizontal: 12,
            marginTop: 20,
          },
          textInput: {
            borderColor: '#211c5b',
            borderWidth: 0.7,
            borderRadius: 0,
            // height: 38,
            color: '#000',
            // fontSize: 16,
          },
          predefinedPlacesDescription: {
            color: '#000',
          },
        }}
        onFail={error =>
          showToast({type: 0, message: t('googlePlaces.error_fetching')})
        }
        fetchDetails={true}
        nearbyPlacesAPI="GooglePlacesSearch"
        query={{
          key: 'AIzaSyDn0UxJc8Jvk-e_mAabhB1F_AQynS9y3g0',
          language: 'en',
        }}
      />
    </View>
  );
};

export default GooglePlacesInput;
