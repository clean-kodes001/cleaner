import React, {useEffect, useState} from 'react';
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
import {getProfile} from '../../store/actions/profile/getProfile';
import DocumentPicker from '../../components/Inputs/DocumentPicker';
// import {processImageUri} from '../../utils/processImageUri';
import {uploadTraining} from '../../store/actions/profile/uploadTraining';
import {_step3Schema, _step4Schema} from '../../utils/validationSchemas';
import {logOut} from '../../store/reducer/userSlice';
import {processImageUri} from '../../utils/processImageUri';
import Text from '../../components/Shared/Text';
import VideoPlayer from '../../components/Shared/Video';
import {colors} from '../../config/colors';
import {authenticated} from '../../store/actions/onboarding/authenticated';
import {getOnboardingStatus} from '../../store/actions/profile/getOnboardingStatus';
import {useTranslation} from 'react-i18next';

const Step5 = ({navigation, route}) => {
  const {t} = useTranslation();
  const {completeProfileStage, pending} = useSelector(state => state.profile);
  const {unAuthenticated, authenticated: authenticatedState} = useSelector(
    state => state.data,
  );
  const {user} = useSelector(state => state.user);
  const [trainingError, setTrainingError] = useState(false);

  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getProfile());
  }, []);
  useEffect(() => {
    dispatch(authenticated());
  }, []);

  const onSubmit = async values => {
    setTrainingError(false);
    const formData = new FormData();
    formData.append('training_status', 1);

    try {
      await dispatch(
        uploadTraining({
          nextStage: null,
          navigation,
          data: formData,
          nextPage: null,
          callback: () => {
            dispatch(getOnboardingStatus());
          },
        }),
      ).unwrap();
    } catch (error) {
      console.error('Training submission failed:', error);
      setTrainingError(true);
    }
  };

  const form = useFormik({
    initialValues: {
      training_status: 1,
    },
    onSubmit,
  });

  return (
    <ScreenContainer
      style={{
        flex: 1,
      }}>
      <StepsTopbar />
      <KeyboardAvoidingView>
        <View style={styles.base}>
          {authenticatedState?.training_videos &&
            authenticatedState.training_videos.map((training_video, index) => (
              <View key={index}>
                <Text
                  center
                  bold
                  style={{
                    fontSize: 20,
                    color: colors.primaryText,
                    width: '95%',
                    paddingBottom: 10,
                  }}>
                  {training_video.title}
                </Text>
                <VideoPlayer
                  url={training_video.video}
                  onFinish={() => form.handleSubmit()}
                />
              </View>
            ))}
          <Text
            center
            bold
            style={{
              fontSize: 20,
              color: colors.orangeDark,
              width: '100%',
              marginVertical: 10,
            }}>
            {user.document?.training_status
              ? t('onboarding.training_watched')
              : t('onboarding.training_not_watched')}
          </Text>
          <Text
            center
            bold
            style={{
              fontSize: 20,
              color: colors.textBlack,
              width: '100%',
              marginVertical: 10,
            }}>
            {t('onboarding.training_required')}
          </Text>
          {/* <Button
            text={t('rate.submit')}
            disabled={!form.dirty || !form.isValid}
            pressed={form.handleSubmit}
            height={52}
            style={{width: '100%', marginVertical: 16}}
          /> */}
          {user.document?.training_status === 1 && (
            <Button
              text={t('common.next')}
              pressed={() => {
                navigation.navigate('successInfo');
              }}
              height={52}
              style={{width: '100%', marginVertical: 16}}
            />
          )}
          {trainingError && (
            <Button
              text={t('common.retry', {defaultValue: 'Retry'})}
              outline
              pressed={() => onSubmit()}
              height={52}
              style={{width: '100%', marginBottom: 16}}
            />
          )}
          <Button
            text={t('common.logout_and_come_back')}
            outline
            pressed={() => {
              dispatch(logOut());
            }}
            height={52}
            style={{width: '100%', marginBottom: 16}}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

export default Step5;

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
