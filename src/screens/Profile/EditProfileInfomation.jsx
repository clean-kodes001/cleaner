import React, {useCallback, useEffect, useState, useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import ScreenContainer from '../../components/Shared/ScreenContainer';
import KeyboardAvoidingView from '../../components/Shared/KeyboardAvoidingView';
import {useDispatch, useSelector} from 'react-redux';
import Button from '../../components/Shared/Button';
import TextInputField from '../../components/Inputs/TextInputField';
import Select from '../../components/Inputs/Select';
import Datepicker from '../../components/Inputs/DatePicker';
import Head from '../../components/Shared/Head';
import {formatDateOnly} from '../../utils/dateOnly';
import {uploadUserProfile} from '../../store/actions/profile/uploadUserProfile';
import {useFocusEffect} from '@react-navigation/native';
import {validatePostalCode} from '../../utils/validatePostalCode';
import {validatePhoneNumber} from '../../utils/validatePhone';
import AddressAutocomplete from '../../components/Inputs/AddressAutocomplete';
import SearchSelect from '../../components/Inputs/SearchSelect';
import {showToast} from '../../utils/showToast';
import {CANADIAN_PROVINCES} from '../../utils/googlePlaces';
import {useTranslation} from 'react-i18next';

const addressProvinceConflicts = (address, stateName) => {
  if (!address || !stateName) return false;
  const lower = address.toLowerCase();
  const selectedName = stateName.toLowerCase();
  return CANADIAN_PROVINCES.some(p => {
    const pName = p.name.toLowerCase();
    const pCode = p.id.toLowerCase();
    if (pName === selectedName) return false;
    const shortCodePattern = new RegExp(`(?:,\\s*|\\s)${pCode}(?:\\s|,|$)`);
    return lower.includes(pName) || shortCodePattern.test(lower);
  });
};

const EditProfileInfomation = ({navigation, route}) => {
  const {t} = useTranslation();
  const {itemID, title} = route.params;

  const {unAuthenticated} = useSelector(state => state.data);
  const {user} = useSelector(state => state.user);
  const dispatch = useDispatch();
  // Helper to get initial form values from user data
  const getInitialFormValues = () => ({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    other_name: user?.other_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dob: formatDateOnly(user?.dob),
    distance: user?.distance ? String(user?.distance) : '',
    postal_code: user?.postal_code || '',
    address: user?.address || '',
    gender: user?.gender_id
      ? unAuthenticated?.gender?.find(g => g.id === user.gender_id)
      : null,
    city: user?.city_id
      ? unAuthenticated?.cities?.find(c => c.id === user.city_id)
      : null,
    state: user?.state_id
      ? unAuthenticated?.states?.find(s => s.id === user.state_id)
      : null,
    country: user?.country_id
      ? unAuthenticated?.countries?.find(c => c.id === user.country_id)
      : null,
  });

  // Local state for form values - completely replacing Formik
  // Initialize directly with user values
  const [formValues, setFormValues] = useState(getInitialFormValues);
  const [errors, setErrors] = useState({});
  const [cities, setCities] = useState([]);
  const [states, setStates] = useState([]);
  const [postalCodeError, setPostalCodeError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [addressLocked, setAddressLocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Re-sync form values when user data changes (e.g., after profile update)
  useEffect(() => {
    setFormValues(getInitialFormValues());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.first_name, user?.phone, user?.email, user?.address, user?.distance]);

  // Initialize states/cities based on user location
  useEffect(() => {
    setStates(
      unAuthenticated.states?.filter(
        state => state.country_id === Number(user?.country_id),
      ) || [],
    );
    setCities(
      unAuthenticated.cities?.filter(
        city => city.state_id === Number(user?.state_id),
      ) || [],
    );
  }, [user, unAuthenticated]);

  const _genders = useMemo(() => [
    ...(unAuthenticated?.gender || []),
    {id: 0, name: t('profile.gender_not_identify')},
  ], [unAuthenticated?.gender, t]);

  // Update a single field value
  const updateField = useCallback((fieldName, value) => {
    setFormValues(prev => ({...prev, [fieldName]: value}));
    // Clear error for this field when user starts typing
    setErrors(prev => ({...prev, [fieldName]: ''}));
  }, []);

  // Check if form has changes compared to original user data
  const hasChanges = useMemo(() => {
    if (!user || Object.keys(formValues).length === 0) return false;

    switch (itemID) {
      case 'name':
        return (
          formValues.first_name !== (user.first_name || '') ||
          formValues.last_name !== (user.last_name || '') ||
          formValues.other_name !== (user.other_name || '')
        );
      case 'distance':
        return String(formValues.distance) !== String(user.distance || '');
      case 'phone':
        return formValues.phone !== (user.phone || '');
      case 'email':
        return formValues.email !== (user.email || '');
      case 'dob':
        const formDate = formatDateOnly(formValues.dob);
        const userDate = formatDateOnly(user.dob);
        return formDate !== userDate;
      case 'gender':
        return Number(formValues.gender?.id) !== Number(user.gender_id);
      case 'address':
        return (
          formValues.address !== (user.address || '') ||
          formValues.postal_code?.replace(/\s+/g, '') !== (user.postal_code?.replace(/\s+/g, '') || '') ||
          Number(formValues.city?.id) !== Number(user.city_id) ||
          Number(formValues.state?.id) !== Number(user.state_id) ||
          Number(formValues.country?.id) !== Number(user.country_id)
        );
      default:
        return false;
    }
  }, [formValues, user, itemID]);

  // Validate form based on itemID
  const validateForm = useCallback(() => {
    const newErrors = {};

    switch (itemID) {
      case 'distance':
        if (!formValues.distance || formValues.distance.trim() === '') {
          newErrors.distance = 'Distance is required';
        } else if (isNaN(Number(formValues.distance)) || Number(formValues.distance) <= 0) {
          newErrors.distance = 'Please enter a valid distance';
        }
        break;
      case 'phone':
        if (!formValues.phone || formValues.phone.trim() === '') {
          newErrors.phone = 'Phone number is required';
        } else if (phoneError) {
          newErrors.phone = phoneError;
        }
        break;
      case 'email':
        if (!formValues.email || formValues.email.trim() === '') {
          newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@.]+\.[A-Za-z]{3,}$/.test(formValues.email)) {
          newErrors.email = 'Please enter a valid email';
        }
        break;
      case 'gender':
        if (!formValues.gender || formValues.gender.id === undefined) {
          newErrors.gender = 'Please select a gender';
        }
        break;
      case 'address':
        if (!formValues.address || formValues.address.trim() === '') {
          newErrors.address = 'Address is required';
        } else if (addressProvinceConflicts(formValues.address, formValues.state?.name)) {
          newErrors.address = 'Address province does not match selected province';
        }
        if (!formValues.state?.id) {
          newErrors.state = 'Please select a province/state';
        }
        if (!formValues.city?.id) {
          newErrors.city = 'Please select a city';
        }
        if (postalCodeError) {
          newErrors.postal_code = postalCodeError;
        }
        break;
      case 'name':
        // Names are disabled, so no validation needed
        break;
      case 'dob':
        // DOB is disabled, so no validation needed
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formValues, itemID, phoneError, postalCodeError]);

  // Check if form is valid (no errors and all required fields filled)
  const isFormValid = useMemo(() => {
    // Run validation logic without setting state
    switch (itemID) {
      case 'distance':
        return formValues.distance && 
               formValues.distance.trim() !== '' && 
               !isNaN(Number(formValues.distance)) && 
               Number(formValues.distance) > 0;
      case 'phone':
        return formValues.phone && 
               formValues.phone.trim() !== '' && 
               !phoneError;
      case 'email':
        return formValues.email && 
               formValues.email.trim() !== '' && 
               /^[^\s@]+@[^\s@.]+\.[A-Za-z]{3,}$/.test(formValues.email);
      case 'gender':
        return formValues.gender && formValues.gender.id !== undefined;
      case 'address':
        return formValues.address &&
               formValues.address.trim() !== '' &&
               formValues.state?.id &&
               formValues.city?.id &&
               !postalCodeError &&
               !addressProvinceConflicts(formValues.address, formValues.state?.name);
      case 'name':
      case 'dob':
        // These are disabled, always valid
        return true;
      default:
        return true;
    }
  }, [formValues, itemID, phoneError, postalCodeError]);

  // Button should be enabled if: has changes AND form is valid
  const isButtonEnabled = hasChanges && isFormValid && !isSubmitting;

const handleSubmit = useCallback(() => {
  if (!validateForm()) {
    showToast({
      type: 'error',
      title: 'Validation Error',
      message: t('common.fix_errors_before_submit'),
    });
    return;
  }

  if (!hasChanges) {
    showToast({
      type: 'info',
      title: 'No Changes',
      message: "You haven't made any changes to your profile.",
    });
    return;
  }

  setIsSubmitting(true);

  const formData = new FormData();

  // Base values from user - send all required fields to avoid backend validation errors
  const baseData = {
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    other_name: user?.other_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dob: user?.dob || '',
    distance: user?.distance || '',
    gender_id: user?.gender_id ?? 0,   
    address: user?.address || '',
    postal_code: user?.postal_code?.replace(/\s+/g, '') || '',
    country_id: user?.country_id || '',
    state_id: user?.state_id || '',
    city_id: user?.city_id || '',
  };

  // Override the field(s) being edited based on itemID
  switch (itemID) {
    case 'name':
      baseData.first_name = formValues.first_name || '';
      baseData.last_name = formValues.last_name || '';
      baseData.other_name = formValues.other_name || '';
      break;
      
    case 'distance':
      baseData.distance = formValues.distance || '';
      break;
      
    case 'phone':
      baseData.phone = formValues.phone || '';
      break;
      
    case 'email':
      baseData.email = formValues.email || '';
      break;
      
    case 'dob':
      baseData.dob = formValues.dob || '';
      break;
      
    case 'gender':
      if (formValues.gender?.id !== undefined && formValues.gender?.id !== null) {
        baseData.gender_id = formValues.gender.id;
      }
      break;
      
    case 'address':
      baseData.address = formValues.address || '';
      baseData.postal_code = formValues.postal_code?.replace(/\s+/g, '') || '';
      baseData.country_id = formValues.country?.id || user?.country_id || '';
      baseData.state_id = formValues.state?.id || user?.state_id || '';
      baseData.city_id = formValues.city?.id || user?.city_id || '';
      break;
      
    default:
      break;
  }

  // Append all fields to formData
  Object.entries(baseData).forEach(([key, value]) => {
    formData.append(key, value);
  });

  // Determine if this update requires OTP verification (secure update)
  // Secure updates: email, phone, address changes
  // Non-secure updates: distance, gender (can use PUT method)
  const isSecureUpdate = ['email', 'phone', 'address'].includes(itemID);

  dispatch(
    uploadUserProfile({
      data: formData,
      navigation: navigation,
      secureUpdate: isSecureUpdate,
      securedData: formValues,
    }),
  ).finally(() => {
    setIsSubmitting(false);
  });
}, [formValues, user, itemID, hasChanges, validateForm, dispatch, navigation]);

  // Validate postal code for Canada
  const validateCanadianPostalCode = useCallback((postalCode) => {
    if (!postalCode || postalCode.trim() === '') {
      setPostalCodeError('');
      return;
    }

    const localValidation = validatePostalCode(postalCode, 'CA', true);
    if (localValidation.error) {
      setPostalCodeError(localValidation.error);
    } else {
      if (localValidation.formatted !== postalCode) {
        updateField('postal_code', localValidation.formatted);
      }
      setPostalCodeError('');
    }
  }, [updateField]);

  // Validate phone number
  const validateCanadianPhone = useCallback((phoneNumber) => {
    if (!phoneNumber || phoneNumber.trim() === '') {
      setPhoneError('');
      return;
    }

    const countryCode = user?.country_id === 1 ? 'CA' : user?.country_id === 2 ? 'NG' : 'CA';
    const formattedPhoneNumber = countryCode === 'CA' ? '1' + phoneNumber : phoneNumber;
    const result = validatePhoneNumber(formattedPhoneNumber, countryCode);

    if (!result.isValid) {
      setPhoneError(result.error);
    } else {
      setPhoneError('');
    }
  }, [user?.country_id]);

  // Handle address selection from Google Places
  const handleAddressSelected = useCallback((addressData) => {
    updateField('address', addressData.formatted_address);
    setAddressLocked(true);

    if (addressData.postal_code) {
      updateField('postal_code', addressData.postal_code);
      validateCanadianPostalCode(addressData.postal_code);
    }

    if (addressData.province) {
      const provinceEntry = CANADIAN_PROVINCES.find(p => p.id === addressData.province);
      const matchedState = states.find(
        s => s.name.toLowerCase() === provinceEntry?.name?.toLowerCase(),
      );
      if (matchedState) {
        const stateCities =
          unAuthenticated.cities?.filter(
            c => c.state_id === Number(matchedState.id),
          ) || [];
        updateField('state', {name: matchedState.name, id: matchedState.id});
        setCities(stateCities);
        const matchedCity = addressData.city
          ? stateCities.find(
              c => c.name.toLowerCase() === addressData.city.toLowerCase(),
            )
          : null;
        updateField('city', matchedCity ? {name: matchedCity.name, id: matchedCity.id} : null);
      }
    }
  }, [updateField, validateCanadianPostalCode, states, unAuthenticated.cities]);

  const handleAddressChange = useCallback((text) => {
    updateField('address', text);
    if (!text || text.trim() === '') {
      setAddressLocked(false);
    }
  }, [updateField]);

  // Handle state change - update cities list
  const handleStateChange = useCallback((text, id) => {
    updateField('state', {name: text, id});
    updateField('city', null);
    setCities(
      unAuthenticated.cities?.filter(city => city.state_id === Number(id)) || [],
    );
  }, [updateField, unAuthenticated.cities]);

  // Handle country change - update states list
  const handleCountryChange = useCallback((text, id) => {
    if (text === 'Canada') {
      updateField('countryCode', 'CA');
      updateField('callingCode', '1');
    }
    updateField('country', {name: text, id});
    updateField('state', null);
    updateField('city', null);
    setStates(
      unAuthenticated.states?.filter(state => state.country_id === Number(id)) || [],
    );
  }, [updateField, unAuthenticated.states]);

  useFocusEffect(useCallback(() => {}, []));

  return (
    <ScreenContainer style={{flex: 1, backgroundColor: '#FFF'}}>
      <View
        style={{
          paddingHorizontal: 32,
          borderBottomColor: '#e5e5e5',
          borderBottomWidth: 2,
        }}>
        <Head pageTitle={title} type={2} navigation={navigation} />
      </View>
      <KeyboardAvoidingView style={styles.container}>
        <View>
          {itemID === 'name' && (
            <>
              <TextInputField
                disabled
                value={formValues.first_name || ''}
                onChangeText={(text) => updateField('first_name', text)}
                placeholder={t('profile.placeholder_first_name')}
                label={t('profile.label_first_name')}
                mainStyles={{width: '100%'}}
              />
              <TextInputField
                disabled
                value={formValues.other_name || ''}
                onChangeText={(text) => updateField('other_name', text)}
                placeholder={t('profile.placeholder_other_name')}
                label={t('profile.label_other_name')}
                mainStyles={{width: '100%'}}
              />
              <TextInputField
                disabled
                value={formValues.last_name || ''}
                onChangeText={(text) => updateField('last_name', text)}
                placeholder={t('profile.placeholder_last_name')}
                label={t('profile.label_last_name')}
                mainStyles={{width: '100%'}}
              />
            </>
          )}
          {itemID === 'distance' && (
            <TextInputField
              value={formValues.distance || ''}
              onChangeText={(text) => updateField('distance', text)}
              placeholder={t('profile.placeholder_km')}
              keyboardType={'numeric'}
              postFix={'km'}
              label={t('profile.label_distance_proximity')}
              error={errors.distance}
            />
          )}
          {itemID === 'phone' && (
            <TextInputField
              verified
              value={formValues.phone || ''}
              onChangeText={(text) => {
                updateField('phone', text);
                validateCanadianPhone(text);
              }}
              error={phoneError || errors.phone}
              defaultCode={
                user?.country_id === 2
                  ? 'NG'
                  : user?.country_id === 1
                  ? 'CA'
                  : null
              }
              onChangeCountry={({callingCode, cca2}) => {
                if (cca2 === 'CA') {
                  updateField('country', {id: 1, name: 'Canada'});
                  updateField('state', null);
                  updateField('city', null);
                  updateField('countryCode', cca2);
                  updateField('callingCode', callingCode[0]);
                  setStates(
                    unAuthenticated.states?.filter(
                      state => state.country_id === Number(1),
                    ) || [],
                  );
                }
              }}
              type="phone"
              keyboardType="numeric"
              placeholder=""
              label={t('profile.label_phone_number')}
            />
          )}
          {itemID === 'address' && (
            <>
              {user?.country_id !== formValues.country?.id && (
                <TextInputField
                  verified
                  value={formValues.phone || ''}
                  onChangeText={(text) => updateField('phone', text)}
                  defaultCode={
                    user?.country_id === 2
                      ? 'NG'
                      : user?.country_id === 1
                      ? 'CA'
                      : null
                  }
                  onChangeCountry={({callingCode, cca2}) => {
                    if (cca2 === 'CA') {
                      updateField('country', {id: 1, name: 'Canada'});
                      updateField('state', null);
                      updateField('city', null);
                      updateField('countryCode', cca2);
                      updateField('callingCode', callingCode[0]);
                      setStates(
                        unAuthenticated.states?.filter(
                          state => state.country_id === Number(1),
                        ) || [],
                      );
                    }
                  }}
                  type="phone"
                  keyboardType="numeric"
                  placeholder=""
                  label={t('profile.label_phone_number')}
                />
              )}

              <AddressAutocomplete
                label={t('profile.label_address')}
                value={formValues.address || ''}
                onChangeText={handleAddressChange}
                onAddressSelected={handleAddressSelected}
                error={errors.address}
                placeholder={t('profile.placeholder_search_address')}
                disabled={addressLocked}
              />
              <View style={styles.doubleSelect}>
                <Select
                  disabled={true}
                  value={formValues.country}
                  onValueChange={handleCountryChange}
                  styles={{width: '47%'}}
                  label={t('profile.label_country')}
                  list={unAuthenticated.countries?.filter(c => c.id !== 2) /* Nigeria disabled */}
                  error={errors.country}
                />
                <SearchSelect
                  value={formValues.state}
                  disabled={!states?.length || !formValues.country}
                  onValueChange={handleStateChange}
                  styles={{width: '47%'}}
                  label={
                    formValues.country?.id === 1
                      ? t('profile.label_province')
                      : formValues.country?.id === 2
                      ? t('profile.label_state')
                      : t('profile.label_province_state')
                  }
                  list={states}
                  error={errors.state}
                />
              </View>
              <View style={styles.doubleSelect}>
                <SearchSelect
                  value={formValues.city}
                  disabled={!cities?.length || !formValues.state || !formValues.country}
                  onValueChange={(text, id) => updateField('city', {name: text, id})}
                  styles={{width: '47%'}}
                  label={t('profile.label_city_town_village')}
                  list={cities}
                  error={errors.city}
                />
                <TextInputField
                  value={formValues.postal_code || ''}
                  onChangeText={(text) => {
                    updateField('postal_code', text);
                    validateCanadianPostalCode(text);
                  }}
                  placeholder={t('profile.placeholder_postal_code')}
                  label={t('profile.label_postal_code')}
                  autoCapitalize="characters"
                  error={postalCodeError || errors.postal_code}
                  mainStyles={{width: '47%'}}
                />
              </View>
            </>
          )}
          {itemID === 'email' && (
            <TextInputField
              verified
              value={formValues.email || ''}
              onChangeText={(text) => updateField('email', text)}
              placeholder={t('profile.placeholder_email')}
              label={t('login.email_label')}
              keyboardType={'email-address'}
              error={errors.email}
            />
          )}
          {itemID === 'gender' && (
            <Select
              value={formValues.gender}
              onValueChange={(text, id) => updateField('gender', {name: text, id})}
              styles={{width: '100%'}}
              label={t('profile.label_gender')}
              list={_genders}
              error={errors.gender}
            />
          )}
          {itemID === 'dob' && (
            <Datepicker
              disabled
              fullWidth
              label={t('profile.label_date_of_birth')}
              value={formValues.dob || ''}
              mode={'date'}
              placeholder={t('profile.placeholder_dob')}
            />
          )}
        </View>

        <Button
          text={t('common.update_info')}
          disabled={!isButtonEnabled}
          loading={isSubmitting}
          pressed={handleSubmit}
          height={52}
          style={{width: '100%', marginVertical: 16}}
        />
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

export default EditProfileInfomation;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 32,
    marginTop: 8,
  },
  doubleSelect: {
    display: 'flex',
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
});
