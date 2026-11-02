import React from 'react';
import {
  Alert,
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  PermissionsAndroid,
} from 'react-native';
import {colors} from '../../config/colors';
import timeformatter, {calcTime, calcTimeEst} from '../../utils/timeformatter';
import Text from '../../components/Shared/Text';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {uploadPropertyImages} from '../../store/actions/dashboard/uploadPropertyImages';
import {markPhotoUnavailable} from '../../store/reducer/userSlice';
import PropertyImageStrip from '../../components/Dashboard/PropertyImageStrip';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {showToast} from '../../utils/showToast';
import {useTranslation} from 'react-i18next';

const CleanDeepDetails = ({}) => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const {authenticated: authenticatedData} = useSelector(state => state.data);
  const data = useSelector(state => state.user.cleanRequest);

  const {walkThroughState} = useSelector(state => state.user);
  const livePosition = useSelector(state => state.user.livePosition);
  const dispatch = useDispatch();
  const acceptedCleanRequest = useSelector(
    state => state.user.acceptedCleanRequest,
  );
  const photoUploads = useSelector(state => state.user.photoUploads);

  console.log('data==>', data);

  const formattedCleanData =
    data?.clean_amend?.status === 1
      ? data?.clean_amend
      : data?.clean_amend_oldest?.status === 1
      ? data?.clean_amend_oldest
      : data;

  // Request camera permission for Android
  const requestCameraPermission = async () => {
    if (Platform.OS !== 'android') {
      return true; // iOS handles permissions automatically
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: t('common.camera_permission_message'),
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Camera permission error:', err);
      return false;
    }
  };

  // capturePosition is passed in explicitly rather than read from the store here, so the
  // retry path re-sends the position the photo was TAKEN at instead of wherever the cleaner
  // happens to be when they retry.
  const buildUploadFormData = (uri, capturePosition) => {
    const filename = uri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const ext = match?.[1] || 'jpg';
    const mimeType = match ? `image/${match[1]}` : 'image/jpeg';

    const formData = new FormData();
    formData.append('status', acceptedCleanRequest.status);
    formData.append('images_time', 'start');
    formData.append('image', {uri, name: `image.${ext}`, type: mimeType});

    // Omitted entirely when there was no fix, so the server stores no metadata for this
    // photo rather than a guessed one.
    if (capturePosition?.lat && capturePosition?.lng) {
      formData.append('lat', String(capturePosition.lat));
      formData.append('lng', String(capturePosition.lng));
      formData.append(
        'accuracy_m',
        String(Math.round(capturePosition.accuracy ?? 100)),
      );
    }

    return formData;
  };

  const processImage = asset => {
    // Validate file size (9 MB)
    if (asset?.fileSize && asset.fileSize > 9 * 1024 * 1024) {
      Alert.alert(t('toasts.file_size_error_title'), 'The file must not be more than 9MB.');
      return;
    }

    if (!acceptedCleanRequest?.status) {
      showToast({
        type: 0,
        message: t('common.unable_upload_property_images'),
      });
      return;
    }

    const assetUri = asset.uri;

    // KEEP file:// prefix for iOS FormData upload (fixing the bug)
    const uri = assetUri;

    // Snapshot the position at the moment the shutter closed, and carry it on the upload
    // entry so a later retry re-sends this exact fix.
    const capturePosition = livePosition
      ? {
          lat: livePosition.lat,
          lng: livePosition.lng,
          accuracy: livePosition.accuracy,
        }
      : null;

    dispatch(
      uploadPropertyImages({
        data: buildUploadFormData(uri, capturePosition),
        localId: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        uri,
        capturePosition,
      }),
    );
  };

  // Retry re-reads the original camera temp file. Image.getSize fails when the
  // OS has purged it, which is the only way to tell "retry will work" from
  // "the cleaner has to retake it".
  const handleRetryPhoto = entry => {
    Image.getSize(
      entry.uri,
      () => {
        dispatch(
          uploadPropertyImages({
            data: buildUploadFormData(entry.uri, entry.capturePosition),
            localId: entry.localId,
            uri: entry.uri,
            capturePosition: entry.capturePosition,
          }),
        );
      },
      () => dispatch(markPhotoUnavailable(entry.localId)),
    );
  };

  const handleLaunchGallery = async () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1920,
      selectionLimit: 1,
      presentationStyle: 'fullScreen',
    };

    try {
      const result = await launchImageLibrary(options);

      if (result.didCancel) return;

      if (result.errorCode) {
        showToast({
          type: 0,
          message: result.errorMessage || 'Unable to open gallery',
        });
        return;
      }

      if (result.assets && result.assets.length > 0) {
        processImage(result.assets[0]);
      }
    } catch (error) {
      console.log('Gallery error:', error);
      showToast({
        type: 0,
        message: t('common.unable_open_gallery'),
      });
    }
  };

  const handleUploadImage = async imageType => {
    console.log('handleUploadImage imageType:', imageType);

    // Request camera permission for Android before launching camera
    if (Platform.OS === 'android') {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        showToast({
          type: 0,
          message: t('common.camera_permission_required'),
        });
        return;
      }
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1920,
      cameraType: 'back',
      saveToPhotos: false,
      presentationStyle: 'fullScreen', // Helps on iOS
    };

    try {
      console.log('Launching camera with options:', options);
      const result = await launchCamera(options);
      console.log('Camera result:', JSON.stringify(result, null, 2));

      // Check for specific error codes
      if (result?.errorCode) {
        const errorCode = result.errorCode;
        const errorMessage = result.errorMessage || 'Unknown error';
        console.error('Camera Error Code:', errorCode, errorMessage);

        // If camera is unavailable (e.g. Simulator), offer gallery
        if (errorCode === 'camera_unavailable') {
          Alert.alert(
            'Camera Unavailable',
            'Camera is not available on this device. Would you like to choose from gallery instead?',
            [
              {text: 'Cancel', style: 'cancel'},
              {text: 'Choose from Gallery', onPress: handleLaunchGallery},
            ],
          );
          return;
        }

        showToast({
          type: 0,
          message: errorMessage || 'Unable to open camera.',
        });
        return;
      }

      // Check if user cancelled
      if (result?.didCancel) {
        console.log('User cancelled camera');
        return;
      }

      if (result?.assets && result.assets.length > 0) {
        processImage(result.assets[0]);
      }
    } catch (error) {
      console.error('handleUploadImage exception:', error);

      // Handle generic exceptions that might mean camera failure
      if (
        error?.message?.includes('not available') ||
        error?.message?.includes('Simulator')
      ) {
        Alert.alert(
          'Camera Unavailable',
          'Camera is not available. Would you like to choose from gallery instead?',
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Choose from Gallery', onPress: handleLaunchGallery},
          ],
        );
        return;
      }

      if (
        error?.code === 'E_PERMISSION_MISSING' ||
        error?.message?.includes('permission')
      ) {
        showToast({
          type: 0,
          message: t('common.camera_permission_required'),
        });
      } else {
        showToast({
          type: 0,
          message:
            'Unable to access camera: ' + (error?.message || 'Unknown error'),
        });
      }
    }
  };

  const handleDisplayImages = (images, startIndex = 0) => {
    const _images = images.map(image => {
      return {
        uri: image,
      };
    });

    navigation.navigate('viewimages', {
      images: _images,
      type: 2,
      startIndex,
    });
  };

  return (
    <>
      <View style={[styles.detailsItem, styles.detailsItemQuantity]}>
        <View style={styles.detailsItemInner}>
          <Text color={'#525354'} fontType={'roboto'} style={{fontSize: 12}}>{t('cleanerDashboard.type_of_cleaning')}</Text>
          <Text
            color={'#0B071B'}
            fontType={'roboto'}
            semibold
            style={{fontSize: 16}}>
            {data?.clean_type?.name}
          </Text>
        </View>
        <View style={styles.detailsItemInner}>
          <Text color={'#525354'} fontType={'roboto'} style={{fontSize: 12}}>{t('cleanDetails.no_of_cleaners')}</Text>
          <Text
            color={'#0B071B'}
            fontType={'roboto'}
            semibold
            style={{fontSize: 16}}>
            {data?.cleaners}
          </Text>
        </View>

        <View style={styles.detailsItemInner}>
          <Text color={'#525354'} fontType={'roboto'} style={{fontSize: 12}}>{t('cleanerDashboard.estimated_pay')}</Text>
          <Text
            color={'#0B071B'}
            fontType={'roboto'}
            semibold
            style={{fontSize: 16}}>
            {data?.country?.currency || 'CAD $'}{' '}
            {Number(data?.estimated_clean_duration_amount).toFixed(2)}
          </Text>
        </View>

        <View style={styles.detailsItemInner}>
          <Text color={'#525354'} fontType={'roboto'} style={{fontSize: 12}}>{t('cleanDetails.estimated_time')}</Text>
          <Text
            color={'#0B071B'}
            fontType={'roboto'}
            semibold
            style={{fontSize: 16}}>
            {calcTime(formattedCleanData?.duration)}
          </Text>
        </View>

        {/* {acceptedCleanRequest?.status === 1 || walkThroughState && acceptedCleanRequest?.status === 3 ? ( */}
        {walkThroughState ||
        (acceptedCleanRequest &&
          acceptedCleanRequest?.status !== 1 &&
          acceptedCleanRequest?.status !== 3) ? (
          <View style={[styles.detailsItemInner, {width: '100%'}]}>
            <TouchableOpacity style={{gap: 8}} onPress={handleUploadImage}>
              <Text
                // color={'#0B071B'}

                color={colors.primary}
                fontType={'roboto'}
                semibold
                style={{fontSize: 14}}>{t('cleanDetails.take_property_images')}</Text>
              <View
                style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                <MaterialCommunityIcons
                  color={colors.primary}
                  name="camera-outline"
                  size={30}
                />
              </View>
            </TouchableOpacity>
            <PropertyImageStrip
              serverImages={acceptedCleanRequest?.clean?.images_link || []}
              uploads={photoUploads}
              onPressServerImage={index =>
                handleDisplayImages(
                  acceptedCleanRequest?.clean?.images_link,
                  index,
                )
              }
              onRetry={handleRetryPhoto}
            />
          </View>
        ) : (
          <></>
        )}
      </View>
      <View
        style={[
          styles.detailsItem,
          styles.detailsItemQuantity,
          {paddingBottom: 0},
        ]}>
        <View style={styles.detailsItemInner}>
          <Text color={'#525354'} fontType={'roboto'} style={{fontSize: 12}}>{t('cleanDetails.bedrooms')}</Text>
          <Text
            color={'#0B071B'}
            fontType={'roboto'}
            semibold
            style={{fontSize: 16}}>
            {formattedCleanData?.bedrooms}
          </Text>
        </View>
        <View style={styles.detailsItemInner}>
          <Text color={'#525354'} fontType={'roboto'} style={{fontSize: 12}}>{t('cleanDetails.washrooms')}</Text>
          <Text
            color={'#0B071B'}
            fontType={'roboto'}
            semibold
            style={{fontSize: 16}}>
            {formattedCleanData?.washrooms}
          </Text>
        </View>
        <View style={styles.detailsItemInner}>
          <Text color={'#525354'} fontType={'roboto'} style={{fontSize: 12}}>{t('cleanDetails.kitchens')}</Text>
          <Text
            color={'#0B071B'}
            fontType={'roboto'}
            semibold
            style={{fontSize: 16}}>
            {formattedCleanData?.kitchens}
          </Text>
        </View>
        <View style={styles.detailsItemInner}>
          <Text color={'#525354'} fontType={'roboto'} style={{fontSize: 12}}>{t('cleanDetails.other_rooms')}</Text>
          <Text
            color={'#0B071B'}
            fontType={'roboto'}
            semibold
            style={{fontSize: 16}}>
            {formattedCleanData?.otherrooms}
          </Text>
        </View>
        <View style={styles.detailsItemInner}>
          <Text color={'#525354'} fontType={'roboto'} style={{fontSize: 12}}>{t('cleanDetails.living_family_rooms')}</Text>
          <Text
            color={'#0B071B'}
            fontType={'roboto'}
            semibold
            style={{fontSize: 16}}>
            {formattedCleanData?.livingrooms}
          </Text>
        </View>
        <View style={styles.detailsItemInner}>
          <Text color={'#525354'} fontType={'roboto'} style={{fontSize: 12}}>{t('cleanDetails.dinning_rooms')}</Text>
          <Text
            color={'#0B071B'}
            fontType={'roboto'}
            semibold
            style={{fontSize: 16}}>
            {formattedCleanData?.dinningrooms}
          </Text>
        </View>
        <View style={styles.detailsItemInner}>
          <Text color={'#525354'} fontType={'roboto'} style={{fontSize: 12}}>{t('cleanDetails.laundry_rooms')}</Text>
          <Text
            color={'#0B071B'}
            fontType={'roboto'}
            semibold
            style={{fontSize: 16}}>
            {formattedCleanData?.laundryrooms}
          </Text>
        </View>
        <View style={styles.detailsItemInner}>
          <Text color={'#525354'} fontType={'roboto'} style={{fontSize: 12}}>{t('cleanDetails.office_den_rooms')}</Text>
          <Text
            color={'#0B071B'}
            fontType={'roboto'}
            semibold
            style={{fontSize: 16}}>
            {formattedCleanData?.officerooms}
          </Text>
        </View>

        <View style={[styles.detailsItem, styles.detailsItemQuantity]}>
          <View style={[{width: '100%'}]}>
            <Text fontType={'roboto'} bold style={{fontSize: 14}}>{t('cleanDetails.extras_header')}</Text>
          </View>
          <View style={styles.detailsItemInner}>
            <Text color={'#525354'} fontType={'roboto'} style={{fontSize: 12}}>{t('cleanDetails.refrigerator')}</Text>
            <Text
              color={'#0B071B'}
              fontType={'roboto'}
              semibold
              style={{fontSize: 16}}>
              {formattedCleanData?.extras?.refridgerator}
            </Text>
          </View>
          <View style={styles.detailsItemInner}>
            <Text color={'#525354'} fontType={'roboto'} style={{fontSize: 12}}>{t('cleanDetails.stove')}</Text>
            <Text
              color={'#0B071B'}
              fontType={'roboto'}
              semibold
              style={{fontSize: 16}}>
              {formattedCleanData?.extras?.stove}
            </Text>
          </View>
          <View style={styles.detailsItemInner}>
            <Text color={'#525354'} fontType={'roboto'} style={{fontSize: 12}}>{t('cleanDetails.dish_washer')}</Text>
            <Text
              color={'#0B071B'}
              fontType={'roboto'}
              semibold
              style={{fontSize: 16}}>
              {formattedCleanData?.extras?.dish_washer}
            </Text>
          </View>
          <View style={styles.detailsItemInner}>
            <Text color={'#525354'} fontType={'roboto'} style={{fontSize: 12}}>{t('cleanDetails.microwave')}</Text>
            <Text
              color={'#0B071B'}
              fontType={'roboto'}
              semibold
              style={{fontSize: 16}}>
              {formattedCleanData?.extras?.microwave}
            </Text>
          </View>
        </View>
      </View>
      <View style={[styles.detailsItem]}>
        <View style={styles.detailsItemInner}>
          <Text color={'#525354'} fontType={'roboto'} style={{fontSize: 12}}>{t('cleanerDashboard.note')}</Text>
          <Text
            color={'#0B071B'}
            fontType={'roboto'}
            semibold
            style={{fontSize: 16}}>
            {formattedCleanData?.notes}
          </Text>
        </View>
      </View>
    </>
  );
};

export default CleanDeepDetails;

const styles = StyleSheet.create({
  mainContainer: {
    paddingTop: 20,
    paddingHorizontal: 18,
    paddingBottom: 100,
  },

  mapStyle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    // bottom: -25,
    bottom: 0,
  },

  detailsItem: {
    gap: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderColor,
  },
  detailsItemInner: {
    gap: 4,
    flex: 1,
    minWidth: 130,
  },
  detailsItemQuantity: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
});
