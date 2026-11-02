import React, {useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import StepsTopbar from '../../components/Shared/StepsBar';
import ScreenContainer from '../../components/Shared/ScreenContainer';
import KeyboardAvoidingView from '../../components/Shared/KeyboardAvoidingView';
import {useDispatch, useSelector} from 'react-redux';
import Button from '../../components/Shared/Button';
import {formHandler} from '../../utils/formhandler';
import {useFormik} from 'formik';
import DocumentPicker from '../../components/Inputs/DocumentPicker';
import {uploadDocument} from '../../store/actions/profile/uploadDocument';
import {getOnboardingStatus} from '../../store/actions/profile/getOnboardingStatus';
import {logOut} from '../../store/reducer/userSlice';
import {processImageUri} from '../../utils/processImageUri';
import {useTranslation} from 'react-i18next';

// Formik field name -> backend field name (the two diverge for 3 of the 7).
const FIELD_TO_API_NAME = {
  driver_license_front: 'driver_license_front',
  driver_license_back: 'driver_license_back',
  valid_id_front: 'valid_id_front',
  valid_id_back: 'valid_id_back',
  cleanerInsurance: 'insurance',
  backgroundCheck: 'police_check',
  vulnurability: 'vulnurability',
};

const DOCUMENT_FIELDS = [
  {formKey: 'driver_license_front', linkKey: 'driver_license_front_link'},
  {formKey: 'driver_license_back', linkKey: 'driver_license_back_link'},
  {formKey: 'valid_id_front', linkKey: 'valid_id_front_link'},
  {formKey: 'valid_id_back', linkKey: 'valid_id_back_link'},
  {formKey: 'cleanerInsurance', linkKey: 'insurance_link'},
  {formKey: 'backgroundCheck', linkKey: 'police_check_link'},
  {formKey: 'vulnurability', linkKey: 'vulnurability_link'},
];

// DocumentPicker expects an array of {uri, name, type, fileCopyUri}.
const convertDocumentLink = link => {
  if (!link) return null;
  return [
    {
      name: link.split('/').pop() || 'document',
      uri: link,
      fileCopyUri: link,
      type: 'application/pdf',
    },
  ];
};

const Step4 = ({navigation, route}) => {
  const {t} = useTranslation();
  const {user, onboardingStatus} = useSelector(state => state.user);
  const dispatch = useDispatch();

  // formKey -> 'saving' | 'saved' | 'error'. Drives per-field disabled/error UI
  // and whether "Next" can be pressed — there's no single form submission
  // anymore, each document commits to the backend the moment it's picked.
  const [documentStatus, setDocumentStatus] = useState({});

  const onboarding = onboardingStatus?.onboarding_status;
  const isDocumentUploadUpdate =
    onboarding?.document_upload === 1 || onboarding?.document_upload === true;
  const requiredDocumentFieldsRaw = Array.isArray(
    onboarding?.required_document_fields,
  )
    ? onboarding.required_document_fields
    : [];
  const granularDocumentUpdate =
    isDocumentUploadUpdate && requiredDocumentFieldsRaw.length > 0;

  const documentFieldToFormKey = {
    driver_license_front: 'driver_license_front',
    driver_license_back: 'driver_license_back',
    valid_id_front: 'valid_id_front',
    valid_id_back: 'valid_id_back',
    insurance: 'cleanerInsurance',
    police_check: 'backgroundCheck',
    vulnurability: 'vulnurability',
  };

  const requiredDocumentFormFields = granularDocumentUpdate
    ? requiredDocumentFieldsRaw
        .map(k => documentFieldToFormKey[k])
        .filter(Boolean)
    : [];

  // A document the admin flagged as needing re-upload (granular doc update).
  const isDocumentFieldRequired = formKey =>
    granularDocumentUpdate && requiredDocumentFormFields.includes(formKey);

  const isDocumentFieldDisabled = formKey =>
    (granularDocumentUpdate && !requiredDocumentFormFields.includes(formKey)) ||
    documentStatus[formKey] === 'saving';

  const getDocumentUrl = (formKey, url) => {
    if (!isDocumentUploadUpdate) return url;
    if (granularDocumentUpdate) {
      return requiredDocumentFormFields.includes(formKey) ? null : url;
    }
    return null;
  };

  const documentError = formKey => {
    if (documentStatus[formKey] === 'error') {
      return t('onboarding.document_save_failed', {
        defaultValue: 'Upload failed — tap to retry',
      });
    }
    if (isDocumentFieldRequired(formKey) && !form.values?.[formKey]) {
      return t('validation.required');
    }
    return undefined;
  };

  const form = useFormik({initialValues: {}, onSubmit: () => {}});

  // Seed each picker from whatever's already saved server-side: user.document
  // (kept fresh after every per-field save below, via the same mechanism
  // Step5 already relies on for training_status) covers a returning cleaner
  // resuming a normal (non-NIGO) partial session; onboarding_status.document_data
  // additionally covers the NIGO re-upload prefill.
  //
  // Known limitation: this reseeds ALL 7 fields from server state on every
  // onboardingStatus change, including the getOnboardingStatus() refetch that
  // follows each per-field save. With 2+ documents flagged, picking a second
  // field before the first field's refetch resolves can flicker that second
  // field's displayed value while it's still 'saving' — cosmetic only, the
  // field stays disabled throughout so nothing is lost or corrupted.
  useEffect(() => {
    const documentData = onboardingStatus?.document_data || null;
    const initialValues = {};
    DOCUMENT_FIELDS.forEach(({formKey, linkKey}) => {
      if (isDocumentFieldRequired(formKey)) {
        initialValues[formKey] = null;
        return;
      }
      const link =
        documentData?.[linkKey] || user?.document?.[linkKey] || null;
      initialValues[formKey] = convertDocumentLink(link);
    });
    form.setValues(initialValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboardingStatus, user?.document]);

  const saveDocumentField = async (formKey, value) => {
    form.setFieldValue(formKey, value); // show the picked file immediately
    if (!value || !Array.isArray(value) || value.length === 0) return;

    const processed = processImageUri(value, 'file');
    if (!processed) {
      setDocumentStatus(s => ({...s, [formKey]: 'error'}));
      return;
    }

    setDocumentStatus(s => ({...s, [formKey]: 'saving'}));
    const formData = new FormData();
    formData.append(FIELD_TO_API_NAME[formKey], processed);

    try {
      await dispatch(
        uploadDocument({
          navigation,
          data: formData,
          isUpdate: true,
          nextStage: null,
          nextPage: null,
        }),
      ).unwrap();
      await dispatch(getOnboardingStatus());
      setDocumentStatus(s => ({...s, [formKey]: 'saved'}));
    } catch (error) {
      console.error(`Document save failed for ${formKey}:`, error);
      setDocumentStatus(s => ({...s, [formKey]: 'error'}));
    }
  };

  // A field is satisfied either by a fresh save this session, or (for fields
  // the admin didn't flag) by a document already on file from a prior session.
  const isFieldSatisfied = ({formKey, linkKey}) => {
    if (documentStatus[formKey] === 'saved') return true;
    if (documentStatus[formKey] === 'saving' || documentStatus[formKey] === 'error') {
      return false;
    }
    // A NIGO task can be flagged document_upload=true with no stored field list
    // (a legacy rejection predating granular NIGO) — the backend then treats it
    // as "all 7 need redoing" (see updateOnboardingRequirementsAndProcess).
    // Mirror that here: don't let an old, not-yet-replaced link count as done.
    if (isDocumentUploadUpdate && !granularDocumentUpdate) return false;
    if (isDocumentFieldRequired(formKey)) return false;
    return !!(user?.document?.[linkKey] || onboardingStatus?.document_data?.[linkKey]);
  };

  const isButtonDisabled = () => !DOCUMENT_FIELDS.every(isFieldSatisfied);

  const handleNext = async () => {
    const result = await dispatch(getOnboardingStatus());
    const freshStatus = result.payload;
    if (
      freshStatus?.onboarding_status?.bio_data === 1 ||
      freshStatus?.onboarding_status?.bio_data === true
    ) {
      // Shouldn't happen in the normal sequential flow, but a NIGO cleaner
      // could in principle have both bio and documents flagged.
      navigation.navigate('step3');
      return;
    }
    const trainingDone =
      user?.document?.training_status === 1 ||
      user?.document?.training_status === true;
    if (trainingDone) {
      // Documents were the only thing flagged (NIGO) and training was already
      // completed previously — back under review, not back through training.
      navigation.navigate('successInfo');
    } else {
      navigation.reset({index: 0, routes: [{name: 'step5'}]});
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
            <View style={styles.doubleSelect}>
              <DocumentPicker
                {...formHandler('driver_license_front', form)}
                error={documentError('driver_license_front')}
                value={form.values.driver_license_front}
                validationType="onboarding"
                disabled={isDocumentFieldDisabled('driver_license_front')}
                onChangeValue={value =>
                  saveDocumentField('driver_license_front', value)
                }
                documentUrl={getDocumentUrl(
                  'driver_license_front',
                  user?.document?.driver_license_front_link ||
                    onboardingStatus?.document_data?.driver_license_front_link ||
                    null,
                )}
                label={t('documents.driver_license_front')}
                mainStyles={{width: '100%'}}
                fullWidth
              />

              <DocumentPicker
                {...formHandler('driver_license_back', form)}
                error={documentError('driver_license_back')}
                value={form.values.driver_license_back}
                validationType="onboarding"
                disabled={isDocumentFieldDisabled('driver_license_back')}
                onChangeValue={value =>
                  saveDocumentField('driver_license_back', value)
                }
                documentUrl={getDocumentUrl(
                  'driver_license_back',
                  user?.document?.driver_license_back_link ||
                    onboardingStatus?.document_data?.driver_license_back_link ||
                    null,
                )}
                label={t('documents.driver_license_back')}
                mainStyles={{width: '100%'}}
                fullWidth
              />

              <DocumentPicker
                {...formHandler('valid_id_front', form)}
                error={documentError('valid_id_front')}
                value={form.values.valid_id_front}
                validationType="onboarding"
                disabled={isDocumentFieldDisabled('valid_id_front')}
                onChangeValue={value =>
                  saveDocumentField('valid_id_front', value)
                }
                documentUrl={getDocumentUrl(
                  'valid_id_front',
                  user?.document?.valid_id_front_link ||
                    onboardingStatus?.document_data?.valid_id_front_link ||
                    null,
                )}
                label={t('documents.valid_id_front')}
                mainStyles={{width: '100%'}}
                fullWidth
              />

              <DocumentPicker
                {...formHandler('valid_id_back', form)}
                error={documentError('valid_id_back')}
                value={form.values.valid_id_back}
                validationType="onboarding"
                disabled={isDocumentFieldDisabled('valid_id_back')}
                onChangeValue={value =>
                  saveDocumentField('valid_id_back', value)
                }
                documentUrl={getDocumentUrl(
                  'valid_id_back',
                  user?.document?.valid_id_back_link ||
                    onboardingStatus?.document_data?.valid_id_back_link ||
                    null,
                )}
                label={t('documents.valid_id_back')}
                mainStyles={{width: '100%'}}
                fullWidth
              />

              <DocumentPicker
                fullWidth
                {...formHandler('cleanerInsurance', form)}
                error={documentError('cleanerInsurance')}
                value={form.values.cleanerInsurance}
                validationType="onboarding"
                disabled={isDocumentFieldDisabled('cleanerInsurance')}
                onChangeValue={value =>
                  saveDocumentField('cleanerInsurance', value)
                }
                documentUrl={getDocumentUrl(
                  'cleanerInsurance',
                  user?.document?.insurance_link ||
                    onboardingStatus?.document_data?.insurance_link ||
                    null,
                )}
                label={t('documents.cleaner_insurance')}
              />
            </View>
            <View style={styles.doubleSelect}>
              <DocumentPicker
                fullWidth
                {...formHandler('backgroundCheck', form)}
                error={documentError('backgroundCheck')}
                value={form.values.backgroundCheck}
                validationType="onboarding"
                disabled={isDocumentFieldDisabled('backgroundCheck')}
                onChangeValue={value =>
                  saveDocumentField('backgroundCheck', value)
                }
                documentUrl={getDocumentUrl(
                  'backgroundCheck',
                  user?.document?.police_check_link ||
                    onboardingStatus?.document_data?.police_check_link ||
                    null,
                )}
                label={t('documents.police_background_check')}
              />
              <DocumentPicker
                fullWidth
                {...formHandler('vulnurability', form)}
                error={documentError('vulnurability')}
                value={form.values.vulnurability}
                validationType="onboarding"
                disabled={isDocumentFieldDisabled('vulnurability')}
                onChangeValue={value =>
                  saveDocumentField('vulnurability', value)
                }
                documentUrl={getDocumentUrl(
                  'vulnurability',
                  user?.document?.vulnurability_link ||
                    onboardingStatus?.document_data?.vulnurability_link ||
                    null,
                )}
                label={t('documents.vulnerability_sector_check')}
              />
            </View>
          </View>
          <Button
            text={t('common.next')}
            disabled={isButtonDisabled()}
            pressed={handleNext}
            height={52}
            style={{width: '100%', marginVertical: 16}}
          />
          <Button
            text={t('common.logout_and_come_back')}
            outline
            pressed={() => dispatch(logOut())}
            height={52}
            style={{width: '100%', marginBottom: 16}}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

export default Step4;

const styles = StyleSheet.create({
  base: {
    flex: 1,
    paddingHorizontal: 18,
  },
  doubleSelect: {
    display: 'flex',
    // flexDirection: 'row',
    // gap: 20,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
});
