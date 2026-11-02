import React, {useEffect} from 'react';
import {
  Alert,
  Linking,
  Platform,
  PermissionsAndroid,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Text from '../Shared/Text';
import DocumentPicker, {
  isCancel,
  isInProgress,
  types,
} from 'react-native-document-picker';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import Icon from '@react-native-vector-icons/ionicons';
import Feather from '@react-native-vector-icons/feather';
import {
  validateOnboardingDocument,
  validateChatImage,
  validateContactDocument,
} from '../../utils/fileValidation';
import {useTranslation} from 'react-i18next';

const DocumentPickerRN = ({
  label,
  style,
  noPlaceHolder,
  miltiple,
  mt,
  error,
  hideError,
  onChangeValue,
  small,
  mainStyle,
  documentUrl,
  value,
  type, // 'image' for images, undefined for documents
  validationType, // 'onboarding', 'chat', 'contact', or undefined for default
  onBlur,
  disabled,
}) => {
  const {t} = useTranslation();
  const [result, setResult] = React.useState();
  const hasUserInteractedRef = React.useRef(false);
  const isInitialMountRef = React.useRef(true);

  // Sync result state with value prop (for prefilled data) - only on initial mount or when value changes from null to non-null
  useEffect(() => {
    // Only sync from value prop if:
    // 1. It's the initial mount (isInitialMountRef.current === true)
    // 2. OR value is changing from null/undefined to a non-null value (prefilling)
    // 3. AND user hasn't interacted yet (hasUserInteractedRef.current === false)
    if (
      isInitialMountRef.current ||
      (!hasUserInteractedRef.current && value && !result)
    ) {
      if (value) {
        setResult(value);
      }
      isInitialMountRef.current = false;
    }
  }, [value, result]);

  const onChangeValueRef = React.useRef(onChangeValue);
  onChangeValueRef.current = onChangeValue;

  useEffect(() => {
    // Only forward to the parent when the change came from a genuine user
    // action (camera/picker), never from the prop-sync effect above hydrating
    // `result` from a prefilled `value` (e.g. a server-confirmed upload after
    // login). Forwarding on prefill made parents that treat onChangeValue as
    // "user picked a new file" (Step4's saveDocumentField) re-upload an
    // already-uploaded remote URL, which fails and wrongly flags the field
    // as errored.
    if (result !== undefined && hasUserInteractedRef.current) {
      onChangeValueRef.current(result);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);
  const handleError = err => {
    if (isCancel(err)) {
      console.warn('cancelled');
      // User cancelled the picker, exit any dialogs or menus and move on
    } else if (isInProgress(err)) {
      console.warn(
        'multiple pickers were opened, only the last will be considered',
      );
    } else {
      throw err;
    }
  };

  const openPicker = async () => {
    if (disabled) {
      return;
    }
    try {
      const pickerResult = await DocumentPicker.pickSingle({
        presentationStyle: 'fullScreen',
        copyTo: 'cachesDirectory',
        type: [types.pdf, types.doc, types.images, types.docx],
      });

      // Log for debugging Android issues
      console.log('DocumentPicker result:', {
        name: pickerResult?.name,
        size: pickerResult?.size,
        fileSize: pickerResult?.fileSize,
        type: pickerResult?.type,
        uri: pickerResult?.uri?.substring(0, 50),
        validationType,
        platform: Platform.OS,
      });

      // On Android, DocumentPicker might not provide size immediately
      // If size is not available, we'll allow it (backend will validate)
      const hasSizeInfo = pickerResult?.size || pickerResult?.fileSize;

      // Validate based on validationType (only if size info is available)
      let isValid = true;
      if (hasSizeInfo) {
        if (validationType === 'contact') {
          isValid = validateContactDocument([pickerResult]);
        } else if (validationType === 'onboarding') {
          isValid = validateOnboardingDocument([pickerResult]);
        }
        // Default: validate as onboarding document (9MB) if no type specified
        else if (!validationType) {
          isValid = validateOnboardingDocument([pickerResult]);
        }
      } else {
        // No size info available (common on Android) - allow it, backend will validate
        console.log(
          'No file size info available, allowing document (backend will validate)',
        );
        isValid = true;
      }

      if (isValid) {
        hasUserInteractedRef.current = true; // Mark that user has interacted
        setResult([pickerResult]);
      } else {
        // Validation failed - log for debugging
        console.warn('Document validation failed:', {
          name: pickerResult?.name,
          size: pickerResult?.size,
          fileSize: pickerResult?.fileSize,
          validationType,
        });
        // Note: Alert is already shown by validation function
      }
    } catch (e) {
      handleError(e);
    }
  };
  const openPickMiltiple = async () => {
    if (disabled) {
      return;
    }
    try {
      const pickerResult = await DocumentPicker.pick({
        presentationStyle: 'fullScreen',
        copyTo: 'cachesDirectory',
        allowMultiSelection: true,
        type: [types.images],
      });

      // Validate based on validationType
      let isValid = true;
      if (validationType === 'chat') {
        isValid = validateChatImage(pickerResult);
      } else if (validationType === 'onboarding') {
        isValid = validateOnboardingDocument(pickerResult);
      }
      // Default: validate as chat image (9MB) for multiple image selection
      else if (!validationType) {
        isValid = validateChatImage(pickerResult);
      }

      if (isValid) {
        hasUserInteractedRef.current = true; // Mark that user has interacted
        setResult(pickerResult);
      }
    } catch (e) {
      handleError(e);
    }
  };

  const requestCameraPermissions = async () => {
    if (Platform.OS !== 'android') {
      return true; // iOS handles permissions automatically
    }

    try {
      // Check Android version for appropriate permission
      const androidVersion = Platform.Version;

      // Check if camera permission is already granted
      const cameraCheck = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );

      if (cameraCheck) {
        // Camera permission already granted, return true
        // Storage permission is nice to have but not critical for camera
        return true;
      }

      // Request permissions
      const permissions = [PermissionsAndroid.PERMISSIONS.CAMERA];

      // For Android 13+ (API 33+), use READ_MEDIA_IMAGES
      // For Android 12 and below, use READ_EXTERNAL_STORAGE
      if (androidVersion >= 33) {
        permissions.push(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
      } else {
        permissions.push(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
      }

      const granted = await PermissionsAndroid.requestMultiple(permissions, {
        title: t('common.camera_and_storage_permission_title'),
        message: t('common.camera_and_storage_permission_message'),
        buttonNeutral: 'Ask Me Later',
        buttonNegative: t('common.cancel'),
        buttonPositive: t('common.ok'),
      });

      const cameraGranted =
        granted[PermissionsAndroid.PERMISSIONS.CAMERA] ===
        PermissionsAndroid.RESULTS.GRANTED;
      const storageGranted =
        (androidVersion >= 33 &&
          granted[PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES] ===
            PermissionsAndroid.RESULTS.GRANTED) ||
        (androidVersion < 33 &&
          granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] ===
            PermissionsAndroid.RESULTS.GRANTED);

      if (!cameraGranted) {
        Alert.alert(
          t('common.camera_permission_required_title'),
          t('common.camera_permission_required_message'),
          [{text: t('common.ok')}],
        );
        return false;
      }

      if (!storageGranted) {
        console.warn(
          'Storage permission not granted, but camera may still work',
        );
        // Don't block camera if storage permission is denied, camera might still work
      }

      return cameraGranted;
    } catch (err) {
      console.warn('Permission request error:', err);
      // Don't block camera on permission error, let react-native-image-picker handle it
      return true;
    }
  };

  const normalizeImageResult = asset => {
    // Normalize image picker result to match document picker format
    // processImageUri expects fileCopyUri for type 'file'

    if (!asset?.uri) {
      console.warn('normalizeImageResult: Missing uri in asset', asset);
      return null;
    }

    // For Android, keep the URI as-is (it's usually file:// or content://)
    // For iOS, remove file:// prefix for uri but keep it for fileCopyUri
    let processedUri = asset.uri;
    let fileCopyUri = asset.uri;

    if (Platform.OS === 'android') {
      // Android URIs from react-native-image-picker are typically file:// URIs
      // Keep them as-is for both uri and fileCopyUri
      processedUri = asset.uri;
      fileCopyUri = asset.uri;
    } else {
      // iOS: remove file:// prefix for uri, but ensure fileCopyUri has it
      processedUri = asset.uri.replace('file://', '');
      if (!fileCopyUri.startsWith('file://')) {
        fileCopyUri = `file://${fileCopyUri}`;
      }
    }

    // Extract filename from URI if fileName is not provided
    let fileName = asset.fileName;
    if (!fileName && asset.uri) {
      const uriParts = asset.uri.split('/');
      fileName = uriParts[uriParts.length - 1] || `photo_${Date.now()}.jpg`;
    }

    return {
      name: fileName || `photo_${Date.now()}.jpg`,
      uri: processedUri,
      fileCopyUri: fileCopyUri,
      type: asset.type || 'image/jpeg',
      size: asset.fileSize || asset.size || 0,
      fileSize: asset.fileSize || asset.size || 0, // Keep both for compatibility
      base64: asset.base64 || null, // Include base64 if available for persistence
    };
  };

  const openCamera = async () => {
    if (disabled) {
      return;
    }
    try {
      // Request permissions first (Android only)
      const hasPermission = await requestCameraPermissions();
      if (!hasPermission) {
        console.log('Camera permission denied');
        return;
      }

      // Use simple options like Step2.jsx which works
      const cameraOptions = {
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: true, // Include base64 for persistence
      };

      const cameraResult = await launchCamera(cameraOptions);

      // Check for errors in result
      if (cameraResult?.errorCode) {
        const errorCode = cameraResult.errorCode;
        const errorMessage = cameraResult.errorMessage || 'Unknown error';

        console.warn('Camera error:', errorCode, errorMessage);
        if (
          errorCode === 'camera_unavailable' ||
          errorCode === 'permission' ||
          errorMessage?.toLowerCase().includes('camera') ||
          errorMessage?.toLowerCase().includes('permission')
        ) {
          Alert.alert(
            t('common.camera_not_available_title'),
            errorMessage || t('common.camera_unavailable_choose_gallery'),
            [
              {
                text: t('common.cancel'),
                style: 'cancel',
              },
              {
                text: t('common.choose_photo'),
                onPress: openImageLibrary,
              },
            ],
          );
        } else {
          Alert.alert(t('common.camera_error_title'), errorMessage || t('common.camera_unavailable_choose_gallery'));
        }
        return;
      }

      // Check if user cancelled
      if (cameraResult?.didCancel) {
        console.log('User cancelled camera');
        return;
      }

      // Process successful result
      if (cameraResult?.assets && cameraResult.assets.length > 0) {
        const asset = cameraResult.assets[0];
        const normalizedResult = normalizeImageResult(asset);
        if (normalizedResult) {
          // Log for debugging
          console.log('Camera normalized result:', {
            name: normalizedResult?.name,
            size: normalizedResult?.size,
            fileSize: normalizedResult?.fileSize,
            type: normalizedResult?.type,
            validationType,
            platform: Platform.OS,
          });

          // Check if size info is available
          const hasSizeInfo =
            normalizedResult?.size || normalizedResult?.fileSize;

          // Validate based on validationType (only if size info is available)
          let isValid = true;
          if (hasSizeInfo) {
            if (validationType === 'chat') {
              isValid = validateChatImage([normalizedResult]);
            } else if (validationType === 'contact') {
              isValid = validateContactDocument([normalizedResult]);
            } else if (validationType === 'onboarding') {
              isValid = validateOnboardingDocument([normalizedResult]);
            }
            // If type is 'image' and no validationType specified, validate as chat image (9MB)
            else if (type === 'image' && !validationType) {
              isValid = validateChatImage([normalizedResult]);
            }
          } else {
            // No size info available - allow it, backend will validate
            console.log(
              'No file size info available for camera image, allowing (backend will validate)',
            );
            isValid = true;
          }

          if (isValid) {
            hasUserInteractedRef.current = true;
            setResult([normalizedResult]);
          } else {
            console.warn('Camera image validation failed:', {
              name: normalizedResult?.name,
              size: normalizedResult?.size,
              fileSize: normalizedResult?.fileSize,
              validationType,
            });
          }
        } else {
          console.warn('Failed to normalize camera result');
          Alert.alert(t('common.error'), t('common.camera_error_title'));
        }
      } else {
        console.warn('No assets in camera result:', cameraResult);
      }
    } catch (e) {
      console.error('Camera exception:', e);
      // Show error to user
      const errorMessage =
        e?.message || e?.toString() || t('common.camera_unavailable_choose_gallery');
      Alert.alert(
        t('common.camera_error_title'),
        errorMessage + '. ' + t('common.camera_unavailable_choose_gallery'),
        [
          {
            text: t('common.cancel'),
            style: 'cancel',
          },
          {
            text: t('common.choose_photo'),
            onPress: openImageLibrary,
          },
        ],
      );
    }
  };

  const openImageLibrary = async () => {
    try {
      const libraryResult = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
        includeBase64: true, // Include base64 for persistence
      });

      if (libraryResult?.assets && libraryResult.assets.length > 0) {
        const asset = libraryResult.assets[0];
        const normalizedResult = normalizeImageResult(asset);
        if (normalizedResult) {
          // Log for debugging Android issues
          console.log('ImageLibrary result:', {
            name: normalizedResult?.name,
            size: normalizedResult?.size,
            fileSize: normalizedResult?.fileSize,
            type: normalizedResult?.type,
            validationType,
            platform: Platform.OS,
          });

          // Check if size info is available
          const hasSizeInfo =
            normalizedResult?.size || normalizedResult?.fileSize;

          // Validate based on validationType (only if size info is available)
          let isValid = true;
          if (hasSizeInfo) {
            if (validationType === 'chat') {
              isValid = validateChatImage([normalizedResult]);
            } else if (validationType === 'contact') {
              isValid = validateContactDocument([normalizedResult]);
            } else if (validationType === 'onboarding') {
              isValid = validateOnboardingDocument([normalizedResult]);
            }
            // If type is 'image' and no validationType specified, validate as chat image (9MB)
            else if (type === 'image' && !validationType) {
              isValid = validateChatImage([normalizedResult]);
            }
          } else {
            // No size info available - allow it, backend will validate
            console.log(
              'No file size info available for image, allowing (backend will validate)',
            );
            isValid = true;
          }

          if (isValid) {
            hasUserInteractedRef.current = true; // Mark that user has interacted
            setResult([normalizedResult]);
          } else {
            console.warn('Image validation failed:', {
              name: normalizedResult?.name,
              size: normalizedResult?.size,
              fileSize: normalizedResult?.fileSize,
              validationType,
            });
          }
        }
      }
    } catch (e) {
      if (e.code !== 'E_PICKER_CANCELLED') {
        console.warn('Image library error:', e);
        Alert.alert(t('common.error'), t('common.camera_unavailable_choose_gallery'));
      }
    }
  };

  return (
    <View
      style={{
        marginTop: mt || 12,
        display: 'flex',

        // width: '47%',
        width: '100%',
      }}>
      {label && (
        <Text
          fontType={'Roboto'}
          medium
          style={{fontSize: 12, marginBottom: 3}}>
          {label}
        </Text>
      )}

      <View style={[styles.select, error ? {borderColor: 'red'} : null, mainStyle]}>
        <View
          style={{
            width: '100%',
            height: '100%',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
          <View
            style={{
              flex: 2,
            }}>
            <Icon
              style={{color: '#302882'}}
              size={small ? 19 : 25}
              name="document-text-outline"
            />
            {value && value[0]?.name && (
              <Icon
                style={{color: '#00ac47'}}
                size={small ? 19 : 25}
                name="checkmark-circle-outline"
              />
            )}
            <Text
              singleLine
              style={{
                color: '#302882',
                textAlign: 'left',
                fontSize: small ? 12 : 14,
                fontFamily: 'Roboto-Regular',
              }}>
              {documentUrl
                ? t('common.file_uploaded')
                : value && value[0]?.name
                ? t('common.file_selected')
                : noPlaceHolder
                ? ''
                : t('common.please_upload_file')}
            </Text>
          </View>
          {documentUrl && (
            <TouchableOpacity
              onPress={() => {
                Linking.openURL(documentUrl);
              }}
              style={{
                display: 'flex',
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Icon
                style={{color: '#302882'}}
                name="eye-outline"
                size={small ? 18 : 24}
                color="black"
              />

              <Text style={{fontSize: small ? 12 : 14}} color={'#302882'}>
                {t('documents.view')}
              </Text>
            </TouchableOpacity>
          )}

          <>
            <TouchableOpacity
              onPress={() => {
                console.log('Camera button pressed');
                openCamera();
              }}
              disabled={disabled}
              style={{
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Icon
                style={{color: '#302882'}}
                name="camera-outline"
                size={small ? 18 : 24}
              />

              <Text style={{fontSize: small ? 12 : 14}} color={'#302882'}>
                {t('documents.camera')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={miltiple ? openPickMiltiple : openPicker}
              disabled={disabled}
              style={{
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Feather
                style={{color: '#302882'}}
                size={small ? 18 : 24}
                name="upload-cloud"
              />

              <Text style={{fontSize: small ? 12 : 14}} color={'#302882'}>
                {t('documents.upload')}
              </Text>
            </TouchableOpacity>
          </>
        </View>
      </View>

      {!hideError && error && (
        <Text fontType={'roboto'} style={styles.borderErrorStyle}>
          {error}
        </Text>
      )}

    </View>
  );
};

export default DocumentPickerRN;

const styles = StyleSheet.create({
  select: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 12,
    height: 100,
    gap: 8,

    borderColor: '#302882',
    display: 'flex',
    backgroundColor: 'transparent',
    paddingRight: 4,
    paddingLeft: 20,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },

  borderErrorStyle: {
    marginTop: 2,
    marginLeft: 4,
    fontSize: 12,
    color: 'red',
  },
});
