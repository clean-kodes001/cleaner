import React from 'react';
import {StyleSheet, View} from 'react-native';
import StepsTopbar from '../../components/Shared/StepsBar';
import ScreenContainer from '../../components/Shared/ScreenContainer';
import KeyboardAvoidingView from '../../components/Shared/KeyboardAvoidingView';
import {useDispatch, useSelector} from 'react-redux';
import Button from '../../components/Shared/Button';
import TextInputField from '../../components/Inputs/TextInputField';
import {formHandler} from '../../utils/formhandler';
import {useFormik} from 'formik';
import {uploadProfile} from '../../store/actions/profile/uploadProfile';
import DocumentPicker from '../../components/Inputs/DocumentPicker';
import {processImageUri} from '../../utils/processImageUri';
import {uploadDocument} from '../../store/actions/profile/uploadDocument';
import {_step3Schema, _step4Schema} from '../../utils/validationSchemas';
import Head from '../../components/Shared/Head';
import {useTranslation} from 'react-i18next';
import {processSuccessMessage} from '../../utils/processSuccessMessage';

const UpdateDocumnets = ({navigation, route}) => {
  const {t} = useTranslation();
  const {completeProfileStage, pending} = useSelector(state => state.profile);
  const {user} = useSelector(state => state.user);
  const document = user?.document;

  const dispatch = useDispatch();

  const onSubmit = async values => {
    const driver_license_front =
      typeof values?.driver_license_front === 'string'
        ? values?.driver_license_front
        : processImageUri(values?.driver_license_front, 'file');
    const driver_license_back =
      typeof values?.driver_license_back === 'string'
        ? values?.driver_license_back
        : processImageUri(values?.driver_license_back, 'file');
    const valid_id_front =
      typeof values?.valid_id_front === 'string'
        ? values?.valid_id_front
        : processImageUri(values?.valid_id_front, 'file');
    const valid_id_back =
      typeof values?.valid_id_back === 'string'
        ? values?.valid_id_back
        : processImageUri(values?.valid_id_back, 'file');
    const insurance =
      typeof values?.cleanerInsurance === 'string'
        ? values?.cleanerInsurance
        : processImageUri(values?.cleanerInsurance, 'file');
    const police_check =
      typeof values?.backgroundCheck === 'string'
        ? values?.backgroundCheck
        : processImageUri(values?.backgroundCheck, 'file');
    const vulnurability =
      typeof values?.vulnurability === 'string'
        ? values?.vulnurability
        : processImageUri(values?.vulnurability, 'file');

    const formData = new FormData();
    formData.append('driver_license_front', driver_license_front);
    formData.append('driver_license_back', driver_license_back);
    formData.append('valid_id_front', valid_id_front);
    formData.append('valid_id_back', valid_id_back);
    formData.append('insurance', insurance);
    formData.append('police_check', police_check);
    formData.append('vulnurability', vulnurability);

    try {
      await dispatch(
        uploadDocument({
          nextStage: null,
          navigation,
          data: formData,
          nextPage: null,
          isUpdate: true,
        }),
      ).unwrap();
      processSuccessMessage(t('toasts.documents_submitted'));
      form.resetForm();
    } catch (e) {
      console.log(e);
    }
  };

  const form = useFormik({
    initialValues: {
      driver_license_front: user.document?.driver_license_front ?? null,
      driver_license_back: user.document?.driver_license_back ?? null,
      valid_id_front: user.document?.valid_id_front ?? null,
      valid_id_back: user.document?.valid_id_back ?? null,
      cleanerInsurance: user.document?.insurance ?? null,
      backgroundCheck: user.document?.police_check ?? null,
      vulnurability: user.document?.vulnurability ?? null,
    },
    enableReinitialize: true,
    // validationSchema: _step4Schema,
    onSubmit,
  });

  return (
    <ScreenContainer
      style={{
        flex: 1,
      }}>
      <View
        style={{
          paddingHorizontal: 32,
          borderBottomColor: '#e5e5e5',

          borderBottomWidth: 2,
        }}>
        <Head pageTitle={t('documents.profile_documents')} type={2} navigation={navigation} />
      </View>
      <KeyboardAvoidingView style={{flex: 1}}>
        <View style={styles.base}>
          <View>
            <View style={styles.doubleSelect}>
              <DocumentPicker
                {...formHandler(
                  'driver_license_front',
                  form,
                  null,
                  null,
                  null,
                  true,
                )}
                documentUrl={user?.document?.driver_license_front_link}
                onChangeValue={value => {
                  form.setFieldValue('driver_license_front', value);
                }}
                // placeholder={t('contactSupport.label_first_name_placeholder')}
                label={t('documents.driver_license_front')}
                mainStyles={{width: '100%'}}
                fullWidth
              />

              <DocumentPicker
                {...formHandler(
                  'driver_license_back',
                  form,
                  null,
                  null,
                  null,
                  true,
                )}
                documentUrl={user?.document?.driver_license_back_link}
                onChangeValue={value => {
                  form.setFieldValue('driver_license_back', value);
                }}
                // placeholder={t('contactSupport.label_first_name_placeholder')}
                label={t('documents.driver_license_back')}
                mainStyles={{width: '100%'}}
                fullWidth
              />

              <DocumentPicker
                {...formHandler('valid_id_front', form, null, null, null, true)}
                documentUrl={user?.document?.valid_id_front_link}
                onChangeValue={value => {
                  form.setFieldValue('valid_id_front', value);
                }}
                // placeholder={t('contactSupport.label_first_name_placeholder')}
                label={t('documents.valid_id_front')}
                mainStyles={{width: '100%'}}
                fullWidth
              />

              <DocumentPicker
                {...formHandler('valid_id_back', form, null, null, null, true)}
                documentUrl={user?.document?.valid_id_back_link}
                onChangeValue={value => {
                  form.setFieldValue('valid_id_back', value);
                }}
                // placeholder={t('contactSupport.label_first_name_placeholder')}
                label={t('documents.valid_id_back')}
                mainStyles={{width: '100%'}}
                fullWidth
              />

              <DocumentPicker
                fullWidth
                documentUrl={user?.document?.insurance_link}
                {...formHandler(
                  'cleanerInsurance',
                  form,
                  null,
                  null,
                  null,
                  true,
                )}
                onChangeValue={value => {
                  form.setFieldValue('cleanerInsurance', value);
                }}
                label={t('documents.cleaner_insurance')}
              />
            </View>
            <View style={styles.doubleSelect}>
              <DocumentPicker
                fullWidth
                documentUrl={user?.document?.police_check_link}
                {...formHandler(
                  'backgroundCheck',
                  form,
                  null,
                  null,
                  null,
                  true,
                )}
                onChangeValue={value => {
                  form.setFieldValue('backgroundCheck', value);
                }}
                // placeholder="km"

                label={t('documents.police_background_check')}
              />
              <DocumentPicker
                fullWidth
                documentUrl={user?.document?.vulnurability_link}
                {...formHandler('vulnurability', form, null, null, null, true)}
                onChangeValue={value => {
                  form.setFieldValue('vulnurability', value);
                }}
                // placeholder="km"

                label={t('documents.vulnerability_sector_check')}
              />
            </View>
          </View>
          <Button
            text={t('rate.submit')}
            disabled={!form.dirty}
            pressed={form.handleSubmit}
            height={52}
            style={{width: '100%', marginVertical: 20}}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

export default UpdateDocumnets;

const styles = StyleSheet.create({
  base: {
    flex: 1,
    paddingHorizontal: 18,
    marginTop: '10%',
  },
  doubleSelect: {
    display: 'flex',
    // flexDirection: 'row',
    // gap: 20,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
});
