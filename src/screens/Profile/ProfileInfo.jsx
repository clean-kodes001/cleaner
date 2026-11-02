import React, {useCallback, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import ScreenContainer from '../../components/Shared/ScreenContainer';
import KeyboardAvoidingView from '../../components/Shared/KeyboardAvoidingView';
import {useDispatch, useSelector} from 'react-redux';
import Button from '../../components/Shared/Button';
import {useFocusEffect} from '@react-navigation/native';
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";
import Ionicons from "@react-native-vector-icons/ionicons";
import Text from '../../components/Shared/Text';
import BottomSelect from '../../components/Inputs/BottomSelect';
import Head from '../../components/Shared/Head';
import {colors} from '../../config/colors';
import {useTranslation} from 'react-i18next';

const ProfileInfo = ({navigation}) => {
  const {t} = useTranslation();
  const {unAuthenticated} = useSelector(state => state.data);
  const {user} = useSelector(state => state.user);
  const dispatch = useDispatch();

  useFocusEffect(useCallback(() => {}, []));

  const gotToEditProfile = (id, title) => {
    navigation.navigate('editprofileinfo', {title: title, itemID: id});
  };

  const [showbottomSheet, setShowbottomSheet] = useState(false);

  const handleContactSupport = () => {
    setShowbottomSheet(false);
    navigation.navigate('contactsupport');
  };

  return (
    <ScreenContainer style={{flex: 1, backgroundColor: '#FFF'}}>
      <View
        style={{
          paddingHorizontal: 32,
          borderBottomColor: '#e5e5e5',
          borderBottomWidth: 2,
        }}>
        <Head pageTitle={t('profile.profile_information')} type={2} navigation={navigation} />
      </View>

      <KeyboardAvoidingView style={styles.container}>
        {/* Contact Section */}
        <View>
          <Text
            fontType={'roboto'}
            bold
            style={{marginVertical: 8, fontSize: 20, color: '#000', fontWeight: 'bold'}}>{t('profile2.contact_header')}</Text>

          {/* Email */}
          <Pressable
            onPress={() => gotToEditProfile('email', 'Email')}
            style={styles.listItem}>
            <MaterialCommunityIcons name="email-outline" size={30} color="#000" />
            <View style={styles.detailsItemInner}>
              <Text
                color={'#0B071B'}
                fontType={'roboto'}
                semibold
                style={{fontSize: 16}}>{t('login.email_label')}</Text>
              <Text
                color={'#525354'}
                fontType={'roboto'}
                style={{fontSize: 12}}>
                {user?.email}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              color={'#444'}
              size={30}
            />
          </Pressable>

          {/* Phone */}
          <Pressable
            onPress={() => gotToEditProfile('phone', 'Phone')}
            style={styles.listItem}>
            <MaterialCommunityIcons name="phone" size={30} color="#000" />
            <View style={styles.detailsItemInner}>
              <Text
                color={'#0B071B'}
                fontType={'roboto'}
                semibold
                style={{fontSize: 16}}>{t('profile2.phone_header')}</Text>
              <Text
                color={'#525354'}
                fontType={'roboto'}
                style={{fontSize: 12}}>
                {user?.phone}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              color={'#444'}
              size={30}
            />
          </Pressable>

          {/* Address */}
          <Pressable
            onPress={() => gotToEditProfile('address', 'Address')}
            style={styles.listItem}>
            <MaterialCommunityIcons name="home-outline" size={30} color="#000" />
            <View style={styles.detailsItemInner}>
              <Text
                color={'#0B071B'}
                fontType={'roboto'}
                semibold
                style={{fontSize: 16}}>{t('profile.label_address')}</Text>
              <Text
                color={'#525354'}
                fontType={'roboto'}
                style={{fontSize: 12}}>
                {user?.address}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              color={'#444'}
              size={30}
            />
          </Pressable>

          {/* Distance */}
          <Pressable
            onPress={() => gotToEditProfile('distance', 'Distance')}
            style={styles.listItem}>
            <MaterialCommunityIcons name="map-marker-distance" size={30} color="#000" />
            <View style={styles.detailsItemInner}>
              <Text
                color={'#0B071B'}
                fontType={'roboto'}
                semibold
                style={{fontSize: 16}}>{t('profile2.distance_in_km')}</Text>
              <Text
                color={'#525354'}
                fontType={'roboto'}
                style={{fontSize: 12}}>
                {user?.distance} km
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              color={'#444'}
              size={30}
            />
          </Pressable>
        </View>

        {/* Personal Section */}
        <View>
          <Text
            fontType={'roboto'}
            bold
          style={{marginVertical: 8, fontSize: 20, color: '#000', fontWeight: 'bold'}}>{t('profile2.personal_header')}</Text>

          {/* Name */}
          <Pressable
            onPress={() => setShowbottomSheet('Name')}
            style={styles.listItem}>
            <Ionicons name="person-outline" size={30} color="#000" />
            <View style={styles.detailsItemInner}>
              <Text
                color={'#0B071B'}
                fontType={'roboto'}
                semibold
                style={{fontSize: 16}}>{t('contactSupport.name_label')}</Text>
              <Text
                color={'#525354'}
                fontType={'roboto'}
                style={{fontSize: 12}}>
                {user?.name}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              color={'#444'}
              size={30}
            />
          </Pressable>

          {/* Gender */}
          <Pressable
            onPress={() => setShowbottomSheet('Gender')}
            style={styles.listItem}>
            <MaterialCommunityIcons name="human-male-female" size={30} color="#000" />
            <View style={styles.detailsItemInner}>
              <Text
                color={'#0B071B'}
                fontType={'roboto'}
                semibold
                style={{fontSize: 16}}>{t('contactSupport.label_gender')}</Text>
              <Text
                color={'#525354'}
                fontType={'roboto'}
                style={{fontSize: 12}}>
                {
                  unAuthenticated?.gender?.find(
                    gender => gender.id === user?.gender_id,
                  )?.name
                }
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              color={'#444'}
              size={30}
            />
          </Pressable>

          {/* DOB */}
          <Pressable
            onPress={() => setShowbottomSheet('DOB')}
            style={styles.listItem}>
            <MaterialCommunityIcons name="calendar" size={30} color="#000" />
            <View style={styles.detailsItemInner}>
              <Text
                color={'#0B071B'}
                fontType={'roboto'}
                semibold
                style={{fontSize: 16}}>{t('contactSupport.dob_label')}</Text>
              <Text
                color={'#525354'}
                fontType={'roboto'}
                style={{fontSize: 12}}>
                {user?.dob}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              color={'#444'}
              size={30}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {showbottomSheet && (
        <BottomSelect
          snapPoints={[220]}
          handleShowbottomSheet={setShowbottomSheet}>
          <Text
            fontType={'roboto'}
            bold
            center
            style={{marginVertical: 8, fontSize: 20, color: '#000'}}>
            {`${showbottomSheet} can't be changed`}
          </Text>
          <Text
            center
            color={'#525354'}
            fontType={'roboto'}
            style={{fontSize: 16}}>{t('profile2.verify_identity_note')}</Text>
          <Button
            pressed={handleContactSupport}
            style={{
              borderRadius: 8,
              marginTop: 8,
              backgroundColor: colors.brandGreen,
            }}
            text={t('contactSupport.title')}
          />
        </BottomSelect>
      )}
    </ScreenContainer>
  );
};

export default ProfileInfo;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 32,
    marginTop: 8,
  },
  detailsItemInner: {
    gap: 2,
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginVertical: 8,
    gap: 20,
    borderBottomColor: '#999',
    borderBottomWidth: 1,
  },
});