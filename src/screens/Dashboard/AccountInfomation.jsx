import React, {useEffect, useState, Component, useCallback} from 'react';
import {Alert, Platform, StyleSheet, TouchableOpacity, View, KeyboardAvoidingView as RNKeyboardAvoidingView, ScrollView, RefreshControl} from 'react-native';
import ScreenContainer from '../../components/Shared/ScreenContainer';
import {useDispatch, useSelector} from 'react-redux';
import Button from '../../components/Shared/Button';
import TextInputField from '../../components/Inputs/TextInputField';
import {formHandler} from '../../utils/formhandler';
import {useFormik} from 'formik';
import {_accountSchema} from '../../utils/validationSchemas';
import Head from '../../components/Shared/Head';
import {addPaymentAccount} from '../../store/actions/profile/addPaymentAccount';
import {getPaymentAccount} from '../../store/actions/profile/getPaymentAccount';
import {deletePaymentAccount} from '../../store/actions/profile/deletePaymentAccount';
import {setDefaultPaymentAccount} from '../../store/actions/profile/setDefaultPaymentAccount';
import {showToast} from '../../utils/showToast';
import {Client} from '../../config/client';
import {
  StripeProvider,
  useStripe,
  CardForm,
  CardField,
} from '@stripe/stripe-react-native';
import {colors} from '../../config/colors';
import Text from '../../components/Shared/Text';
import Select from '../../components/Inputs/Select';
import PayoutBox from '../../components/Payment/PayoutBox';
import {useTranslation} from 'react-i18next';

// Error Boundary for CardForm to catch React Native 0.76 new architecture errors
class CardFormErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {hasError: false, error: null};
  }

  static getDerivedStateFromError(error) {
    return {hasError: true, error: error?.message || 'Unknown error'};
  }

  componentDidCatch(error, errorInfo) {
    console.error('CardForm Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Note: Error boundary is a class component and cannot use hooks.
      // The keys reference en.json: accounts.card_form_unavailable, accounts.card_form_contact_admin
      return (
        <View
          style={{
            padding: 20,
            backgroundColor: '#fff',
            borderRadius: 8,
            marginBottom: 20,
          }}>
          <Text style={{color: 'red', marginBottom: 10}}>
            {/* accounts.card_form_unavailable */}
            Card form unavailable
          </Text>
          <Text style={{color: '#666', fontSize: 12}}>
            {/* accounts.card_form_contact_admin */}
            Contact Admin for support.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

// Child component that uses useStripe hook - must be inside StripeProvider
const AccountInfomationContent = ({
  navigation,
  user,
  accountPending,
  payment,
  bankAccounts,
  userCardDetails,
  dispatch,
}) => {
  const {t} = useTranslation();
  console.log('payment?.account?.payouts_enabled===>', payment);
  const requirements = payment?.account?.requirements;
  const currentlyDue = Array.isArray(requirements?.currently_due)
    ? requirements.currently_due
    : [];

  const needsStripeUpdate =
    !!payment?.account &&
    (payment?.account?.payouts_enabled === false ||
      currentlyDue.length > 0 ||
      !!requirements?.disabled_reason);

  const disabledReason = requirements?.disabled_reason;
  const isUnderReview =
    disabledReason === 'under_review' || disabledReason === 'pending.verification';
  const isRejected = disabledReason?.startsWith?.('rejected');

  let bannerMessage = null;
  let bannerColor = '#ff9800';

  if (needsStripeUpdate) {
    if (isRejected) {
      bannerColor = '#f44336';
      bannerMessage = t('accounts.stripe_update_needed');
    } else if (isUnderReview) {
      bannerColor = '#ff9800';
      bannerMessage = t('accounts.stripe_under_review');
    } else {
      bannerColor = '#ff9800';
      bannerMessage = t('accounts.stripe_update_needed');
    }
  }

  // const [currentTabInd, setCurrentTabInd] = useState(0);
  const [secondLoading, setSecondLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cardFormComplete, setCardFormComplete] = useState(false);
  const [showAccountEdit, setShowAccountEdit] = useState(
    (bankAccounts?.length ?? 0) === 0,
  );
  const [actionOnId, setActionOnId] = useState(null);
  const [showCardEdit, setShowDataEdit] = useState(
    userCardDetails?.card_account ? false : true,
  );


  const [refreshing, setRefreshing] = useState(false);
  const [stripeLinkSending, setStripeLinkSending] = useState(false);
  const [stripeLinkSent, setStripeLinkSent] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    dispatch(getPaymentAccount()).finally(() => {
      setRefreshing(false);
    });
  }, [dispatch]);

  const emailStripeUpdateLink = async () => {
    if (stripeLinkSending) return;
    setStripeLinkSending(true);
    setStripeLinkSent(false);

    try {
      const response = await Client({
        method: 'POST',
        path: 'stripe/account-update-link/email',
        data: {},
        processError: false,
      });

      if (response?.data?.status === 'success') {
        setStripeLinkSent(true);
        showToast({
          type: 1,
          message: response?.data?.message || 'Check your email for your Stripe update link.',
        });
      } else {
        showToast({
          type: 0,
          message:
            response?.data?.message ||
            response?.data?.error ||
            'Unable to send Stripe update link.',
        });
      }
    } catch (e) {
      const message =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        'Unable to send Stripe update link.';
      showToast({type: 0, message});
    } finally {
      setStripeLinkSending(false);
    }
  };

  // useStripe hook must be called unconditionally
  const stripe = useStripe();
  const createToken = stripe?.createToken;

  const onSubmit = async values => {
    if (!createToken) {
      showToast({
        type: 0,
        message: t('common.stripe_not_initialized'),
      });
      return;
    }
    setSecondLoading(true);
    try {
      const response = await createToken({
        type: 'BankAccount',
        accountNumber: values?.account_number,
        routingNumber: `${values?.transit_code}-${values?.institution_number}`,
        accountHolderName: values?.account_holder_name,
        accountHolderType: 'Individual',
        currency: 'cad',
        country: 'CA'
      });

      if (response?.error) {
        showToast({
          type: 0,
          message: response?.error?.localizedMessage,
        });
        setSecondLoading(false);
        return;
      } else if (response?.token?.id) {
        const data = {
          type: 'bank',
          payout_method_id: response?.token?.id,
        };
        dispatch(
          addPaymentAccount({
            data,
            cb: ok => {
              if (ok !== false) {
                setShowAccountEdit(false);
              }
              form.resetForm();
            },
          }),
        );
        setSecondLoading(false);
      }
    } catch (error) {
      showToast({
        type: 0,
        message: error?.message || error,
      });
      setSecondLoading(false);
    }
  };

 

  const onSubmitCardDetails = id => {
    const data = {
      type: 'card',
      payout_method_id: id,
    };
    dispatch(addPaymentAccount({data, cb: () => setLoading(false)}));
  };

  const handleSetDefault = id => {
    setActionOnId(id);
    dispatch(setDefaultPaymentAccount({id, cb: () => setActionOnId(null)}));
  };

  const handleDelete = (id, last4) => {
    Alert.alert(
      t('accounts.delete_bank_account_title'),
      `${t('accounts.delete_bank_account_message')} ${last4 ?? '----'}${t('accounts.delete_bank_account_suffix')}`,
      [
        {text: t('accounts.cancel_button'), style: 'cancel'},
        {
          text: t('accounts.delete'),
          style: 'destructive',
          onPress: () => {
            setActionOnId(id);
            dispatch(deletePaymentAccount({id, cb: () => setActionOnId(null)}));
          },
        },
      ],
    );
  };

  const handleEditCard = () => {
    setShowDataEdit(true);
  };

  const {unAuthenticated} = useSelector(state => state.data);

  const currencys = [{name: 'Canadian Dollar', id: 'cad'}];

  // Safety check for countries list
  const countriesList = (unAuthenticated?.countries || []).filter(c => c.id !== 2); // Nigeria disabled

  const pay = async () => {
    if (!createToken) {
      showToast({
        type: 0,
        message: t('common.stripe_not_initialized'),
      });
      return;
    }
    try {
      setLoading(true);
      const response = await createToken({
        type: 'Card',
        currency: 'cad',
      });

      if (response?.error) {
        showToast({
          type: 0,
          message:
            response?.error?.localizedMessage || response?.error?.message,
        });
        setLoading(false);
        return;
      }

      onSubmitCardDetails(response?.token?.id);
    } catch (error) {
      setLoading(false);

      showToast({
        type: 0,
        message: error?.message || error,
      });
    }
  };

  // Remove duplicate getPaymentAccount call - it's already called in parent component

  const form = useFormik({
    initialValues: {
      account_holder_name: user?.account_holder_name || '',
      account_number: '',
      transit_code: '',
      institution_number: '',
      name: '',
      currency: '',
      address: '',
      countryCode: '',
    },
    validationSchema: _accountSchema,
    onSubmit,
  });

  return (
    <ScreenContainer style={{flex: 1, backgroundColor: '#eee'}}>
      <View
        style={{
          paddingHorizontal: 32,
          borderBottomColor: '#e5e5e5',
          borderBottomWidth: 2,
        }}>
        <Head pageTitle={t('accounts.payout_details')} type={2} navigation={navigation} />
      </View>
      <RNKeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 10}
        style={{flex: 1}}>
        <ScrollView
          contentContainerStyle={{flexGrow: 1}}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
        {needsStripeUpdate && bannerMessage && (
          <View style={{backgroundColor: bannerColor, padding: 15, alignItems: 'center'}}>
            <Text style={{color: 'white', fontSize: 12, textAlign: 'center'}}>
              {bannerMessage}
            </Text>
          </View>
        )}

        {needsStripeUpdate && (
          <View style={{paddingHorizontal: 20, paddingTop: 12}}>
            <Button
              text={t('accounts.email_stripe_link')}
              loading={stripeLinkSending}
              disabled={stripeLinkSending}
              pressed={emailStripeUpdateLink}
              height={48}
              style={{
                width: '100%',
                borderRadius: 8,
                backgroundColor: colors.brandPrimary,
              }}
            />
            {stripeLinkSent && (
              <Text style={{marginTop: 10, fontSize: 12, color: '#111827'}} center>
                {t('accounts.stripe_link_sent')}
              </Text>
            )}
          </View>
        )}

        {!showAccountEdit && bankAccounts.length > 0 && (
          <View style={{paddingVertical: 16}}>
            {bankAccounts.map(b => (
              <View key={b.id} style={{marginBottom: 12, alignItems: 'center'}}>
                <PayoutBox
                  card={b}
                  isDefault={b.is_default}
                  showDelete={bankAccounts.length > 1}
                  loadingAction={actionOnId === b.id}
                  onSetDefault={() => handleSetDefault(b.id)}
                  onDelete={() => handleDelete(b.id, b.last4)}
                />
              </View>
            ))}
            <Button
              text={t('accounts.add_bank_account_link')}
              pressed={() => setShowAccountEdit(true)}
              height={48}
              style={{
                width: '90%',
                alignSelf: 'center',
                marginTop: 12,
                borderRadius: 8,
              }}
            />
          </View>
        )}

        {showAccountEdit && (
          <View style={styles.container}>
            <View>
              <TextInputField
                {...formHandler('account_holder_name', form)}
                placeholder={t('accounts.account_name_placeholder')}
                label={t('accounts.account_name_label')}
                mainStyles={{width: '100%'}}
              />
              <TextInputField
                {...formHandler('account_number', form)}
                placeholder={t('accounts.account_number_placeholder')}
                label={t('accounts.account_number_label')}
                keyboardType={'numeric'}
                mainStyles={{width: '100%'}}
              />
              <TextInputField
                {...formHandler('transit_code', form)}
                placeholder={t('accounts.transit_code_placeholder')}
                label={t('accounts.transit_code_label')}
                keyboardType={'numeric'}
                mainStyles={{width: '100%'}}
              />
              <TextInputField
                {...formHandler('institution_number', form)}
                placeholder={t('accounts.institution_number_placeholder')}
                label={t('accounts.institution_number_label')}
                keyboardType={'numeric'}
                mainStyles={{width: '100%'}}
              />
            </View>

            <Button
              loading={secondLoading || accountPending}
              text={bankAccounts.length === 0 ? t('accounts.add_bank_account_button') : t('accounts.save_button')}
              disabled={
                secondLoading || accountPending || !form.dirty || !form.isValid
              }
              pressed={form.handleSubmit}
              height={52}
              style={{width: '100%', marginVertical: 16}}
            />
            {bankAccounts.length > 0 && (
              <Button
                text={t('accounts.cancel_button')}
                pressed={() => {
                  setShowAccountEdit(false);
                  form.resetForm();
                }}
                height={48}
                style={{
                  width: '100%',
                  marginBottom: 16,
                  backgroundColor: '#999',
                  borderRadius: 8,
                }}
              />
            )}
          </View>
        )}
        </ScrollView>
      </RNKeyboardAvoidingView>
    </ScreenContainer>
  );
};

// Main component that wraps with StripeProvider
const AccountInfomation = ({navigation}) => {
  const {t} = useTranslation();
  const {user, accountPending, payment} = useSelector(state => state.user);
  const bankAccounts = payment?.bank_accounts ?? [];
  const userCardDetails = payment?.card_account;
  const dispatch = useDispatch();

  // Load payment account on mount
  useEffect(() => {
    if (!payment) {
      dispatch(getPaymentAccount());
    }
  }, [dispatch, payment]);

  // Show loading screen while payment data is being fetched
  if (payment === null || payment === undefined) {
    return (
      <ScreenContainer style={{flex: 1, backgroundColor: '#eee'}}>
        <View
          style={{
            paddingHorizontal: 32,
            borderBottomColor: '#e5e5e5',
            borderBottomWidth: 2,
          }}>
          <Head pageTitle={t('accounts.payout_details')} type={2} navigation={navigation} />
        </View>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Text>{t('accounts.loading_payment_config')}</Text>
        </View>
      </ScreenContainer>
    );
  }

  // Don't render StripeProvider if publishableKey is missing (causes Android crash)
  if (!payment?.publishableKey || typeof payment.publishableKey !== 'string') {
    return (
      <ScreenContainer style={{flex: 1, backgroundColor: '#eee'}}>
        <View
          style={{
            paddingHorizontal: 32,
            borderBottomColor: '#e5e5e5',
            borderBottomWidth: 2,
          }}>
          <Head pageTitle={t('accounts.payout_details')} type={2} navigation={navigation} />
        </View>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Text>{t('accounts.loading_payment_config')}</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
      <StripeProvider
        publishableKey={payment.publishableKey}
        // urlScheme="your-url-scheme" // required for 3D Secure and bank redirects
        // merchantIdentifier="merchant.com.{{YOUR_APP_NAME}}" // required for Apple Pay
      >
        <AccountInfomationContent
          navigation={navigation}
          user={user}
          accountPending={accountPending}
          payment={payment}
          bankAccounts={bankAccounts}
          userCardDetails={userCardDetails}
          dispatch={dispatch}
        />
      </StripeProvider>
  );
};

export default AccountInfomation;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 32,
    marginTop: 8,
  },
  doubleSelect: {
    display: 'flex',
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tabNav: {
    marginTop: 24,
    display: 'flex',
    flexDirection: 'row',
  },
  navItem: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#FBEEEA',
  },
  navItemText: {
    fontFamily: 'Roboto_500Medium',
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0.1,
    marginBottom: 10,
    color: '#122466',
  },
});
