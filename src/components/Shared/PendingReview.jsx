import React, {useCallback, useEffect, useState} from 'react';
import {AppState, Image} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import ScreenContainer from './ScreenContainer';
import Text from './Text';
import Button from './Button';
import {getOnboardingStatus} from '../../store/actions/profile/getOnboardingStatus';
import {logOut} from '../../store/reducer/userSlice';
import {resolveOnboardingRoute} from '../../utils/resolveOnboardingRoute';
import {showToast} from '../../utils/showToast';

const PendingReview = ({navigation}) => {
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const {onboardingStatus} = useSelector(state => state.user);
  const [refreshing, setRefreshing] = useState(false);

  const checkStatus = useCallback(
    async ({silent} = {}) => {
      setRefreshing(true);
      try {
        const status = await dispatch(getOnboardingStatus()).unwrap();
        const nextRoute = resolveOnboardingRoute(status);
        if (!nextRoute) {
          throw new Error('Empty onboarding status payload');
        }

        if (nextRoute === 'dashboard') {
          setRefreshing(false);
          setTimeout(() => {
            navigation.reset({index: 0, routes: [{name: 'dashboard'}]});
          }, 100);
          return;
        }

        setRefreshing(false);

        if (nextRoute === 'pendingReview') {
          if (!silent) {
            showToast({type: 1, message: t('onboarding.still_under_review')});
          }
          return;
        }

        navigation.navigate(nextRoute); // 'step2' | 'step3' | 'step4'
      } catch (error) {
        console.error('getOnboardingStatus error:', error);
        setRefreshing(false);
        if (!silent) {
          showToast({type: 0, message: t('onboarding.status_check_failed')});
        }
      }
    },
    [dispatch, navigation, t],
  );

  // Refetch whenever this screen regains navigation focus.
  useFocusEffect(
    useCallback(() => {
      checkStatus({silent: true});
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  // Refetch when the app is foregrounded while this screen is already focused
  // (navigation focus alone doesn't fire on background -> active transitions).
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        checkStatus({silent: true});
      }
    });
    return () => subscription.remove();
  }, [checkStatus]);

  const status = onboardingStatus?.onboarding_status?.status;
  const bodyKey =
    status === 'pending_approval'
      ? 'onboarding.pending_approval_body'
      : 'onboarding.pending_review_body';

  return (
    <ScreenContainer
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
      }}>
      <Image
        style={{width: 120, height: 120, marginBottom: 24}}
        source={require('../../assets/media/icons/icons8-easy-100.png')}
      />
      <Text
        fontType={'roboto'}
        center
        bold
        style={{fontSize: 20, width: '90%', marginBottom: 8}}>
        {t('onboarding.pending_review_title')}
      </Text>
      <Text
        fontType={'roboto'}
        center
        style={{fontSize: 16, width: '90%', marginBottom: 24, lineHeight: 24}}>
        {t(bodyKey)}
      </Text>
      <Button
        text={t('onboarding.check_status')}
        pressed={() => checkStatus()}
        loading={refreshing}
        disabled={refreshing}
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

export default PendingReview;
