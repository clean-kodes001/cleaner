import React, {useState, useEffect} from 'react';
import {Image, View, StyleSheet} from 'react-native';
import ScreenContainer from './ScreenContainer';
import Text from './Text';
import Button from './Button';
import {useDispatch, useSelector} from 'react-redux';
import {getOnboardingStatus} from '../../store/actions/profile/getOnboardingStatus';
import {getProfile} from '../../store/actions/profile/getProfile';
import {logOut} from '../../store/reducer/userSlice';
import {colors} from '../../config/colors';
import {useTranslation} from 'react-i18next';
import {resolveOnboardingRoute} from '../../utils/resolveOnboardingRoute';
import {showToast} from '../../utils/showToast';

const SuccessMessage = ({navigation, route}) => {
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const {onboardingStatus: currentOnboardingStatus} = useSelector(
    state => state.user,
  );
  const [loading, setLoading] = useState(false);

  // Fetch onboarding status once on mount
  useEffect(() => {
    dispatch(getOnboardingStatus());
  }, [dispatch]);

  // Auto-redirect to dashboard when fully approved
  useEffect(() => {
    if (currentOnboardingStatus) {
      const canAccessApp =
        currentOnboardingStatus.can_access_app === 1 ||
        currentOnboardingStatus.can_access_app === true;
      const isApproved =
        currentOnboardingStatus.onboarding_status?.status === 'approved';
      const noUpdatesNeeded =
        !currentOnboardingStatus.onboarding_status?.needs_update ||
        currentOnboardingStatus.onboarding_status?.needs_update === false ||
        currentOnboardingStatus.onboarding_status?.needs_update === 0;
      const noBioUpdate =
        !currentOnboardingStatus.onboarding_status?.bio_data ||
        currentOnboardingStatus.onboarding_status?.bio_data === false ||
        currentOnboardingStatus.onboarding_status?.bio_data === 0;
      const noDocumentUpdate =
        !currentOnboardingStatus.onboarding_status?.document_upload ||
        currentOnboardingStatus.onboarding_status?.document_upload === false ||
        currentOnboardingStatus.onboarding_status?.document_upload === 0;

      if (
        canAccessApp &&
        isApproved &&
        noUpdatesNeeded &&
        noBioUpdate &&
        noDocumentUpdate
      ) {
        // Fully approved - automatically redirect to dashboard
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{name: 'dashboard'}],
          });
        }, 100);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOnboardingStatus]);

  const handleOkPress = async () => {
    setLoading(true);

    const loadingTimeout = setTimeout(() => {
      console.warn('getOnboardingStatus timeout: Resetting loading state');
      setLoading(false);
    }, 15000); // 15 second timeout

    try {
      const onboardingStatus = await dispatch(getOnboardingStatus()).unwrap();
      clearTimeout(loadingTimeout);

      const nextRoute = resolveOnboardingRoute(onboardingStatus);
      if (!nextRoute) {
        throw new Error('Empty onboarding status payload');
      }

      if (nextRoute === 'dashboard') {
        setLoading(false);
        // Small delay to ensure Redux state has propagated and routes have re-rendered
        setTimeout(() => {
          navigation.reset({index: 0, routes: [{name: 'dashboard'}]});
        }, 100);
        return;
      }

      setLoading(false);
      navigation.navigate(nextRoute); // 'step2' | 'step3' | 'step4' | 'pendingReview'
    } catch (error) {
      clearTimeout(loadingTimeout);
      console.error('getOnboardingStatus error:', error);
      showToast({type: 0, message: t('onboarding.status_check_failed')});
      try {
        await dispatch(getProfile()).unwrap();
      } catch (profileError) {
        console.error('getProfile fallback also failed:', profileError);
      }
      setLoading(false);
    }
  };

  return (
    <ScreenContainer
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        // gap: 24,
      }}>
      <Image
        style={{width: 120, height: 120, marginBottom: 24}}
        source={require('../../assets/media/icons/icons8-easy-100.png')}
      />
      {/* Show rejection info if updates are needed */}
      {currentOnboardingStatus?.onboarding_status?.bio_data === 1 ||
      currentOnboardingStatus?.onboarding_status?.bio_data === true ||
      currentOnboardingStatus?.onboarding_status?.document_upload === 1 ||
      currentOnboardingStatus?.onboarding_status?.document_upload === true ? (
        <View style={styles.rejectionContainer}>
          <Text fontType={'roboto'} center bold style={styles.rejectionTitle}>
            {currentOnboardingStatus.onboarding_status?.message ||
              t('onboarding.application_needs_updates')}
          </Text>
          {currentOnboardingStatus.onboarding_status?.comment && (
            <Text fontType={'roboto'} center style={styles.rejectionComment}>
              {currentOnboardingStatus.onboarding_status.comment}
            </Text>
          )}
          {(currentOnboardingStatus.onboarding_status?.rejected_by ||
            currentOnboardingStatus.onboarding_status?.rejected_at) && (
            <Text fontType={'roboto'} center style={styles.rejectionMeta}>
              {currentOnboardingStatus.onboarding_status.rejected_by &&
                t('onboarding.rejected_by', {
                  name: currentOnboardingStatus.onboarding_status.rejected_by,
                })}
              {currentOnboardingStatus.onboarding_status.rejected_at &&
                ` ${t('onboarding.rejected_on', {
                  date: new Date(
                    currentOnboardingStatus.onboarding_status.rejected_at,
                  ).toLocaleDateString(),
                })}`}
            </Text>
          )}
        </View>
      ) : (
        <Text
          fontType={'roboto'}
          center
          style={{fontSize: 20, width: '90%', marginBottom: 8, lineHeight: 30}}>
          {t('onboarding.account_under_review')}
        </Text>
      )}

      <Button
        text={t('common.ok')}
        pressed={handleOkPress}
        loading={loading}
        disabled={loading}
        height={52}
        style={{width: '100%', marginVertical: 16}}
      />
      <Button
        text={t('common.logout')}
        outline
        pressed={() => dispatch(logOut())}
        height={52}
        style={{width: '100%', marginBottom: 16}}
      />
    </ScreenContainer>
  );
};

export default SuccessMessage;

const styles = StyleSheet.create({
  rejectionContainer: {
    width: '90%',
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  rejectionTitle: {
    fontSize: 20,
    color: colors.orangeDark,
    marginBottom: 8,
  },
  rejectionComment: {
    fontSize: 16,
    color: '#856404',
    marginBottom: 8,
    lineHeight: 22,
  },
  rejectionMeta: {
    fontSize: 12,
    color: '#856404',
    fontStyle: 'italic',
  },
});
