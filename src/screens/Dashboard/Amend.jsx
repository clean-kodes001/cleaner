import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {StyleSheet, View, Dimensions, Keyboard, Pressable} from 'react-native';
import ScreenContainer from '../../components/Shared/ScreenContainer';
import Text from '../../components/Shared/Text';
import {useDispatch, useSelector} from 'react-redux';
import BottomSheet, {BottomSheetScrollView, BottomSheetTextInput} from '@gorhom/bottom-sheet';
import Pusher from 'pusher-js/react-native';
import Echo from 'laravel-echo';
import pusherConfig from '../../../pusher.json';
import MapView, {Marker} from 'react-native-maps';
import {useFormik} from 'formik';
import {doubleSelectStyle, flexBetween} from '../../config/styles';
import NumberSelect from '../../components/Inputs/NumberSelect';
import IconButton from '../../components/Buttons/IconButton';
import FuntionButton from '../../components/Buttons/FuntionButton';
import {amendClean} from '../../store/actions/dashboard/amendClean';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import Modal1 from '../../components/Modals/Modal1';
import {amend} from '../../store/actions/dashboard/amend';
import TextInputField from '../../components/Inputs/TextInputField';
import {formHandler} from '../../utils/formhandler';
import {
  logOut,
  resetCleanRequest,
  setMyActiveClean,
  setMyCleanRequest,
} from '../../store/reducer/userSlice';
import {useTranslation} from 'react-i18next';
const {width, height} = Dimensions.get('window');

const Amend = ({route}) => {
  const {t} = useTranslation();
  const {data, id, status} = route.params;
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const {authenticated: authenticatedData} = useSelector(state => state.data);

  const {user, clean} = useSelector(state => state.user);
  const userCleanRequest = useSelector(state => state.user.cleanRequest);

  const [step, setStep] = useState(1);

  const bottomSheetRef = useRef();

  const mapStyle = [];

  const form = useFormik({
    initialValues: {
      bedrooms_min: 1,
      ammendment_comment: '',

      bedrooms:
        data?.clean_amend?.status === 1
          ? data?.clean_amend?.bedrooms
          : data?.bedrooms,
      washrooms:
        data?.clean_amend?.status === 1
          ? data?.clean_amend?.washrooms
          : data?.washrooms,
      kitchens:
        data?.clean_amend?.status === 1
          ? data?.clean_amend?.kitchens
          : data?.kitchens,
      otherrooms:
        data?.clean_amend?.status === 1
          ? data?.clean_amend?.otherrooms
          : data?.otherrooms,

      livingrooms:
        data?.clean_amend?.status === 1
          ? data?.clean_amend?.livingrooms
          : data?.livingrooms,
      dinningrooms:
        data?.clean_amend?.status === 1
          ? data?.clean_amend?.dinningrooms
          : data?.dinningrooms,
      laundryrooms:
        data?.clean_amend?.status === 1
          ? data?.clean_amend?.laundryrooms
          : data?.laundryrooms,
      officerooms:
        data?.clean_amend?.status === 1
          ? data?.clean_amend?.officerooms
          : data?.officerooms,

      refridgerator:
        data?.clean_amend?.status === 1
          ? data?.clean_amend?.extras?.refridgerator
          : data?.extras?.refridgerator,
      stove:
        data?.clean_amend?.status === 1
          ? data?.clean_amend?.extras?.stove
          : data?.extras?.stove,
      stove_min: data?.clean_type_id === 2 || data?.clean_type_id === 3 ? 1 : 0,
      dish_washer:
        data?.clean_amend?.status === 1
          ? data?.clean_amend?.extras?.dish_washer
          : data?.extras?.dish_washer,
      dish_washer_min: data?.clean_type_id === 2 ? 1 : 0,
      microwave:
        data?.clean_amend?.status === 1
          ? data?.clean_amend?.extras?.microwave
          : data?.extras?.microwave,
      microwave_min:
        data?.clean_type_id === 2 || data?.clean_type_id === 3 ? 1 : 0,
    },
    onSubmit: values => {
      const payload = {
        location: data?.location,
        position: data?.position,
        clean_type_id: data?.clean_type_id,
        cleaners: data?.cleaners,

        bedrooms: values?.bedrooms,
        washrooms: values?.washrooms,
        kitchens: values?.kitchens,
        otherrooms: values?.otherrooms,

        livingrooms: values?.livingrooms,
        dinningrooms: values?.dinningrooms,
        laundryrooms: values?.laundryrooms,
        officerooms: values?.officerooms,

        extras: {
          refridgerator: values?.refridgerator,
          stove: values?.stove,
          dish_washer: values?.dish_washer,
          microwave: values?.microwave,
        },
        ammendment_comment: values?.ammendment_comment,
      };

      dispatch(amend({data: payload, navigation}));
    },
  });

  const handleNext = () => {
    setStep(prev => ++prev);
  };
  const handleGoBack = () => {
    setStep(prev => --prev);
  };

  useEffect(() => {
    // bottomSheetRef?.current?.snapToIndex(1);
  }, []);

  const handleSheetChanges = useCallback(index => {}, []);

  const [showModal, setShowModal] = useState(false);

  const [token, setToken] = useState(null);
  // Pusher.logToConsole = true;
  let PusherClient = useMemo(() => {
    if (!token) {
      return null;
    }

    return new Pusher(pusherConfig.key, {
      ...pusherConfig,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      },
      userAuthentication: {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      },
    });
  }, [token]);

  let echo = useMemo(() => {
    if (!PusherClient) {
      return null;
    }

    return new Echo({
      broadcaster: 'pusher',
      client: PusherClient,
    });
  }, [PusherClient]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const token = await AsyncStorage.getItem('accessToken');
          setToken(token);
          if (!token) {
            dispatch(logOut());
          }
        } catch (error) {
          console.warn('getToken error:', error);
        }
      })();
    }, [dispatch]),
  );

  useEffect(() => {
    if (!echo || !user?.id) {
      return;
    }

    echo
      .private(`clean.${user.id}`)
      .listen('Clean', e => {
        if (e?.user && e?.user?.name !== user?.name) {
          // dispatch(setRequestOppParty(e.user));
        }

        // if (!userCleanRequest && e?.clean?.clean && user?.online) {

        if (e?.clean?.clean?.clean_amend) {
          dispatch(setMyActiveClean(e?.clean));
        }

        if (e?.clean === null) {
          dispatch(resetCleanRequest());
        } else if (!userCleanRequest && e?.clean?.clean) {
          dispatch(
            setMyCleanRequest({
              ...e.clean.clean,
              timeOfMatch: e.clean.created_at,
            }),
          );
        } else {
          // dispatch(getClean());
        }
      })
      .error(e => {});
    return () => {
      if (echo) {
        echo.leaveAllChannels();
      }
    };
  }, [dispatch, echo, user, userCleanRequest]);

  return (
    <ScreenContainer style={{flex: 1, width, height}}>
      <GestureHandlerRootView style={{flex: 1, zIndex: 10}}>
        {/* <Pressable
          onPress={() => {
            Keyboard.dismiss();
          }}
          style={{
            flex: 1,
            position: 'relative',
            // height: 90,
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '100%',
          }}>
          {data?.position?.lat && data?.position?.lng && (
            <MapView
              zoomControlEnabled={true}
              zoomEnabled={true}
              style={styles.mapStyle}
              region={{
                latitude: data?.position?.lat,
                longitude: data?.position?.lng,
                latitudeDelta: 0.0043,
                longitudeDelta: 0.0034,
              }}
              customMapStyle={mapStyle}>
              <Marker
                coordinate={{
                  latitude: data?.position?.lat,
                  longitude: data?.position?.lng,
                }}
                title={t('home.my_location')}
                description={t('home.marker_description')}
              />
            </MapView>
          )}
        </Pressable> */}

        <BottomSheet
          enableDynamicSizing={false}
          ref={bottomSheetRef}
          index={0}
          style={{backgroundColor: 'transparent'}}
          snapPoints={['100%']}
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
          android_keyboardInputMode="adjustResize"
          onChange={handleSheetChanges}>
          <BottomSheetScrollView contentContainerStyle={styles.mainContainer}>
            <Pressable onPress={() => Keyboard.dismiss()}>
              <Text style={{fontSize: 20}} semibold center fontType={'roboto'}>
                {t('cleanDetails.amend_cleaning_title')}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => Keyboard.dismiss()}
              style={{
                paddingHorizontal: 18,
                marginTop: 12,
              }}>
              {/* <TouchableOpacity
                    onPress={() => {
                      // bottomSheetRef.current.snapToPosition(1);
                      bottomSheetRef.current.snapToIndex(1);
                      // bottomSheetRef.current
                      // bottomSheetRef.current.close();
                    }}> */}

              <View style={[doubleSelectStyle, {marginTop: 12}]}>
                <NumberSelect
                  form={form}
                  item={{
                    name: t('cleanDetails.bedrooms'),
                    id: 'bedrooms',
                  }}
                />
                <NumberSelect
                  form={form}
                  item={{
                    name: t('cleanDetails.washrooms'),
                    id: 'washrooms',
                  }}
                />
              </View>
              <View style={[doubleSelectStyle, {marginTop: 12}]}>
                <NumberSelect
                  form={form}
                  item={{
                    name: t('cleanDetails.kitchens'),
                    id: 'kitchens',
                  }}
                />
                <NumberSelect
                  moreInfo
                  onClickMoreInfo={() => setShowModal(true)}
                  form={form}
                  item={{
                    name: t('cleanDetails.other_rooms'),
                    id: 'otherrooms',
                  }}
                />
              </View>
              <View style={[doubleSelectStyle, {marginTop: 12}]}>
                <NumberSelect
                  form={form}
                  item={{
                    name: t('cleanDetails.living_family_rooms'),
                    id: 'livingrooms',
                  }}
                />
                <NumberSelect
                  form={form}
                  item={{
                    name: t('cleanDetails.dinning_rooms'),
                    id: 'dinningrooms',
                  }}
                />
              </View>
              <View style={[doubleSelectStyle, {marginTop: 12}]}>
                <NumberSelect
                  form={form}
                  item={{
                    name: t('cleanDetails.laundry_rooms'),
                    id: 'laundryrooms',
                  }}
                />
                <NumberSelect
                  form={form}
                  item={{
                    name: t('cleanDetails.office_den_rooms'),
                    id: 'officerooms',
                  }}
                />
              </View>

              <Text medium style={{fontSize: 14, marginTop: 30}}>
                {t('cleanDetails.extras_optional')}
              </Text>
              <View style={[doubleSelectStyle, {marginTop: 12}]}>
                <NumberSelect
                  form={form}
                  item={{
                    name: t('cleanDetails.refrigerators'),
                    id: 'refridgerator',
                  }}
                />
                <NumberSelect
                  form={form}
                  item={{
                    name: t('cleanDetails.stoves'),
                    id: 'stove',
                  }}
                />
              </View>
              <View style={[doubleSelectStyle, {marginTop: 12}]}>
                <NumberSelect
                  form={form}
                  item={{
                    name: t('cleanDetails.dish_washer'),
                    id: 'dish_washer',
                  }}
                />
                <NumberSelect
                  form={form}
                  item={{
                    name: t('cleanDetails.microwave'),
                    id: 'microwave',
                  }}
                />
              </View>
              <View style={{marginTop: 12, width: '100%'}}>
                <Text fontType={'Roboto'} medium style={{fontSize: 12, marginBottom: 3}}>
                  {t('cleanDetails.comment_optional')}
                </Text>
                <View
                  style={{
                    paddingRight: 14,
                    paddingLeft: 14,
                    width: '100%',
                    borderRadius: 8,
                    borderWidth: 0.8,
                    borderColor: '#211c5b',
                    height: 52,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                  <BottomSheetTextInput
                    style={{
                      flex: 1,
                      color: '#323232',
                      marginEnd: 14,
                      fontSize: 14,
                      fontFamily: 'Roboto-Regular',
                    }}
                    value={form.values.ammendment_comment}
                    onChangeText={form.handleChange('ammendment_comment')}
                    placeholderTextColor="#ABAFB1"
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxFontSizeMultiplier={0}
                  />
                </View>
                {form.errors.ammendment_comment && (
                  <Text
                    notCapitalized
                    fontType={'roboto'}
                    style={{marginTop: 2, marginLeft: 4, fontSize: 12, color: 'red'}}>
                    {form.errors.ammendment_comment}
                  </Text>
                )}
              </View>

              <View
                style={[
                  flexBetween,
                  {
                    flexDirection: 'row',
                  },
                ]}>
                <FuntionButton
                  onPress={() => navigation.goBack()}
                  name={t('common.back')}
                />
                <FuntionButton onPress={form.handleSubmit} name={t('common.submit')} />
              </View>
            </Pressable>
          </BottomSheetScrollView>
        </BottomSheet>
        {showModal && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'transparent',
            }}>
            <Modal1
              style={{
                position: 'relative',
                bottom: 0,
                left: 0,
                right: 0,
                top: 0,
                paddingVertical: 10,
                justifyContent: 'space-evenly',
                height: 300,
                alignItems: 'center',
              }}
              setShowModal={setShowModal}>
              <View
                style={{
                  alignItems: 'center',
                  gap: 20,
                  width: '75%',
                }}>
                <Text style={{fontSize: 20, color: '#252525'}} center>
                  {t('cleanDetails.other_rooms_info')}
                </Text>
              </View>
            </Modal1>
          </View>
        )}
      </GestureHandlerRootView>
    </ScreenContainer>
  );
};

export default Amend;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  mainContainer: {
    paddingTop: 20,
    paddingBottom: 350,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  selectList: {
    gap: 20,
    alignItems: 'center',
    display: 'flex',
    paddingHorizontal: 18,
  },
  mapStyle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    // bottom: -25,
    bottom: 0,
  },
});
