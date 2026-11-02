import React, {useCallback, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Pressable, StyleSheet, View} from 'react-native';
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
import {_step3Schema, _supportSchema} from '../../utils/validationSchemas';
import Head from '../../components/Shared/Head';
import {uploadUserProfile} from '../../store/actions/profile/uploadUserProfile';
import {useFocusEffect} from '@react-navigation/native';
import {logOut} from '../../store/reducer/userSlice';
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";
import Ionicons from "@react-native-vector-icons/ionicons";
import Text from '../../components/Shared/Text';
import BottomSelect from '../../components/Inputs/BottomSelect';
import {contactSupport} from '../../store/actions/profile/contactSupport';
import DocumentPickerRN from '../../components/Inputs/DocumentPicker';
import {processImageUri} from '../../utils/processImageUri';
import {validateContactDocument} from '../../utils/fileValidation';
// import {email-outline} from "reacticons"{email-outline}


const ContactSupport = ({navigation}) => {
  const {t} = useTranslation();
  const [cities, setCities] = useState([]);
  const [states, setStates] = useState([]);

  const {unAuthenticated} = useSelector(state => state.data);
  const {user} = useSelector(state => state.user);
  const dispatch = useDispatch();

  const onSubmit = values => {
    const formData = new FormData();

    const meanOfIdentification =
      typeof values.document === 'string'
        ? values.document
        : processImageUri(values.document, 'file');

    formData.append('first_name', values.first_name);
    formData.append('task_type_id', 2);
    formData.append('document', meanOfIdentification);
    formData.append('last_name', values.last_name);
    formData.append('other_name', values.other_name);
    formData.append('dob', values.dob);
    formData.append('gender_id', values?.gender.id);

    dispatch(
      contactSupport({
        payload: formData,
        callBack: () => {
          navigation.goBack();
        },
      }),
    );
  };

  const form = useFormik({
    initialValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      other_name: user?.other_name || '',
      document: null,
      dob: formatDateOnly(user?.dob),
      gender: user?.gender_id
        ? unAuthenticated?.gender?.find(gender => gender.id === user.gender_id)
        : '',
    },
    validationSchema: _supportSchema,
    onSubmit,
    enableReinitialize: true,
  });

  const _genders = [
    ...unAuthenticated?.gender,
    {id: 0, name: t('profile.gender_not_identify')},
  ];
  useFocusEffect(useCallback(() => {}, []));

  const [showbottomSheet, setShowbottomSheet] = useState(false);

  return (
    <ScreenContainer style={{flex: 1, backgroundColor: '#FFF'}}>
      <View
        style={{
          paddingHorizontal: 32,
          borderBottomColor: '#e5e5e5',

          borderBottomWidth: 2,
        }}>
        <Head pageTitle={t('contactSupport.title')} type={2} navigation={navigation} />
      </View>
      <KeyboardAvoidingView style={styles.container}>
        <View>
          <Text
            fontType={'roboto'}
            bold
            style={{marginVertical: 2, fontSize: 14, color: '#000'}}>
            {t('contactSupport.current_info_heading')}
          </Text>
          <View
            // onPress={() => gotToEditProfile('name', 'Name')}
            style={styles.listItem}>
            <Ionicons name="person-outline" size={20} />
            <View style={styles.detailsItemInner}>
              <Text
                color={'#0B071B'}
                fontType={'roboto'}
                semibold
                style={{fontSize: 12}}>
                {t('contactSupport.name_label')}
              </Text>
              <Text
                color={'#525354'}
                fontType={'roboto'}
                style={{fontSize: 12}}>
                {user?.name}
              </Text>
            </View>
          </View>
          <View
            // onPress={() => gotToEditProfile('gender', 'Gender')}
            style={styles.listItem}>
            <MaterialCommunityIcons name="gender-male-female" size={20} />
            <View style={styles.detailsItemInner}>
              <Text
                color={'#0B071B'}
                fontType={'roboto'}
                semibold
                style={{fontSize: 12}}>
                {t('contactSupport.gender_label')}
              </Text>
              <Text
                color={'#525354'}
                fontType={'roboto'}
                style={{fontSize: 12}}>
                {user?.gender?.name}
              </Text>
            </View>
          </View>
          <View style={styles.listItem}>
            <MaterialCommunityIcons name="cake" size={20} />
            <View style={styles.detailsItemInner}>
              <Text
                color={'#0B071B'}
                fontType={'roboto'}
                semibold
                style={{fontSize: 12}}>
                {t('contactSupport.dob_label')}
              </Text>
              <Text
                color={'#525354'}
                fontType={'roboto'}
                style={{fontSize: 12}}>
                {user?.dob}
              </Text>
            </View>
          </View>
        </View>
        <View style={{paddingBottom: 12}}>
          <Text
            fontType={'roboto'}
            bold
            style={{marginTop: 20, fontSize: 14, color: '#000'}}>
            {t('contactSupport.change_to_heading')}
          </Text>
          <>
            <TextInputField
              {...formHandler('first_name', form)}
              placeholder={t('contactSupport.label_first_name_placeholder')}
              label={t('contactSupport.label_first_name')}
              mainStyles={{width: '100%'}}
            />
            <TextInputField
              {...formHandler('other_name', form)}
              placeholder={t('contactSupport.label_other_name_placeholder')}
              label={t('contactSupport.label_other_name')}
              mainStyles={{width: '100%'}}
            />
            <TextInputField
              {...formHandler('last_name', form)}
              placeholder={t('contactSupport.label_last_name_placeholder')}
              label={t('contactSupport.label_last_name')}
              mainStyles={{width: '100%'}}
            />
          </>

          <Select
            disabled={false}
            {...formHandler('gender', form)}
            onValueChange={(text, id) => {
              form.setFieldValue('gender', {name: text, id});
            }}
            styles={{width: '100%'}}
            label={t('contactSupport.label_gender')}
            list={_genders}
          />
          <Datepicker
            fullWidth
            label={t('contactSupport.label_dob')}
            {...formHandler('dob', form)}
            mode={'date'}
            placeholder={t('contactSupport.placeholder_dob')}
            maximumDate={
              new Date(
                new Date().getFullYear() - 18,
                new Date().getMonth(),
                new Date().getDate(),
              )
            }
          />
          <DocumentPickerRN
            small
            mainStyle={{height: 70}}
            fullWidth
            validationType="contact"
            // documentUrl={user?.document?.police_check_link}
            {...formHandler('document', form, null, null, null, true)}
            onChangeValue={value => {
              form.setFieldValue('document', value);
            }}
            // placeholder="km"
            label={t('contactSupport.attach_id_label')}
          />
          <Button
            text={t('common.submit')}
            disabled={!form.dirty || !form.isValid}
            pressed={form.handleSubmit}
            height={52}
            style={{width: '100%', marginVertical: 16}}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

export default ContactSupport;

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
  detailsItemInner: {
    gap: 2,
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginVertical: 4,
    gap: 10,
    borderBottomColor: '#999',
    borderBottomWidth: 1,
  },
});
