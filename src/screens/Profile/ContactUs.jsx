import React, {useEffect, useRef} from 'react';
import {StyleSheet, View, Platform, ScrollView} from 'react-native';
import ScreenContainer from '../../components/Shared/ScreenContainer';
import KeyboardAvoidingView from '../../components/Shared/KeyboardAvoidingView';
import {useDispatch, useSelector} from 'react-redux';
import Button from '../../components/Shared/Button';
import TextInputField from '../../components/Inputs/TextInputField';
import TextAreaInputField from '../../components/Inputs/TextAreaInputField';
import {formHandler} from '../../utils/formhandler';
import {useFormik} from 'formik';
import * as Yup from 'yup';
import Head from '../../components/Shared/Head';
import {contactUs} from '../../store/actions/profile/contactUs';
import {useTranslation} from 'react-i18next';

const contactUsSchema = Yup.object().shape({
  message_title: Yup.string().required('Message title is required'),
  message: Yup.string().required('Message is required'),
});

const ContactUs = ({navigation}) => {
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const {pending, success} = useSelector(state => state.ui);
  const prevSuccessRef = useRef(false);

  const onSubmit = values => {
    dispatch(
      contactUs({
        payload: {
          message_title: values.message_title,
          message: values.message,
        },
        callBack: () => {
          form.resetForm();
        },
      }),
    );
  };

  const form = useFormik({
    initialValues: {
      message_title: '',
      message: '',
    },
    validationSchema: contactUsSchema,
    onSubmit,
  });

  return (
    <ScreenContainer style={styles.screenContainer}>
      <View style={styles.header}>
        <Head pageTitle={t('contactUs.title')} type={2} navigation={navigation} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        
        <View style={styles.contentContainer}>
          {/* Scrollable content area */}
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            
            <TextInputField
              {...formHandler('message_title', form)}
              placeholder={t('contactUs.message_title_placeholder')}
              label={t('contactUs.message_title_label')}
              mainStyles={styles.titleInput}
            />

            <TextAreaInputField
              {...formHandler('message', form)}
              placeholder={t('contactUs.message_placeholder')}
              label={t('contactUs.message_label')}
              mainStyles={styles.textAreaWrapper}
            />
          </ScrollView>

          {/* Button pinned to bottom */}
          <View style={styles.buttonContainer}>
            <Button
              text={t('contactUs.submit')}
              disabled={!form.dirty || !form.isValid || pending}
              pressed={form.handleSubmit}
              loading={pending}
              height={52}
              style={styles.submitButton}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

export default ContactUs;

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 32,
    borderBottomColor: '#e5e5e5',
    borderBottomWidth: 2,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
    width: '100%',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 20,
    flexGrow: 1,
  },
  titleInput: {
    width: '100%',
    marginBottom: 16,
  },
  textAreaWrapper: {
    flex: 1,
    minHeight: Platform.OS === 'ios' ? 550 : 550,
  },
  buttonContainer: {
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  submitButton: {
    width: '100%',
  },
});