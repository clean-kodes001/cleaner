import React, {useEffect, useState} from 'react';
import Text from '../../components/Shared/Text';
import ScreenContainer from '../../components/Shared/ScreenContainer';
import {StyleSheet, TouchableOpacity, ScrollView, View} from 'react-native';
import {colors} from '../../config/colors';
import EmptyState from '../../components/Shared/EmptyState';
import MaterialCommunityIcons from "@react-native-vector-icons/material-design-icons";
import FontAwesome from "@react-native-vector-icons/fontawesome";
import {useDispatch, useSelector} from 'react-redux';
import DetailsItem from '../../components/History/DetailsItem';
import FuntionButton from '../../components/Buttons/FuntionButton';
import {handleViewMore} from '../../utils/viewMore';
import TextInputField from '../../components/Inputs/TextInputField';
import {search} from '../../store/actions/user/search';
import BottomSelect from '../../components/Inputs/BottomSelect';

import {
  collectBankAccountForSetup,
  confirmSetup,
} from '@stripe/stripe-react-native';
import {useTranslation} from 'react-i18next';

// function PayoutAccountCollectionButton() {
//   // get Setup Intent client secret, user's full name, and email address.
//   // in this example, from a custom hook.
//   const {clientSecret, name, email} = useMyCustomState();

//   const handleCollectBankAccountPress = async clientSecret => {
//     const {setupIntent, error} = await collectBankAccountForSetup(
//       clientSecret,
//       {
//         paymentMethodType: 'USBankAccount',
//         paymentMethodData: {
//           billingDetails: {
//             name,
//             email,
//           },
//         },
//       },
//     );

//     if (error) {
//       // Inform your user that there was an error.
//     } else if (setupIntent) {
//       if (setupIntent.status === SetupIntents.Status.RequiresConfirmation) {
//         // Your user provided bank account details

//         // Confirm the SetupIntent
//         const {error: confirmError, setupIntent: confirmedSetupIntent} =
//           await confirmSetup(clientSecret, {type: 'USBankAccount'});

//         if (confirmError) {
//           // Unable to confirm the SetupIntent, inform your user there was an error
//         } else if (confirmedSetupIntent) {
//           if (confirmedSetupIntent.status === SetupIntents.Status.Succeeded) {
//             // Setup succeeded, Payment Method attached to the Customer
//             // Your logic to create a payout account could go here
//           } else {
//             // Unable to confirm the SetupIntent, re-fetch the SetupIntent for details
//           }
//         }
//       } else {
//         // User did not link an account or provide details manually
//       }
//     }
//   };

//   return (
//     <Button
//       onPress={() => handleCollectBankAccountPress(clientSecret)}
//       title="Collect bank account"
//     />
//   );
// }

const activeStyle = {
  backgroundColor: '#F5F5F6',
  borderColor: '#c5c5c7',
  borderWidth: 1,
  paddingHorizontal: 8,
};
const Payments = () => {
  const {t} = useTranslation();
  return (
    <ScreenContainer style={{flex: 1, padding: 12}}>
      <View style={styles.head}>
        <Text fontType={'roboto'} medium color={'#000'} style={{fontSize: 18}}>{t('dashboard.tab_payments')}</Text>
      </View>
      {/* <PayoutAccountCollectionButton /> */}
      {/* <EmptyState text={t('history.no_history')} /> */}
    </ScreenContainer>
  );
};

export default Payments;

const styles = StyleSheet.create({
  head: {
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginVertical: 8,
  },
});
