import React, {useCallback, useState} from 'react';
import ScreenContainer from '../../components/Shared/ScreenContainer';
import {
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  View,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import Text from '../../components/Shared/Text';
import AntDesign from '@react-native-vector-icons/ant-design';
import Head from '../../components/Shared/Head';
import Button from '../../components/Shared/Button';
import Icon from '@react-native-vector-icons/material-icons';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import Ionicons from '@react-native-vector-icons/ionicons';
import FontAwesome from '@react-native-vector-icons/fontawesome';
import {logOut} from '../../store/reducer/userSlice';
import {uploadUserProfile} from '../../store/actions/profile/uploadUserProfile';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import ImageView from 'react-native-image-viewing';
import {useTranslation} from 'react-i18next';
import {changeLanguage} from '../../i18n/i18n';
import {colors} from '../../config/colors';
import BottomSelect from '../../components/Inputs/BottomSelect';
import Modal1 from '../../components/Modals/Modal1';
import {useFocusEffect} from '@react-navigation/native';
import {getProfile} from '../../store/actions/profile/getProfile';
import {changeStatus} from '../../store/actions/dashboard/changeStatus';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Client} from '../../config/client';
import {LOGOUT, ONLINE} from '../../config/apis';
const Canada = require('../../assets/media/images/canada.png');
const Nigeria = require('../../assets/media/images/naija.png');

const ProfileScreen = ({navigation}) => {
  const {t, i18n} = useTranslation();
  const {user, profilePending} = useSelector(state => state.user);
  const [showLanguageSheet, setShowLanguageSheet] = useState(false);
  const dispatch = useDispatch();
  const [logOutPending, setLogOutPending] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);

  const languages = [
    {id: 'en', name: 'English'},
    {id: 'fr', name: 'Français'},
  ];

  const handleLogout = async () => {
    try {
      setLogOutPending(true);
      await Client({
        method: 'POST',
        path: ONLINE,
        data: {
          online: 0,
        },
      });
      setLogOutPending(false);
      await Client({
        method: 'GET',
        path: LOGOUT,
      });
      await AsyncStorage.removeItem('accessToken');

      dispatch(logOut());
    } catch (error) {
      console.warn('getProfile error:', error);
    }
  };

  // Request camera permission for Android
  const requestCameraPermission = async () => {
    if (Platform.OS !== 'android') {
      return true; // iOS handles permissions automatically
    }

    try {
      const {PermissionsAndroid} = require('react-native');
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

  // Process successful image result and upload
  const processAndUploadImage = async imageResult => {
    if (imageResult?.assets && imageResult.assets.length > 0) {
      const assetUri = imageResult.assets[0].uri;
      const uri = assetUri;
      const filename = assetUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const ext = match?.[1] || 'jpg';
      const imageType = match ? `image/${match[1]}` : 'image/jpeg';
      const avatar = {uri, name: `image.${ext}`, type: imageType};
      
      const formData = new FormData();
      formData.append('avatar', avatar);
      formData.append('first_name', user.first_name);
      formData.append('last_name', user.last_name);
      formData.append('phone', user?.phone);
      formData.append('dob', user?.dob);
      formData.append('email', user?.email);
      formData.append(
        'postal_code',
        user?.postal_code ? user?.postal_code.replace(/\s+/g, '') : '',
      );
      formData.append('gender_id', user.gender_id || 0);
      formData.append('address', user?.address);
      formData.append('distance', user?.distance || '');
      formData.append('country_id', user?.country_id);
      formData.append('state_id', user?.state_id);
      formData.append('city_id', user?.city_id);

      try {
        // Upload the profile - getProfile() is now called automatically in the action
        await dispatch(uploadUserProfile({data: formData})).unwrap();
      } catch (error) {
        console.log('Profile upload error:', error);
      }
    }
  };

  // Launch gallery as fallback
  const handleLaunchGallery = async () => {
    try {
      const libraryResult = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });
      
      if (libraryResult?.didCancel) return;
      
      if (libraryResult?.errorCode) {
        Alert.alert(t('common.error'), libraryResult.errorMessage || 'Unable to open photo library.');
        return;
      }

      await processAndUploadImage(libraryResult);
    } catch (error) {
      console.log('Gallery error:', error);
      Alert.alert(t('common.error'), 'Unable to access photo library.');
    }
  };

  const handleUploadImage = async type => {
    try {
      if (type === 'camera') {
        // Request permission for Android
        if (Platform.OS === 'android') {
          const hasPermission = await requestCameraPermission();
          if (!hasPermission) {
            Alert.alert(
              t('common.camera_permission_required_title'),
              t('common.camera_permission_required_message'),
              [
                {text: t('common.cancel'), style: 'cancel'},
                {text: t('common.choose_from_gallery'), onPress: handleLaunchGallery},
              ],
            );
            return;
          }
        }

        const options = {
          mediaType: 'photo',
          quality: 0.8,
          cameraType: 'front', // Front camera for selfie
          saveToPhotos: false,
          presentationStyle: 'fullScreen',
        };
        
        const cameraResult = await launchCamera(options);
        
        // Check for errors
        if (cameraResult?.errorCode) {
          const errorCode = cameraResult.errorCode;
          const errorMessage = cameraResult.errorMessage || 'Camera is not available';
          
          console.log('Camera error:', errorCode, errorMessage);
          
          // Offer gallery fallback
          Alert.alert(
            t('common.camera_unavailable_title'),
            errorMessage + '. ' + t('common.camera_unavailable_choose_gallery'),
            [
              {text: t('common.cancel'), style: 'cancel'},
              {text: t('common.choose_from_gallery'), onPress: handleLaunchGallery},
            ],
          );
          return;
        }
        
        if (cameraResult?.didCancel) return;
        
        await processAndUploadImage(cameraResult);
        
      } else if (type === 'library') {
        await handleLaunchGallery();
      }
    } catch (error) {
      console.log('Image upload error:', error);
      // Offer gallery fallback on any error
      Alert.alert(
        t('common.camera_error_title'),
        t('common.camera_unavailable_choose_gallery'),
        [
          {text: t('common.cancel'), style: 'cancel'},
          {text: t('common.choose_from_gallery'), onPress: handleLaunchGallery},
        ],
      );
    }
  };


  const handleRenderLanguages = (item, index) => {
    const isActive = i18n.language === item.id;
    return (
      <TouchableOpacity
        key={index}
        onPress={() => {
          changeLanguage(item.id);
          setShowLanguageSheet(false);
        }}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderRadius: 4,
          width: '100%',
          backgroundColor: isActive ? colors.primary : '#fff',
          paddingVertical: 16,
          paddingHorizontal: 20,
        }}>
        <View style={{flexDirection: 'row', gap: 12, alignItems: 'center'}}>
          <FontAwesome
            name={isActive ? 'dot-circle-o' : 'circle-o'}
            size={20}
            color={isActive ? '#fff' : colors.primary}
          />
          <Text
            fontType={'roboto'}
            style={{fontSize: 16, color: isActive ? '#fff' : colors.primary}}>
            {item.name}
          </Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          color={isActive ? '#fff' : colors.primary}
          size={26}
        />
      </TouchableOpacity>
    );
  };

  const showCamera = () => {
    handleUploadImage('camera');
    setShowModal(false);
  };
  const showLibrary = () => {
    handleUploadImage('library');
    setShowModal(false);
  };

  useFocusEffect(
    useCallback(() => {
      dispatch(getProfile());
    }, []),
  );

  return (
    <ScreenContainer style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.top}>
          <Head pageTitle={t('profile.title')} type={2} navigation={navigation} />
          <TouchableOpacity
            onPress={() => setShowImageViewer(true)}
            style={styles.imageContainer}>
            <Image style={styles.image} source={{uri: user?.avatar}} />
          </TouchableOpacity>
          <Text
            capitalized
            fontType={'roboto'}
            semibold
            style={{
              fontSize: 20,
              color: '#333333',
              marginTop: 2,
            }}>
            {user?.name}
          </Text>
          <Text
            fontType={'roboto'}
            semibold
            style={{fontSize: 14, color: '#ABAFB1'}}>
            {user?.email}
          </Text>
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'row',
              gap: 4,
            }}>
            <View
              style={{
                flexDirection: 'row',
                gap: 2,

                alignItems: 'center',
              }}>
              {[1, 2, 3, 4, 5].map(index => (
                <View key={index}>
                  <FontAwesome
                    style={{color: '#F8C22E'}}
                    name={index <= Number(user?.rating) ? 'star' : 'star-o'}
                    // name={true ? 'star' : 'star-o'}
                    size={18}
                  />
                </View>
              ))}
            </View>
            <Text fontType={'roboto'} bold style={{fontSize: 20}}>
              {user?.rating}
            </Text>
          </View>
          <Button
            disabled={profilePending}
            pressed={() => navigation.navigate('profileinfo')}
            height={42}
            style={{width: 155, borderRadius: 8, marginTop: 12}}
            text={t('common.edit_profile')}
            textStyle={{fontSize: 15}}
          />
          <View
            style={{
              height: 64,
              backgroundColor: '#f3f5f7',
              borderRadius: 8,
              paddingVertical: 12,
              paddingHorizontal: 16,
              marginTop: 12,
              // width: '100%',
              display: 'flex',
              flexDirection: 'row',
              gap: 16,
              justifyContent: 'space-between',
            }}>
            <TouchableOpacity
              disabled={profilePending}
              onPress={() => setShowModal(true)}
              style={{
                borderRadius: 8,

                width: 150,
                height: '100%',
                backgroundColor: '#dcd9f7',
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'row',
              }}>
              <Text
                fontType={'roboto'}
                semibold
                style={{fontSize: 14, color: '#5143d9'}}>
                {t('profile.change_picture')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={logOutPending || profilePending}
              onPress={handleLogout}
              style={{
                backgroundColor: '#AC2D26',
                borderRadius: 8,
                flex: 1,
                width: 150,
                height: '100%',
                display: 'flex',
                gap: 4,
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'row',
              }}>
              {logOutPending ? (
                <ActivityIndicator
                  color={'#FFF'}
                  style={{marginRight: 6}}
                  size="small"
                />
              ) : (
                <Icon name="logout" size={18} color={'#FFF'} />
              )}
              <Text
                fontType={'roboto'}
                semibold
                style={{fontSize: 14, color: '#FFF'}}>
                {t('common.logout')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.btm}>
          <View style={styles.inner}>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                backgroundColor: '#fff',
                paddingVertical: 16,
                paddingHorizontal: 20,
                borderRadius: 12,
              }}>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 12,
                  alignItems: 'center',
                }}>
                <MaterialCommunityIcons
                  name="globe-model"
                  color={colors.primary}
                  size={30}
                />
                <Text
                  fontType={'roboto'}
                  style={{
                    fontSize: 16,
                    //  color: '#161d29'
                  }}>
                  {t('profile.country')}
                </Text>
              </View>
              <View
                style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                {user.site_country_id === 2 ? (
                  <Image
                    source={require('../../assets/media/images/naija.png')}
                    style={{width: 40, height: 20}}
                  />
                ) : user.site_country_id === 1 ? (
                  <Image
                    source={require('../../assets/media/images/canada.png')}
                    style={{width: 40, height: 20}}
                  />
                ) : null}
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setShowLanguageSheet(true)}
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                backgroundColor: '#fff',
                paddingVertical: 16,
                paddingHorizontal: 20,
                borderRadius: 12,
                marginTop: 12,
              }}>
              <View
                style={{display: 'flex', flexDirection: 'row', gap: 12, alignItems: 'center'}}>
                <MaterialCommunityIcons
                  name="translate"
                  color={colors.primary}
                  size={28}
                />
                <Text fontType={'roboto'} style={{fontSize: 16}}>
                  {t('profile.language')}
                </Text>
              </View>
              <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                <Text fontType={'roboto'} style={{fontSize: 14, color: '#888'}}>
                  {i18n.language === 'fr' ? 'Français' : 'English'}
                </Text>
                <MaterialCommunityIcons name="chevron-right" color={'#444'} size={26} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('documentupload')}
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                backgroundColor: '#fff',
                paddingVertical: 16,
                paddingHorizontal: 20,
                borderRadius: 12,
                marginTop: 12,
              }}>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 12,
                  alignItems: 'center',
                }}>
                <Ionicons name="documents" color={colors.primary} size={24} />
                <Text
                  fontType={'roboto'}
                  style={{
                    fontSize: 16,
                    //  color: '#161d29'
                  }}>
                  {t('profile.upload_documents')}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                color={'#444'}
                size={26}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('myaccount')}
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                backgroundColor: '#fff',
                paddingVertical: 16,
                paddingHorizontal: 20,
                borderRadius: 12,
                marginTop: 12,
              }}>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 12,
                  alignItems: 'center',
                }}>
                <AntDesign
                  name="credit-card"
                  color={colors.primary}
                  size={24}
                />
                <Text
                  fontType={'roboto'}
                  style={{
                    fontSize: 16,
                    //  color: '#161d29'
                  }}>
                  {t('profile.my_account')}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                color={'#444'}
                size={26}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('contactus')}
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                backgroundColor: '#fff',
                paddingVertical: 16,
                paddingHorizontal: 20,
                borderRadius: 12,
                marginTop: 12,
              }}>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 12,
                  alignItems: 'center',
                }}>
                <AntDesign name="mail" color={colors.primary} size={24} />
                <Text
                  fontType={'roboto'}
                  style={{
                    fontSize: 16,
                    //  color: '#161d29'
                  }}>
                  {t('profile.contact_us')}
                </Text>
              </View>

              <MaterialCommunityIcons
                name="chevron-right"
                color={'#444'}
                size={26}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('invitefriends')}
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                backgroundColor: '#fff',
                paddingVertical: 16,
                paddingHorizontal: 20,
                borderRadius: 12,
                marginTop: 12,
              }}>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 12,
                  alignItems: 'center',
                }}>
                <AntDesign name="team" color={colors.primary} size={24} />
                <Text
                  fontType={'roboto'}
                  style={{
                    fontSize: 16,
                    //  color: '#161d29'
                  }}>
                  {t('profile.invite_friends')}
                </Text>
              </View>

              <MaterialCommunityIcons
                name="chevron-right"
                color={'#444'}
                size={26}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (Platform.OS === 'web') {
                  // eslint-disable-next-line no-alert
                  if (
                    window.confirm(t('profile.delete_account_confirm'))
                  ) {
                    window.location.href = 'https://swipeklin.com/data-safety';
                  }
                } else {
                  Alert.alert(
                    t('profile.delete_account_title'),
                    t('profile.delete_account_confirm'),
                    [
                      {
                        text: t('common.cancel'),
                        style: 'cancel',
                      },
                      {
                        text: t('profile.delete_account_proceed'),
                        onPress: () => {
                          Linking.openURL('https://swipeklin.com/data-safety');
                        },
                      },
                    ],
                  );
                }
              }}
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                backgroundColor: '#fff',
                paddingVertical: 16,
                paddingHorizontal: 20,
                borderRadius: 12,
                marginTop: 12,
              }}>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 12,
                  alignItems: 'center',
                }}>
                <AntDesign name="delete" color="red" size={24} />
                <Text
                  fontType={'roboto'}
                  style={{
                    fontSize: 16,
                    color: 'red',
                  }}>
                  {t('profile.delete_account')}
                </Text>
              </View>

              <MaterialCommunityIcons
                name="chevron-right"
                color={'#444'}
                size={26}
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <ImageView
        images={[{uri: user?.avatar || ''}]}
        imageIndex={0}
        visible={showImageViewer}
        onRequestClose={() => setShowImageViewer(false)}
        FooterComponent={() => (
          <View style={{paddingBottom: 48, paddingHorizontal: 24, alignItems: 'center'}}>
            <TouchableOpacity
              onPress={() => {
                setShowImageViewer(false);
                setShowModal(true);
              }}
              style={{
                backgroundColor: 'rgba(0,0,0,0.6)',
                paddingVertical: 14,
                paddingHorizontal: 32,
                borderRadius: 30,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.4)',
              }}>
              <Text fontType={'roboto'} style={{color: '#fff', fontSize: 16}}>
                {t('profile.change_picture')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
      {showModal && (
        <Modal1 setShowModal={setShowModal}>
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
        </Modal1>
      )}
      {showLanguageSheet && (
        <BottomSelect snapPoints={[250]} handleShowbottomSheet={setShowLanguageSheet}>
          {languages.map(handleRenderLanguages)}
        </BottomSelect>
      )}
    </ScreenContainer>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  top: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    flex: 1,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
  },
  imageContainer: {
    marginTop: 8,
    width: 100,
    height: 100,
    borderRadius: 50,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#b9b3ef',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  btm: {
    flex: 1,
    backgroundColor: '#f3f5f7',
    paddingVertical: 20,
    paddingHorizontal: 32,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 60,
  },
  inner: {
    flex: 1,
    borderRadius: 8,
    // padding: 16,
    // backgroundColor: '#fff',
  },
});
