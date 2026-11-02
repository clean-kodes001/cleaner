import React, {useEffect, useState} from 'react';
import {Alert, StyleSheet, View, LogBox} from 'react-native';
import StepsTopbar from '../../components/Shared/StepsBar';
import ScreenContainer from '../../components/Shared/ScreenContainer';
import KeyboardAvoidingView from '../../components/Shared/KeyboardAvoidingView';
import {useDispatch, useSelector} from 'react-redux';
import Button from '../../components/Shared/Button';
import TextInputField from '../../components/Inputs/TextInputField';
import AddressAutocomplete from '../../components/Inputs/AddressAutocomplete';
import {formHandler} from '../../utils/formhandler';
import {formatDateOnly} from '../../utils/dateOnly';
import {useFormik} from 'formik';
import Select from '../../components/Inputs/Select';
import SearchSelect from '../../components/Inputs/SearchSelect';
import Datepicker from '../../components/Inputs/DatePicker';
import {uploadProfile} from '../../store/actions/profile/uploadProfile';
import {_step3Schema} from '../../utils/validationSchemas';
import {logOut} from '../../store/reducer/userSlice';
import {validatePhoneNumber} from '../../utils/validatePhone';
import {validatePostalCode} from '../../utils/validatePostalCode';
import {
  CANADIAN_PROVINCES,
  validatePostalCodeWithGoogle,
} from '../../utils/googlePlaces';
import {useTranslation} from 'react-i18next';

// Suppress VirtualizedList warning for GooglePlacesAutocomplete nested in ScrollView
LogBox.ignoreLogs(['VirtualizedLists should never be nested']);

const Step3 = ({navigation, route}) => {
  const {t} = useTranslation();

  const [cities, setCities] = useState([]);
  const [phoneError, setPhoneError] = useState('');
  const [postalCodeError, setPostalCodeError] = useState('');
  const {unAuthenticated} = useSelector(state => state.data);
  const [states, setStates] = useState([]);
  const {user, onboardingStatus} = useSelector(state => state.user);
  const dispatch = useDispatch();
  const [prefilledValues, setPrefilledValues] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submissionTimeout, setSubmissionTimeout] = useState(null);

  const onboarding = onboardingStatus?.onboarding_status;
  const isBioDataUpdate =
    onboarding?.bio_data === 1 || onboarding?.bio_data === true;
  const requiredBioFieldsRaw = Array.isArray(onboarding?.required_bio_fields)
    ? onboarding.required_bio_fields
    : [];
  const granularBioUpdate = isBioDataUpdate && requiredBioFieldsRaw.length > 0;

  const bioFieldToFormKey = {
    first_name: 'first_name',
    last_name: 'last_name',
    other_name: 'other_name',
    phone: 'phone',
    dob: 'dob',
    address: 'address',
    postal_code: 'postal_code',
    gender_id: 'gender',
    country_id: 'country',
    state_id: 'state',
    city_id: 'city',
    distance: 'distance',
  };

  const requiredBioFormFields = granularBioUpdate
    ? requiredBioFieldsRaw
        .map(k => bioFieldToFormKey[k])
        .filter(Boolean)
    : [];

  const isFieldDisabled = formKey =>
    granularBioUpdate && !requiredBioFormFields.includes(formKey);

  // A field the admin flagged as needing correction (granular bio update).
  const isFieldRequired = formKey =>
    granularBioUpdate && requiredBioFormFields.includes(formKey);

  const isValueEmpty = formKey => {
    const v = form.values?.[formKey];
    if (v === null || v === undefined || v === '') return true;
    if (v instanceof Date) return isNaN(v.getTime());
    if (typeof v === 'object') return !(v.id || v.name);
    return false;
  };

  // Existing validation error wins; otherwise an admin-flagged field that is
  // still empty surfaces a "Required" prompt so every flagged field is marked.
  const fieldError = (formKey, baseError) => {
    const err = baseError !== undefined ? baseError : form.errors?.[formKey];
    if (err) return err;
    if (isFieldRequired(formKey) && isValueEmpty(formKey)) {
      return t('validation.required');
    }
    return undefined;
  };

  // Red border only for admin-flagged fields that still need attention.
  const fieldBorderError = (formKey, baseError) =>
    isFieldRequired(formKey) && !!fieldError(formKey, baseError);

  // Handle navigation after successful update
  useEffect(() => {
    console.log('Step3 Nav useEffect:', {
      hasSubmitted,
      onboardingStatus: onboardingStatus?.onboarding_status,
    });
    
    if (hasSubmitted && onboardingStatus?.onboarding_status) {
      // Only handle navigation if we're in update mode and bio_data is now false (0 or false)
      const currentBioData =
        onboardingStatus?.onboarding_status?.bio_data === 1 ||
        onboardingStatus?.onboarding_status?.bio_data === true;
      const currentDocumentUpload =
        onboardingStatus?.onboarding_status?.document_upload === 1 ||
        onboardingStatus?.onboarding_status?.document_upload === true;

      console.log('Step3 Nav Decision:', {
        currentBioData,
        currentDocumentUpload,
        rawBioData: onboardingStatus?.onboarding_status?.bio_data,
        rawDocumentUpload: onboardingStatus?.onboarding_status?.document_upload,
        destination: currentDocumentUpload ? 'step4' : 'successInfo',
      });

      if (!currentBioData && hasSubmitted) {
        // Clear any pending timeout
        if (submissionTimeout) {
          clearTimeout(submissionTimeout);
          setSubmissionTimeout(null);
        }
        setHasSubmitted(false); // Reset flag

        if (currentDocumentUpload) {
          // Still need to update documents - navigate to Step4
          console.log('Step3: -> step4');
          navigation.navigate('step4');
        } else {
          // Both updates complete - navigate to success screen
          console.log('Step3: -> successInfo');
          navigation.navigate('successInfo');
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboardingStatus?.onboarding_status?.bio_data, hasSubmitted]);

  // Timeout mechanism: Reset hasSubmitted if state doesn't update within 10 seconds
  useEffect(() => {
    if (hasSubmitted) {
      const timeout = setTimeout(() => {
        console.warn('Navigation timeout: Resetting hasSubmitted flag');
        setHasSubmitted(false);
        setSubmissionTimeout(null);
      }, 10000); // 10 second timeout

      setSubmissionTimeout(timeout);

      return () => {
        if (timeout) {
          clearTimeout(timeout);
        }
      };
    }
  }, [hasSubmitted]);

  const onSubmit = async values => {
    // In bio_data update mode: check if user made any changes
    if (isBioDataUpdate && prefilledValues) {
      // Compare current values with prefilled values
      const hasChanges = Object.keys(values).some(key => {
        const currentValue = values[key];
        const prefilledValue = prefilledValues[key];

        // Compare objects (gender, city, state, country)
        if (
          typeof currentValue === 'object' &&
          currentValue !== null &&
          typeof prefilledValue === 'object' &&
          prefilledValue !== null
        ) {
          return (
            currentValue.id !== prefilledValue.id ||
            currentValue.name !== prefilledValue.name
          );
        }

        // Compare other values
        return String(currentValue) !== String(prefilledValue);
      });

      // If no changes, skip API and navigate
      if (!hasChanges) {
        // Check if documents still need update
        if (
          onboardingStatus?.onboarding_status?.document_upload === 1 ||
          onboardingStatus?.onboarding_status?.document_upload === true
        ) {
          // Navigate to Step4 (documents)
          navigation.navigate('step4');
        } else {
          // Both updates complete - navigate to success
          navigation.navigate('successInfo');
        }
        return;
      }
    }

    const formData = new FormData();

    // Determine if this is an update (bio_data flag) or create
    const isUpdate = isBioDataUpdate;

    // For PUT requests, only send fields that have changed
    // For POST requests, send all fields
    const getOriginalValue = fieldName => {
      if (!isUpdate) {
        return null; // No original value for create flow
      }
      // Use prefilledValues if available (preferred source)
      if (prefilledValues && prefilledValues[fieldName] !== undefined) {
        return prefilledValues[fieldName];
      }
      // Fallback to user's current data for comparison
      if (fieldName === 'first_name') {
        return user?.first_name || '';
      }
      if (fieldName === 'last_name') {
        return user?.last_name || '';
      }
      if (fieldName === 'other_name') {
        return user?.other_name || '';
      }
      if (fieldName === 'phone') {
        return user?.phone || '';
      }
      if (fieldName === 'dob') {
        return formatDateOnly(user?.dob);
      }
      if (fieldName === 'email') {
        return user?.email || '';
      }
      if (fieldName === 'postal_code') {
        return user?.postal_code || '';
      }
      if (fieldName === 'address') {
        return user?.address || '';
      }
      if (fieldName === 'distance') {
        return user?.distance ? String(user?.distance) : '';
      }
      if (fieldName === 'gender') {
        return user?.gender_id
          ? unAuthenticated?.gender?.find(g => g.id === user.gender_id)
          : '';
      }
      if (fieldName === 'city') {
        return user?.city_id
          ? unAuthenticated?.cities?.find(c => c.id === user.city_id)
          : '';
      }
      if (fieldName === 'state') {
        return user?.state_id
          ? unAuthenticated?.states?.find(s => s.id === user.state_id)
          : '';
      }
      if (fieldName === 'country') {
        return user?.country_id
          ? unAuthenticated?.countries?.find(c => c.id === user.country_id)
          : {id: 1, name: 'Canada'};
      }
      return null;
    };

    const hasFieldChanged = (fieldName, currentValue, originalValue) => {
      if (!isUpdate) {
        return true; // For POST, always include field
      }

      // If originalValue is undefined/null and currentValue has a value, it changed
      if (
        (originalValue === undefined ||
          originalValue === null ||
          originalValue === '') &&
        currentValue !== undefined &&
        currentValue !== null &&
        currentValue !== ''
      ) {
        return true;
      }

      // If currentValue is empty and originalValue had a value, it changed (clearing a field)
      if (
        (currentValue === undefined ||
          currentValue === null ||
          currentValue === '') &&
        originalValue !== undefined &&
        originalValue !== null &&
        originalValue !== ''
      ) {
        return true;
      }

      // If both are empty, no change
      if (
        (!currentValue || currentValue === '') &&
        (!originalValue || originalValue === '')
      ) {
        return false;
      }

      // Compare objects (gender, city, state, country)
      if (
        typeof currentValue === 'object' &&
        currentValue !== null &&
        typeof originalValue === 'object' &&
        originalValue !== null
      ) {
        // Handle case where one might be empty string
        if (!currentValue.id && !originalValue.id) {
          return false;
        }
        return (
          (currentValue.id || null) !== (originalValue.id || null) ||
          (currentValue.name || '') !== (originalValue.name || '')
        );
      }

      // Normalize empty values for comparison
      const normalizedCurrent = String(currentValue || '').trim();
      const normalizedOriginal = String(originalValue || '').trim();

      // Compare strings/values
      return normalizedCurrent !== normalizedOriginal;
    };

    // Track fields added to FormData (for validation in update mode)
    let fieldsAdded = 0;

    // Only append fields that have changed (for PUT) or all fields (for POST)
    if (
      hasFieldChanged(
        'first_name',
        values.first_name,
        getOriginalValue('first_name'),
      )
    ) {
      formData.append('first_name', values.first_name);
      fieldsAdded++;
    }
    if (
      hasFieldChanged(
        'last_name',
        values.last_name,
        getOriginalValue('last_name'),
      )
    ) {
      formData.append('last_name', values.last_name);
      fieldsAdded++;
    }
    // Handle other_name - include if it changed
    const otherNameOriginal = getOriginalValue('other_name');
    const otherNameChanged = hasFieldChanged(
      'other_name',
      values.other_name,
      otherNameOriginal,
    );
    if (otherNameChanged) {
      formData.append('other_name', values.other_name || '');
      fieldsAdded++;
    }
    if (hasFieldChanged('phone', values.phone, getOriginalValue('phone'))) {
      formData.append('phone', values?.phone);
      fieldsAdded++;
    }
    if (hasFieldChanged('dob', values.dob, getOriginalValue('dob'))) {
      formData.append('dob', values?.dob);
      fieldsAdded++;
    }
    if (hasFieldChanged('email', user?.email, getOriginalValue('email'))) {
      formData.append('email', user?.email);
      fieldsAdded++;
    }

    // Remove spaces from postal code before submitting
    const postalCodeWithoutSpaces = values?.postal_code
      ? values.postal_code.replace(/\s+/g, '')
      : '';
    if (
      hasFieldChanged(
        'postal_code',
        postalCodeWithoutSpaces,
        getOriginalValue('postal_code'),
      )
    ) {
      formData.append('postal_code', postalCodeWithoutSpaces);
      fieldsAdded++;
    }

    if (hasFieldChanged('gender', values.gender, getOriginalValue('gender'))) {
      formData.append('gender_id', values?.gender?.id);
      fieldsAdded++;
    }
    if (
      hasFieldChanged('address', values.address, getOriginalValue('address'))
    ) {
      formData.append('address', values?.address);
      fieldsAdded++;
    }
    if (
      hasFieldChanged('distance', values.distance, getOriginalValue('distance'))
    ) {
      formData.append('distance', values?.distance);
      fieldsAdded++;
    }
    if (
      hasFieldChanged('country', values.country, getOriginalValue('country'))
    ) {
      formData.append('country_id', values?.country?.id);
      fieldsAdded++;
    }
    if (hasFieldChanged('state', values.state, getOriginalValue('state'))) {
      formData.append('state_id', values?.state?.id);
      fieldsAdded++;
    }
    if (hasFieldChanged('city', values.city, getOriginalValue('city'))) {
      formData.append('city_id', values?.city?.id);
      fieldsAdded++;
    }

    // For PUT requests, ensure at least one field is being sent.
    if (isUpdate) {
      if (fieldsAdded === 0) {
        // No fields changed - this shouldn't happen due to skip logic above
        // But if it does, show error
        console.error('No fields changed for update');
        console.log('Debug info:', {
          isUpdate,
          fieldsAdded,
          values: Object.keys(values).reduce((acc, key) => {
            acc[key] = {
              current: values[key],
              original: getOriginalValue(key),
              changed: hasFieldChanged(key, values[key], getOriginalValue(key)),
            };
            return acc;
          }, {}),
        });
        return;
      }
    }

    // Set flag to indicate submission
    if (isUpdate) {
      setHasSubmitted(true);
    }

    try {
      await dispatch(
        uploadProfile({
          nextStage: null,
          navigation,
          data: formData,
          nextPage: null,
          isUpdate,
        }),
      ).unwrap();
    } catch (error) {
      // API call failed - reset flag to allow retry
      console.error('Profile update failed:', error);
      if (isUpdate) {
        setHasSubmitted(false);
        if (submissionTimeout) {
          clearTimeout(submissionTimeout);
          setSubmissionTimeout(null);
        }
      }
      // Error is already handled by Redux/error handler
    }
  };

  const form = useFormik({
    initialValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      other_name: user?.other_name || '',

      phone: user?.phone || '',
      dob: formatDateOnly(user?.dob),
      postal_code: user?.postal_code || '',
      address: user?.address || '',
      distance: user?.distance ? String(user?.distance) : '',
      gender: user?.gender_id
        ? unAuthenticated?.gender?.find(gender => gender.id === user.gender_id)
        : '',
      city: user?.city_id
        ? unAuthenticated?.cities?.find(c => c.id === user.city_id)
        : '',
      state: user?.state_id
        ? unAuthenticated?.states?.find(s => s.id === user.state_id)
        : '',
      country: user?.country_id
        ? unAuthenticated?.countries?.find(c => c.id === user.country_id)
        : {id: 1, name: 'Canada'},
    },
    validationSchema: _step3Schema,
    onSubmit,
  });

  // Load prefilled or user data on mount
  useEffect(() => {
    const loadData = async () => {
      // Prefilled data from onboarding status takes priority (only if bio_data)
      const profileData =
        (onboardingStatus?.onboarding_status?.bio_data === 1 ||
          onboardingStatus?.onboarding_status?.bio_data === true) &&
        onboardingStatus?.profile_data
          ? onboardingStatus.profile_data
          : null;

      // Build initial values with priority: prefilled > user data
      const buildInitialValues = () => {
        // Helper to find gender by id or name
        const findGender = genderId => {
          if (!genderId) return '';
          return (
            unAuthenticated?.gender?.find(g => g.id === genderId) ||
            unAuthenticated?.gender?.find(
              g => g.name?.toLowerCase() === String(genderId).toLowerCase(),
            ) ||
            ''
          );
        };

        // Helper to find city by id
        const findCity = cityId => {
          if (!cityId) return '';
          return unAuthenticated?.cities?.find(c => c.id === cityId) || '';
        };

        // Helper to find state by id
        const findState = stateId => {
          if (!stateId) return '';
          return unAuthenticated?.states?.find(s => s.id === stateId) || '';
        };

        // Helper to find country by id
        const findCountry = countryId => {
          if (!countryId) return {id: 1, name: 'Canada'};
          return (
            unAuthenticated?.countries?.find(c => c.id === countryId) || {
              id: 1,
              name: 'Canada',
            }
          );
        };

        return {
          first_name: profileData?.first_name || user?.first_name || '',
          last_name: profileData?.last_name || user?.last_name || '',
          other_name: profileData?.other_name || user?.other_name || '',
          phone: profileData?.phone || user?.phone || '',
          dob: formatDateOnly(profileData?.dob || user?.dob),
          postal_code: profileData?.postal_code || user?.postal_code || '',
          address: profileData?.address || user?.address || '',
          distance: profileData?.distance
            ? String(profileData.distance)
            : user?.distance
            ? String(user?.distance)
            : '',
          gender: profileData?.gender_id
            ? findGender(profileData.gender_id)
            : user?.gender_id
            ? findGender(user.gender_id)
            : '',
          city: profileData?.city_id
            ? findCity(profileData.city_id)
            : user?.city_id
            ? findCity(user.city_id)
            : '',
          state: profileData?.state_id
            ? findState(profileData.state_id)
            : user?.state_id
            ? findState(user.state_id)
            : '',
          country: profileData?.country_id
            ? findCountry(profileData.country_id)
            : user?.country_id
            ? findCountry(user.country_id)
            : {id: 1, name: 'Canada'},
        };
      };

      const initialValues = buildInitialValues();

      // Store prefilled values if in bio_data update mode
      // Always set prefilledValues in update mode for comparison, even if no profileData
      if (isBioDataUpdate && granularBioUpdate) {
        requiredBioFormFields.forEach(formKey => {
          initialValues[formKey] = '';
        });
      }

      if (isBioDataUpdate) {
        setPrefilledValues(initialValues);
      }

      form.setValues(initialValues);
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.first_name, user?.last_name, onboardingStatus]);

  // Initialize states when component mounts or country changes
  useEffect(() => {
    const countryId = form?.values?.country?.id;
    if (countryId && unAuthenticated?.states) {
      let filteredStates =
        unAuthenticated.states.filter(
          state => state.country_id === Number(countryId),
        ) || [];

      // If Canada, merge with CANADIAN_PROVINCES to ensure all provinces are included
      if (countryId === 1) {
        // Create a map of existing states by name for quick lookup
        const existingStateNames = new Set(
          filteredStates.map(state => state.name.toLowerCase()),
        );

        // Add Canadian provinces that don't exist in unAuthenticated.states
        CANADIAN_PROVINCES.forEach(province => {
          if (!existingStateNames.has(province.name.toLowerCase())) {
            // Use the province code as id for Google Places compatibility
            filteredStates.push({
              id: province.id,
              name: province.name,
              country_id: 1,
            });
          }
        });
      }

      setStates(filteredStates);
    }
  }, [form?.values?.country?.id, unAuthenticated?.states]);

  // Initialize cities when component mounts if user already has a state selected
  useEffect(() => {
    const stateId = form?.values?.state?.id;
    if (stateId && unAuthenticated?.cities) {
      setCities(
        unAuthenticated.cities?.filter(
          city => city.state_id === Number(stateId),
        ) || [],
      );
    }
  }, [form?.values?.state?.id, unAuthenticated?.cities]);

  const _genders = [
    ...unAuthenticated?.gender,
    {id: 0, name: t('profile.gender_not_identify')},
  ];

  // Real-time phone validation
  const validateCanadianPhone = phoneNumber => {
    if (!phoneNumber || phoneNumber.trim() === '') {
      setPhoneError('');
      return;
    }

    const countryCode = form.values.countryCode || 'CA';
    const formattedPhoneNumber = '1' + phoneNumber;
    const result = validatePhoneNumber(formattedPhoneNumber, countryCode);

    if (!result.isValid) {
      setPhoneError(result.error);
    } else {
      setPhoneError('');
    }
  };

  // Validate postal code for Canada using Google
  const validateCanadianPostalCode = async postalCode => {
    if (!postalCode || postalCode.trim() === '') {
      setPostalCodeError('');
      return;
    }

    // First do local validation for immediate feedback
    const localValidation = validatePostalCode(postalCode, 'CA', true);
    if (localValidation.error) {
      setPostalCodeError(localValidation.error);
      return;
    }

    // If local validation passes, validate with Google
    try {
      const googleValidation = await validatePostalCodeWithGoogle(
        postalCode,
        'CA',
      );

      if (googleValidation.isValid) {
        // Update postal code with formatted version from Google
        if (googleValidation.formatted !== postalCode) {
          form.setFieldValue('postal_code', googleValidation.formatted);
        }
        setPostalCodeError('');
      } else if (googleValidation.error) {
        setPostalCodeError(googleValidation.error);
      } else {
        // Google validation failed but no error message (API error), keep local validation
        setPostalCodeError('');
      }
    } catch (error) {
      console.error('Error validating postal code:', error);
      // On error, keep local validation result
      setPostalCodeError('');
    }
  };

  // Handle address selection from Google Places
  const handleAddressSelected = addressData => {
    form.setFieldValue('address', addressData.formatted_address);

    if (addressData.postal_code) {
      form.setFieldValue('postal_code', addressData.postal_code);
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
        setCities(stateCities);
        const matchedCity = addressData.city
          ? stateCities.find(
              c => c.name.toLowerCase() === addressData.city.toLowerCase(),
            )
          : null;
        form.setValues({
          ...form.values,
          state: {name: matchedState.name, id: matchedState.id},
          city: matchedCity ? {name: matchedCity.name, id: matchedCity.id} : '',
        });
      }
    }
  };

  return (
    <ScreenContainer
      style={{
        flex: 1,
      }}>
      <StepsTopbar />
      <KeyboardAvoidingView>
        <View style={styles.base}>
          <View>
            <TextInputField
              {...formHandler('first_name', form)}
              placeholder={t('profile.placeholder_first_name')}
              label={t('profile.label_first_name')}
              mainStyles={{width: '100%'}}
              error={fieldError('first_name')}
              borderError={fieldBorderError('first_name')}
              disabled={isFieldDisabled('first_name')}
            />
            <TextInputField
              {...formHandler('other_name', form)}
              placeholder={t('profile.placeholder_other_name')}
              label={t('profile.label_other_name')}
              mainStyles={{width: '100%'}}
              error={fieldError('other_name')}
              borderError={fieldBorderError('other_name')}
              disabled={isFieldDisabled('other_name')}
            />
            <TextInputField
              {...formHandler('last_name', form)}
              placeholder={t('profile.placeholder_last_name')}
              label={t('profile.label_last_name')}
              mainStyles={{width: '100%'}}
              error={fieldError('last_name')}
              borderError={fieldBorderError('last_name')}
              disabled={isFieldDisabled('last_name')}
            />

            <TextInputField
              {...formHandler('phone', form)}
              defaultCode={
                user?.country_id === 2
                  ? 'NG'
                  : user?.country_id === 1
                  ? 'CA'
                  : null
              }
              onChangeCountry={({callingCode, cca2}) => {
                /* if (cca2 === 'NG') {
                  form.setValues({
                    ...form.values,
                    country: {id: 2, name: 'Nigeria'},
                    state: '',
                    city: '',
                    countryCode: cca2,
                    callingCode: callingCode[0],
                  });
                  // States will be updated by the useEffect that watches form.values.country.id
                  // form.setFieldValue('country', {id: 2, name: 'Nigeria'});
                } else */ //if (cca2 === 'CA') {
                form.setValues({
                  ...form.values,
                  country: {id: 1, name: 'Canada'},
                  state: '',
                  city: '',
                  countryCode: cca2,
                  callingCode: callingCode[0],
                });
                // States will be updated by the useEffect that watches form.values.country.id
                // form.setFieldValue('country', {id: 1, name: 'Canada'});
                // }
                // form.setFieldValue('countryCode', cca2);
                // form.setFieldValue('callingCode', callingCode[0]);
              }}
              onChangeText={text => {
                form.setFieldValue('phone', text);
                validateCanadianPhone(text);
              }}
              error={fieldError('phone', phoneError || form.errors.phone)}
              borderError={fieldBorderError('phone', phoneError || form.errors.phone)}
              type="phone"
              keyboardType="numeric"
              placeholder=""
              label={t('profile.label_phone_number')}
              disabled={isFieldDisabled('phone')}
            />

            <View style={styles.doubleSelect}>
              <Select
                disabled={isFieldDisabled('country')}
                {...formHandler('country', form)}
                error={fieldError('country')}
                borderError={fieldBorderError('country')}
                onValueChange={(text, id) => {
                  /* if (text === 'Nigeria') {
                    form.setFieldValue('countryCode', 'NG');
                    form.setFieldValue('callingCode', '234');
                  } else */ if (text === 'Canada') {
                    form.setFieldValue('countryCode', 'CA');
                    form.setFieldValue('callingCode', '1');
                  }

                  form.setValues({
                    ...form.values,
                    country: {name: text, id},
                    state: '',
                    city: '',
                  });

                  // States will be updated by the useEffect that watches form.values.country.id
                }}
                styles={{width: '100%'}}
                label={t('profile.label_country')}
                list={unAuthenticated.countries?.filter(c => c.id !== 2) /* Nigeria disabled */}
              />
            </View>
            <View style={styles.doubleSelect}>
              <SearchSelect
                {...formHandler('state', form)}
                error={fieldError('state')}
                borderError={fieldBorderError('state')}
                disabled={
                  isFieldDisabled('state') ||
                  states?.length < 1 ||
                  form.values.country?.length < 1
                }
                onValueChange={(text, id) => {
                  form.setValues({
                    ...form.values,
                    state: {name: text, id},
                    city: '',
                  });

                  setCities(
                    unAuthenticated.cities?.filter(
                      city => city.state_id === Number(id),
                    ) || [],
                  );
                }}
                styles={{width: '47%'}}
                label={
                  form.values.country?.id === 1
                    ? t('profile.label_province')
                    : form.values.country?.id === 2
                    ? t('profile.label_state')
                    : t('profile.label_province_state')
                }
                list={states}
              />
              <SearchSelect
                {...formHandler('city', form)}
                error={fieldError('city')}
                borderError={fieldBorderError('city')}
                disabled={
                  isFieldDisabled('city') ||
                  cities.length < 1 ||
                  form.values.state?.length < 1 ||
                  form.values.country?.length < 1
                }
                onValueChange={(text, id) => {
                  form.setFieldValue('city', {name: text, id});
                }}
                styles={{width: '47%'}}
                label={
                  form.values.country?.id === 1
                    ? t('profile.label_hamlet')
                    : form.values.country?.id === 2
                    ? t('profile.label_city_town_village')
                    : t('profile.label_city_town_village')
                }
                list={cities}
              />
            </View>

            {isFieldDisabled('address') ? (
              <TextInputField
                {...formHandler('address', form)}
                placeholder=""
                label={t('profile.label_address')}
                mainStyles={{width: '100%'}}
                disabled={true}
              />
            ) : (
              <AddressAutocomplete
                label={t('profile.label_address')}
                value={form.values.address}
                onChangeText={text => {
                  form.setFieldValue('address', text);
                }}
                onAddressSelected={handleAddressSelected}
                error={fieldError('address', formHandler('address', form).error)}
                placeholder={t('profile.placeholder_search_address')}
              />
            )}
            <Select
              {...formHandler('gender', form)}
              error={fieldError('gender')}
              borderError={fieldBorderError('gender')}
              disabled={isFieldDisabled('gender')}
              onValueChange={(text, id) => {
                form.setFieldValue('gender', {name: text, id});
              }}
              styles={{width: '100%'}}
              label={t('profile.label_gender')}
              list={_genders}
            />
            <View style={styles.doubleSelect}>
              <Datepicker
                maximumDate={
                  new Date(
                    new Date().getFullYear() - 18,
                    new Date().getMonth(),
                    new Date().getDate(),
                  )
                }
                label={t('profile.label_date_of_birth')}
                {...formHandler('dob', form)}
                error={fieldError('dob')}
                borderError={fieldBorderError('dob')}
                mode={'date'}
                placeholder={t('profile.placeholder_dob')}
                disabled={isFieldDisabled('dob')}
              />
              <TextInputField
                {...formHandler('postal_code', form)}
                onChangeText={async text => {
                  form.setFieldValue('postal_code', text);
                  // Validate as user types with Google
                  await validateCanadianPostalCode(text);
                }}
                placeholder={t('profile.placeholder_postal_code')}
                label={t('profile.label_postal_code')}
                autoCapitalize="characters"
                error={fieldError(
                  'postal_code',
                  postalCodeError || formHandler('postal_code', form).error,
                )}
                borderError={fieldBorderError(
                  'postal_code',
                  postalCodeError || formHandler('postal_code', form).error,
                )}
                mainStyles={{width: '47%'}}
                disabled={isFieldDisabled('postal_code')}
              />
            </View>
            <TextInputField
              {...formHandler('distance', form)}
              placeholder={t('profile.placeholder_km')}
              keyboardType={'numeric'}
              label={t('profile.label_distance_proximity')}
              error={fieldError('distance')}
              borderError={fieldBorderError('distance')}
              disabled={isFieldDisabled('distance')}
            />
          </View>
          <Button
            text={t('common.next')}
            // disabled={!form.dirty || !form.isValid}
            pressed={form.handleSubmit}
            height={52}
            style={{width: '100%', marginVertical: 16}}
          />
          <Button
            text={t('common.logout_and_come_back')}
            outline
            pressed={() => {
              if (form.dirty) {
                Alert.alert(
                  t('onboarding.unsaved_changes_title', {
                    defaultValue: 'Unsaved changes',
                  }),
                  t('onboarding.unsaved_changes_message', {
                    defaultValue:
                      'You have unsaved changes that will be lost if you log out now. Continue?',
                  }),
                  [
                    {text: t('common.cancel'), style: 'cancel'},
                    {
                      text: t('common.logout'),
                      style: 'destructive',
                      onPress: () => dispatch(logOut()),
                    },
                  ],
                );
              } else {
                dispatch(logOut());
              }
            }}
            height={52}
            style={{width: '100%', marginBottom: 16}}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

export default Step3;

const styles = StyleSheet.create({
  base: {
    flex: 1,
    paddingHorizontal: 18,
  },
  doubleSelect: {
    display: 'flex',
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
});
