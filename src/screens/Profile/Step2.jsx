import React, {useState} from 'react';
import {
  Alert,
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  PermissionsAndroid,
} from 'react-native';
import StepsTopbar from '../../components/Shared/StepsBar';
import ScreenContainer from '../../components/Shared/ScreenContainer';
import {useDispatch, useSelector} from 'react-redux';
import Button from '../../components/Shared/Button';
import {uploadProfile} from '../../store/actions/profile/uploadProfile';
import {getOnboardingStatus} from '../../store/actions/profile/getOnboardingStatus';
import Text from '../../components/Shared/Text';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {validateAvatar} from '../../utils/fileValidation';
import {showToast} from '../../utils/showToast';
import {useTranslation} from 'react-i18next';

const Step2 = ({navigation, route}) => {
  const {t} = useTranslation();
  const {user, onboardingStatus} = useSelector(state => state.user);
  const [image, setImage] = useState(null);
  const dispatch = useDispatch();

  const handleNext = async () => {
    // A profile photo is mandatory. Allow continuing only with a newly picked
    // image or an existing REAL uploaded photo. Note: user.avatar is never empty
    // because the backend falls back to a generated initials image, so rely on
    // has_real_avatar (falls back to user.avatar only for older payloads).
    const hasNewImage = image && image.assets && image.assets.length > 0;
    const hasExistingPhoto = user?.has_real_avatar ?? !!user?.avatar;
    const onboarding = onboardingStatus?.onboarding_status;
    const requiredBioFields = Array.isArray(onboarding?.required_bio_fields)
      ? onboarding.required_bio_fields
      : [];
    // When the admin flagged the photo for re-upload, the cleaner already has an
    // (old) avatar on file, so require a freshly picked image rather than letting
    // the existing one satisfy the requirement.
    const requiresNewAvatar = requiredBioFields.includes('avatar');
    if ((requiresNewAvatar || !hasExistingPhoto) && !hasNewImage) {
      showToast({
        type: 0,
        message: t('onboarding.photo_required'),
      });
      return;
    }

    let avatar;
    if (hasNewImage) {
      const assetUri = image.assets[0].uri;
      // Handle URI for both iOS and Android
      const uri =
        Platform.OS === 'android' ? assetUri : assetUri.replace('file://', '');
      const filename = assetUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const ext = match?.[1] || 'jpg';
      const imageType = match ? `image/${match[1]}` : 'image/jpeg';
      avatar = {uri, name: `image.${ext}`, type: imageType};
    }

    const needsBioFields = requiredBioFields.some(f => f !== 'avatar');
    const needsDocuments =
      onboarding?.document_upload === 1 ||
      onboarding?.document_upload === true;

    if (!avatar) {
      // No new photo picked, but an existing real photo already satisfies this
      // step (checked above) — nothing to save, just proceed.
      navigation.navigate('step3');
      return;
    }

    // Every confirmed photo saves immediately, matching how Step3/Step4/Step5
    // each commit their own data on submit — this is what makes the photo
    // durable across a logout the moment "Next" is tapped (see BUG-0004).
    const formData = new FormData();
    formData.append('avatar', avatar);
    try {
      await dispatch(
        uploadProfile({
          navigation,
          data: formData,
          isUpdate: true,
          nextStage: null,
          nextPage: null,
        }),
      ).unwrap();
      await dispatch(getOnboardingStatus());
      if (requiresNewAvatar && !needsBioFields) {
        // Granular resubmission where the photo was the ONLY bio item flagged
        // — advance only to steps that still need correction, never the bio step.
        navigation.navigate(needsDocuments ? 'step4' : 'successInfo');
      } else {
        navigation.navigate('step3');
      }
    } catch (error) {
      console.error('Avatar save failed:', error);
      showToast({
        type: 0,
        message: t('onboarding.photo_update_failed', {
          defaultValue: 'Could not update your photo. Please try again.',
        }),
      });
    }
  };

  // Request camera permission for Android
  const requestCameraPermission = async () => {
    if (Platform.OS !== 'android') {
      return true; // iOS handles permissions automatically
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: t('common.camera_permission_title'),
          message: t('common.camera_permission_message'),
          buttonNeutral: 'Ask Me Later',
          buttonNegative: t('common.cancel'),
          buttonPositive: t('common.ok'),
        },
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Camera permission error:', err);
      return false;
    }
  };

  const handlePressed = async type => {
    // Request camera permission for Android before launching camera
    if (type === 'camera' && Platform.OS === 'android') {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        showToast({
          type: 0,
          message: t('common.camera_permission_required_message'),
        });
        return;
      }
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      includeBase64: true, // Include base64 for persistence
    };

    // Add cameraType for selfie (front camera)
    if (type === 'camera') {
      options.cameraType = 'front'; // Front camera for selfie
      options.saveToPhotos = false; // Don't save to gallery automatically
    }

    try {
      let result;
      if (type === 'camera') {
        result = await launchCamera(options);
      } else if (type === 'library') {
        result = await launchImageLibrary(options);
      }

      // Check for errors
      if (result?.errorCode) {
        const errorCode = result.errorCode;
        const errorMessage = result.errorMessage || 'Unknown error';

        if (
          errorCode === 'camera_unavailable' ||
          errorCode === 'permission' ||
          errorMessage?.toLowerCase().includes('camera') ||
          errorMessage?.toLowerCase().includes('permission')
        ) {
          // Offer gallery fallback via Alert
          Alert.alert(
            t('common.camera_unavailable_title'),
            errorMessage || t('common.camera_unavailable_choose_gallery'),
            [
              {text: t('common.cancel'), style: 'cancel'},
              {text: t('common.choose_from_gallery'), onPress: () => handlePressed('library')},
            ],
          );
        } else {
          Alert.alert(
            t('common.camera_error_title'),
            errorMessage || t('common.camera_unavailable_choose_gallery'),
            [
              {text: t('common.cancel'), style: 'cancel'},
              {text: t('common.choose_from_gallery'), onPress: () => handlePressed('library')},
            ],
          );
        }
        return;
      }

      // Check if user cancelled
      if (result?.didCancel) {
        return;
      }

      if (result?.assets && result.assets.length > 0) {
        // Validate file size and format
        if (validateAvatar(result)) {
          setImage(result);
        }
      }
    } catch (error) {
      console.log('Image picker error:', error);
      if (
        error?.code === 'E_PERMISSION_MISSING' ||
        error?.message?.includes('permission')
      ) {
        showToast({
          type: 0,
          message: t('common.camera_permission_required_message'),
        });
      } else {
        showToast({
          type: 0,
          message: t('common.camera_unavailable_choose_gallery'),
        });
      }
    }
  };

  const [showModal, setShowModal] = useState(false);

  const showCamera = () => {
    handlePressed('camera');
    setShowModal(false);
  };
  const showLibrary = () => {
    handlePressed('library');
    setShowModal(false);
  };

  return (
    <ScreenContainer
      style={{
        flex: 1,
      }}>
      <StepsTopbar />

      <View style={styles.base}>
        <View
          style={{
            display: 'flex',
            justifyContent: 'space-evenly',
            height: '75%',
            alignItems: 'center',
          }}>
          <TouchableOpacity
            onPress={() => setShowModal(true)}
            style={{
              width: 250,
              height: 250,
              borderRadius: 125,
              position: 'relative',
              borderWidth: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              borderColor: '#b9b3ef',
              overflow: 'hidden',
            }}>
            <Image
              style={{
                width: user?.avatar && !image ? '105%' : '100%',
                height: user?.avatar && !image ? '105%' : '100%',
              }}
              source={{uri: image?.assets[0]?.uri || user?.avatar}}
            />
            {!image && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                }}
              />
            )}
            {!image && (
              <Text
                fontType={'roboto'}
                bold
                center
                style={{fontSize: 14, color: '#fff', position: 'absolute'}}>
                {t('onboarding.selfie_click_prompt')}
              </Text>
            )}
          </TouchableOpacity>

          <Button
            text={t('common.next')}
            pressed={handleNext}
            height={52}
            style={{width: '100%', marginVertical: 16}}
          />
        </View>
      </View>

      {showModal && (
        <>
          <TouchableOpacity
            onPress={() => setShowModal(false)}
            style={{
              backgroundColor: 'rgba(0,0,0,0.3)',
              position: 'absolute',
              bottom: 0,
              top: 0,
              height: '100%',
              width: '100%',
            }}
          />
          <View
            style={{
              backgroundColor: '#fff',
              position: 'absolute',
              bottom: 0,
              marginBottom: 12,
              width: '100%',
              borderRadius: 16,
              height: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
            }}>
            <Button
              text={t('common.take_selfie')}
              pressed={showCamera}
              height={52}
              style={{width: '80%'}}
            />
            <Button
              outline
              text={t('common.choose_picture')}
              pressed={showLibrary}
              height={52}
              style={{width: '80%'}}
            />
          </View>
        </>
      )}
    </ScreenContainer>
  );
};

export default Step2;

const styles = StyleSheet.create({
  base: {
    flex: 1,
    paddingHorizontal: 18,
  },
});
