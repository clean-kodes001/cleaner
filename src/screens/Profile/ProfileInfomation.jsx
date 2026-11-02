import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import ScreenContainer from '../../components/Shared/ScreenContainer';
import KeyboardAvoidingView from '../../components/Shared/KeyboardAvoidingView';
import {useDispatch, useSelector} from 'react-redux';
import Button from '../../components/Shared/Button';
import TextInputField from '../../components/Inputs/TextInputField';
import {formHandler} from '../../utils/formhandler';
import {formatDateOnly} from '../../utils/dateOnly';
import {useFormik} from 'formik';
import Select from '../../components/Inputs/Select';
import Datepicker from '../../components/Inputs/DatePicker';
import {_step3Schema} from '../../utils/validationSchemas';
import Head from '../../components/Shared/Head';
import {uploadUserProfile} from '../../store/actions/profile/uploadUserProfile';
import SearchSelect from '../../components/Inputs/SearchSelect';
import {useTranslation} from 'react-i18next';
const ProfileInfomation = ({navigation}) => {
  const {t} = useTranslation();
  const [cities, setCities] = useState([]);
  const [states, setStates] = useState([]);

  const {unAuthenticated} = useSelector(state => state.data);
  const {user} = useSelector(state => state.user);
  const dispatch = useDispatch();

  const onSubmit = values => {
    const formData = new FormData();

    formData.append('first_name', values.first_name);
    formData.append('last_name', values.last_name);
    formData.append('other_name', values.other_name);

    formData.append('phone', values?.phone);
    formData.append('dob', values.dob);

    formData.append('email', user?.email);
    // Remove spaces from postal code before submitting
    const postalCodeWithoutSpaces = values?.postal_code
      ? values.postal_code.replace(/\s+/g, '')
      : '';
    formData.append('postal_code', postalCodeWithoutSpaces);
    formData.append('gender_id', values?.gender.id);
    formData.append('address', values?.address);
    formData.append('distance', values?.distance);
    formData.append('country_id', values?.country.id);
    formData.append('state_id', values?.state.id);
    formData.append('city_id', values?.city.id);

    dispatch(uploadUserProfile(formData));
  };

  const form = useFormik({
    initialValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      other_name: user?.other_name || '',
      dob: formatDateOnly(user?.dob),

      phone: user?.phone || '',

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
        : '',
    },
    validationSchema: _step3Schema,
    onSubmit,
  });

  const _genders = [
    ...unAuthenticated?.gender,
    {id: 0, name: "Don't wish to self identify"},
  ];
  return (
    <ScreenContainer style={{flex: 1, backgroundColor: '#FFF'}}>
      <View
        style={{
          paddingHorizontal: 32,
          borderBottomColor: '#e5e5e5',

          borderBottomWidth: 2,
        }}>
        <Head pageTitle={t('profile.profile_information')} type={2} navigation={navigation} />
      </View>
      <KeyboardAvoidingView style={styles.container}>
        <View>
          <TextInputField
            disabled
            {...formHandler('first_name', form)}
            placeholder={t('contactSupport.label_first_name_placeholder')}
            label={t('contactSupport.label_first_name')}
            mainStyles={{width: '100%'}}
          />
          <TextInputField
            disabled
            {...formHandler('other_name', form)}
            placeholder={t('contactSupport.label_other_name_placeholder')}
            label={t('contactSupport.label_other_name')}
            mainStyles={{width: '100%'}}
          />
          <TextInputField
            disabled
            {...formHandler('last_name', form)}
            placeholder={t('contactSupport.label_last_name_placeholder')}
            label={t('contactSupport.label_last_name')}
            mainStyles={{width: '100%'}}
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
                setStates(
                  unAuthenticated.states?.filter(
                    state => state.country_id === Number(2),
                  ),
                );
                // form.setFieldValue('country', {id: 2, name: 'Nigeria'});
              } else */ if (cca2 === 'CA') {
                form.setValues({
                  ...form.values,
                  country: {id: 1, name: 'Canada'},
                  state: '',
                  city: '',
                  countryCode: cca2,
                  callingCode: callingCode[0],
                });
                setStates(
                  unAuthenticated.states?.filter(
                    state => state.country_id === Number(1),
                  ),
                );
                // form.setFieldValue('country', {id: 1, name: 'Canada'});
              }
              // form.setFieldValue('countryCode', cca2);
              // form.setFieldValue('callingCode', callingCode[0]);
            }}
            type="phone"
            keyboardType="numeric"
            placeholder=""
            label={t('profile.label_phone_number')}
          />

          <View style={styles.doubleSelect}>
            <Select
              disabled={true}
              {...formHandler('country', form)}
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

                setStates(
                  unAuthenticated.states?.filter(
                    state => state.country_id === Number(id),
                  ),
                );
              }}
              styles={{width: '100%'}}
              label={t('profile.label_country')}
              list={unAuthenticated.countries?.filter(c => c.id !== 2) /* Nigeria disabled */}
            />
          </View>
          <View style={styles.doubleSelect}>
            <SearchSelect
              {...formHandler('state', form)}
              disabled={states?.length < 1 || form.values.country?.length < 1}
              onValueChange={(text, id) => {
                form.setValues({
                  ...form.values,
                  state: {name: text, id},
                  city: '',
                });
                setCities(
                  unAuthenticated.cities?.filter(
                    city => city.state_id === Number(id),
                  ),
                );
              }}
              styles={{width: '47%'}}
              label={
                form.values.country?.id === 1
                  ? 'Province'
                  : form.values.country?.id === 2
                  ? 'State'
                  : 'Province/State'
              }
              list={states}
            />
            <SearchSelect
              {...formHandler('city', form)}
              disabled={
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
                  ? 'City'
                  : form.values.country?.id === 2
                  ? 'City/Town/Village'
                  : 'City/Town/Village/Hamlet'
              }
              list={cities}
            />
          </View>
          <TextInputField
            {...formHandler('address', form)}
            placeholder={t('profile.placeholder_address')}
            label={t('profile.label_address')}
          />
          <Select
            {...formHandler('gender', form)}
            onValueChange={(text, id) => {
              form.setFieldValue('gender', {name: text, id});
            }}
            styles={{width: '100%'}}
            label={t('contactSupport.label_gender')}
            list={_genders}
          />
          <View style={styles.doubleSelect}>
            <Datepicker
              disabled
              label={t('contactSupport.label_dob')}
              {...formHandler('dob', form)}
              mode={'date'}
              placeholder={t('contactSupport.placeholder_dob')}
            />
            <TextInputField
              {...formHandler('postal_code', form)}
              placeholder={t('profile.placeholder_postal_code')}
              label={t('profile.label_postal_code')}
              keyboardType={'numeric'}
              mainStyles={{width: '47%'}}
            />
          </View>

          <TextInputField
            {...formHandler('distance', form)}
            placeholder={t('profile.placeholder_km')}
            keyboardType={'numeric'}
            label={t('profile.label_distance_proximity')}
          />
        </View>
        <Button
          text={t('common.update_info')}
          disabled={!form.dirty || !form.isValid}
          pressed={form.handleSubmit}
          height={52}
          style={{width: '100%', marginVertical: 16}}
        />
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

export default ProfileInfomation;

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
