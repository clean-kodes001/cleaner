import React from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import Icons from "@react-native-vector-icons/material-design-icons";
import Icons2 from "@react-native-vector-icons/material-icons";
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {showToast} from '../../utils/showToast';

function StepsTopbar({}) {
  const {user, onboardingStatus} = useSelector(state => state.user);
  const {completeProfileStage: active, pending, avatar} = useSelector(
    state => state.profile,
  );

  const {t} = useTranslation();
  const navigation = useNavigation();

  // A profile photo is mandatory before the biodata step. Mirror Step2's rule:
  // an existing real avatar satisfies it, unless the admin flagged the photo for
  // re-upload, in which case a freshly provided image (profile.avatar) is required.
  const requiredBioFields = Array.isArray(
    onboardingStatus?.onboarding_status?.required_bio_fields,
  )
    ? onboardingStatus.onboarding_status.required_bio_fields
    : [];
  const requiresNewAvatar = requiredBioFields.includes('avatar');
  const hasExistingPhoto = user?.has_real_avatar ?? !!user?.avatar;
  const photoSatisfied = (!requiresNewAvatar && hasExistingPhoto) || !!avatar;

  // Check if documents have been submitted (insurance_link exists)
  // This indicates step4 is complete and user should only proceed to step5
  const documentsSubmitted = user?.document?.insurance_link?.length > 5;
  
  // Check if training is completed
  const trainingCompleted = user?.document?.training_status === 1;
  
  // Check if user is in update flow (rejected and needs to re-submit)
  const needsUpdate = 
    onboardingStatus?.onboarding_status?.bio_data === 1 ||
    onboardingStatus?.onboarding_status?.bio_data === true ||
    onboardingStatus?.onboarding_status?.document_upload === 1 ||
    onboardingStatus?.onboarding_status?.document_upload === true;
  
  // Steps 1-4 should be disabled when:
  // - Documents are submitted AND
  // - Training is NOT yet complete AND
  // - User is NOT in update flow (rejected)
  const isStep1To4Disabled = documentsSubmitted && !trainingCompleted && !needsUpdate;

 

  return (
    <View
      style={{
        flexDirection: 'row',
        paddingVertical: 40,
        paddingHorizontal: 20,
      }}>
      <TouchableOpacity
        disabled={isStep1To4Disabled}
        onPress={() =>
          // user?.profile === false ? navigation.navigate('step1') : null
          navigation.navigate('step1')
        }
        style={[styles.iconContianer, isStep1To4Disabled && styles.nonactive]}>
        {/* <Icons2 color="#fff" size={24} name="lock" /> */}
        <Icons color="#fff" size={24} name="email-check-outline" />
      </TouchableOpacity>
      <View style={[styles.line, active >= 2 ? null : styles.nonactive]}></View>
      <TouchableOpacity
        disabled={isStep1To4Disabled}
        onPress={() =>
          // user?.profile === false ? navigation.navigate('step2') : null
          navigation.navigate('step2')
        }
        style={[styles.iconContianer, active >= 2 && !isStep1To4Disabled ? null : styles.nonactive]}>
        <Icons2 color="#fff" size={24} name="add-a-photo" />
      </TouchableOpacity>
      <View style={[styles.line, active >= 3 ? null : styles.nonactive]}></View>
      <TouchableOpacity
        disabled={isStep1To4Disabled}
        onPress={() => {
          if (!photoSatisfied) {
            showToast({type: 0, message: t('onboarding.photo_required')});
            navigation.navigate('step2');
            return;
          }
          navigation.navigate('step3');
        }}
        style={[
          styles.iconContianer,
          (active >= 3 ||
          user?.first_name ||
          user?.document?.insurance_link?.length > 5) && !isStep1To4Disabled
            ? null
            : styles.nonactive,
        ]}>
        <Icons color="#fff" size={24} name="account-details" />
      </TouchableOpacity>
      <View style={[styles.line, active >= 4 ? null : styles.nonactive]}></View>
      <TouchableOpacity
        disabled={!user?.first_name || isStep1To4Disabled}
        onPress={() => navigation.navigate('step4')}
        style={[
          styles.iconContianer,
          (active >= 4 || user?.document?.insurance_link?.length > 5) && !isStep1To4Disabled
            ? null
            : styles.nonactive,
        ]}>
        <Icons2 color="#fff" size={24} name="verified" />
      </TouchableOpacity>
      <View style={[styles.line, active >= 5 ? null : styles.nonactive]}></View>
      <TouchableOpacity
        disabled={!user?.profile && !documentsSubmitted}
        onPress={() => navigation.navigate('step5')}
        style={[
          styles.iconContianer,
          active >= 5 || user?.profile === true || documentsSubmitted
            ? null
            : styles.nonactive,
        ]}>
        <Icons2 color="#fff" size={24} name="ondemand-video" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  iconContianer: {
    backgroundColor: '#5143d9',
    justifyContent: 'center',
    alignItems: 'center',
    width: 45,
    height: 45,
    color: 'white',
    borderRadius: 50,
    marginBottom: -22,
  },
  line: {
    flex: 1,
    borderColor: '#5143d9',
    borderBottomWidth: 2,
  },
  nonactive: {
    opacity: 0.5,
  },
  itemgroup: {
    width: '100%',
  },
  row: {
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  signingroup: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
  },
});
export default StepsTopbar;
