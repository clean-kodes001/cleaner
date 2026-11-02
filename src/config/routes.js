import * as React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useSelector} from 'react-redux';
import Intro from '../screens/Onboarding/Intro';
import Welcome from '../screens/Onboarding/Welcome';
import SignUp from '../screens/Onboarding/Signup';
import Login from '../screens/Onboarding/Login';
import SignupOtp from '../screens/Onboarding/SignupOtp';
import CreatePassword from '../screens/Onboarding/CreatePassword';
import Dashboard from '../screens/Dashboard/Dashboard';
import ForgotPassword from '../screens/Onboarding/ForgotPassword';
import ForgotPasswordOtp from '../screens/Onboarding/ForgotPasswordOtp';
import ResetPassword from '../screens/Onboarding/ResetPassword';
import Step2 from '../screens/Profile/Step2';
import Step3 from '../screens/Profile/Step3';
import Step4 from '../screens/Profile/Step4';
import Step5 from '../screens/Profile/Step5';
import SuccessMessage from '../components/Shared/SuccessMessage';
import PendingReview from '../components/Shared/PendingReview';

import UpdateDocumnets from '../screens/Profile/UpdateDocuments';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import Step1 from '../screens/Profile/Step1';
import ChatRoom from '../screens/Dashboard/Chat/ChatRoom';
import HistoryDetails from '../screens/History/HistoryDetails';
import Logs from '../screens/Dashboard/Logs';
import Rate from '../screens/Dashboard/Rate';
import Amend from '../screens/Dashboard/Amend';
import EditProfileInfomation from '../screens/Profile/EditProfileInfomation';
import ProfileInfo from '../screens/Profile/ProfileInfo';
import EditProfileOtp from '../screens/Profile/EditProfileOtp';
import ContactSupport from '../screens/Profile/ContactSupport';
import ContactUs from '../screens/Profile/ContactUs';
import ViewImages from '../screens/Extra/ViewImages';
import AccountInfomation from '../screens/Dashboard/AccountInfomation';
import EnterPassword from '../screens/Onboarding/EnterPasswordScreen';
import InviteFriends from '../screens/Profile/InviteFriends';

const Stack = createNativeStackNavigator();

export const config = {
  screens: {
    signup: {
      path: 'signup',
    },
  },
};
const linking = {
  prefixes: ['www.swipeklincleaner.com://'],
  config,
};

export const Routes = () => {
  const {user, onboardingStatus} = useSelector(state => state.user);
  // console.log('onboardingStatus ===> ', onboardingStatus);

  const onboarding = onboardingStatus?.onboarding_status;
  const canAccessApp =
    onboardingStatus?.can_access_app === 1 || onboardingStatus?.can_access_app === true;

  const needsBioUpdate =
    onboarding?.bio_data === 1 || onboarding?.bio_data === true;
  const needsDocumentUpdate =
    onboarding?.document_upload === 1 || onboarding?.document_upload === true;
  // The profile photo lives on Step 2, so when the admin flags the avatar for
  // re-upload we must land the cleaner there first (then Step 3 / Step 4).
  const needsAvatarUpdate =
    Array.isArray(onboarding?.required_bio_fields) &&
    onboarding.required_bio_fields.includes('avatar');

  // Whether the cleaner has actually FINISHED initial onboarding. The backend appends
  // `profile` (bio + documents complete) and `has_real_avatar` (a real uploaded photo)
  // on the user. A cleaner who hasn't finished must resume onboarding rather than land
  // on the "under review" success screen.
  const hasPhoto = user?.has_real_avatar === true || user?.has_real_avatar === 1;
  const profileComplete = user?.profile === true || user?.profile === 1;
  // `profile` (bio + all 7 documents) does NOT factor in training — without this
  // separate check, the moment the last document lands, `profileComplete` flips
  // true and a cleaner who hasn't watched training yet gets bounced straight to
  // the "under review" success screen instead of Step5.
  const trainingDone =
    onboardingStatus?.training_status === 1 ||
    onboardingStatus?.training_status === true;
  const bioComplete = !!(
    user?.first_name &&
    user?.last_name &&
    user?.dob &&
    user?.address &&
    user?.country_id &&
    user?.state_id &&
    user?.city_id
  );

  let initialRouteName;
  if (user && onboardingStatus) {
    if (!canAccessApp) {
      if (needsBioUpdate || needsDocumentUpdate) {
        initialRouteName = needsAvatarUpdate
          ? 'step2'
          : needsBioUpdate && !needsDocumentUpdate
          ? 'step3'
          : needsDocumentUpdate && !needsBioUpdate
          ? 'step4'
          : 'step3';
      } else if (!profileComplete || !trainingDone) {
        // Initial onboarding isn't finished — resume at the first incomplete step
        // (photo -> bio -> documents -> training) instead of the "under review"
        // success screen.
        initialRouteName = !hasPhoto
          ? 'step2'
          : !bioComplete
          ? 'step3'
          : !profileComplete
          ? 'step4'
          : 'step5';
      } else {
        // Nothing flagged, profile complete, training done — land on the
        // pending-review holding screen, not the one-time "thank you for
        // submitting" receipt.
        initialRouteName = 'pendingReview';
      }
    } else if (
      onboarding?.status === 'approved' &&
      (!onboarding?.needs_update ||
        onboarding?.needs_update === false ||
        onboarding?.needs_update === 0) &&
      (!needsBioUpdate || needsBioUpdate === false || needsBioUpdate === 0) &&
      (!needsDocumentUpdate ||
        needsDocumentUpdate === false ||
        needsDocumentUpdate === 0)
    ) {
      initialRouteName = 'dashboard';
    } else if (
      onboardingStatus?.training_status === 1 ||
      onboardingStatus?.training_status === true
    ) {
      initialRouteName = 'dashboard';
    } else {
      initialRouteName = 'step1';
    }
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{headerShown: false}}
        initialRouteName={initialRouteName}>
        {/* {!completedOnboarding && (
          <>
            <Stack.Screen name="intro" component={Intro} />
          </>
        )} */}
        {user ? (
          // Priority 1: Use onboarding status API response if available
          onboardingStatus ? (
            !onboardingStatus.can_access_app ||
            onboardingStatus.can_access_app === 0 ? (
              // Cannot access app - check specific update flags
              onboardingStatus.onboarding_status?.bio_data === 1 ||
              onboardingStatus.onboarding_status?.bio_data === true ||
              onboardingStatus.onboarding_status?.document_upload === 1 ||
              onboardingStatus.onboarding_status?.document_upload === true ||
              !profileComplete ||
              !trainingDone ? (
                // Needs update OR initial onboarding unfinished - mount all steps so
                // the resume initialRouteName (step2/3/4/5) has a screen to land on.
                <>
                  <Stack.Screen name="step1" component={Step1} />
                  <Stack.Screen name="step2" component={Step2} />
                  <Stack.Screen name="step3" component={Step3} />
                  <Stack.Screen name="step4" component={Step4} />
                  <Stack.Screen name="step5" component={Step5} />
                  <Stack.Screen name="successInfo" component={SuccessMessage} />
                  <Stack.Screen name="pendingReview" component={PendingReview} />
                </>
              ) : (
                // No updates needed - pending review
                <>
                  <Stack.Screen name="successInfo" component={SuccessMessage} />
                  <Stack.Screen name="pendingReview" component={PendingReview} />
                </>
              )
            ) : // Can access app - check if fully approved
            onboardingStatus.onboarding_status?.status === 'approved' &&
              (!onboardingStatus.onboarding_status?.needs_update ||
                onboardingStatus.onboarding_status?.needs_update === false ||
                onboardingStatus.onboarding_status?.needs_update === 0) &&
              (!onboardingStatus.onboarding_status?.bio_data ||
                onboardingStatus.onboarding_status?.bio_data === false ||
                onboardingStatus.onboarding_status?.bio_data === 0) &&
              (!onboardingStatus.onboarding_status?.document_upload ||
                onboardingStatus.onboarding_status?.document_upload === false ||
                onboardingStatus.onboarding_status?.document_upload === 0) ? (
              // Fully approved - show dashboard
              <>
                <Stack.Screen name="dashboard" component={Dashboard} />
                <Stack.Screen name="viewimages" component={ViewImages} />
                <Stack.Screen name="myaccount" component={AccountInfomation} />
                <Stack.Screen
                  name="historydetails"
                  component={HistoryDetails}
                />
                <Stack.Screen name="amend" component={Amend} />
                <Stack.Screen
                  name="editprofileotp"
                  component={EditProfileOtp}
                />
                {/* <Stack.Screen name="logs" component={Logs} /> */}
                <Stack.Screen name="rate" component={Rate} />
                <Stack.Screen
                  name="contactsupport"
                  component={ContactSupport}
                />
                <Stack.Screen name="contactus" component={ContactUs} />
                <Stack.Screen name="profileinfo" component={ProfileInfo} />
                <Stack.Screen name="chatroom" component={ChatRoom} />
                <Stack.Screen
                  name="documentupload"
                  component={UpdateDocumnets}
                />
                <Stack.Screen name="profile" component={ProfileScreen} />
                <Stack.Screen
                  name="successmessage"
                  component={SuccessMessage}
                />
                <Stack.Screen name="invitefriends" component={InviteFriends} />
                <Stack.Screen
                  name="editprofileinfo"
                  component={EditProfileInfomation}
                />
                {/* <Stack.Screen name="profileinfo" component={ProfileInfomation} /> */}
              </>
            ) : onboardingStatus.training_status === 1 ||
              onboardingStatus.training_status === true ? (
              // Can access app and training completed - show dashboard
              <>
                <Stack.Screen name="dashboard" component={Dashboard} />
                <Stack.Screen name="viewimages" component={ViewImages} />
                <Stack.Screen name="myaccount" component={AccountInfomation} />
                <Stack.Screen
                  name="historydetails"
                  component={HistoryDetails}
                />
                <Stack.Screen name="amend" component={Amend} />
                <Stack.Screen
                  name="editprofileotp"
                  component={EditProfileOtp}
                />
                {/* <Stack.Screen name="logs" component={Logs} /> */}
                <Stack.Screen name="rate" component={Rate} />
                <Stack.Screen
                  name="contactsupport"
                  component={ContactSupport}
                />
                <Stack.Screen name="contactus" component={ContactUs} />
                <Stack.Screen name="profileinfo" component={ProfileInfo} />
                <Stack.Screen name="chatroom" component={ChatRoom} />
                <Stack.Screen
                  name="documentupload"
                  component={UpdateDocumnets}
                />
                <Stack.Screen name="profile" component={ProfileScreen} />
                <Stack.Screen
                  name="successmessage"
                  component={SuccessMessage}
                />
                <Stack.Screen name="invitefriends" component={InviteFriends} />
                <Stack.Screen
                  name="editprofileinfo"
                  component={EditProfileInfomation}
                />
                {/* <Stack.Screen name="profileinfo" component={ProfileInfomation} /> */}
              </>
            ) : (
              // Can access app but training not completed - show steps
              <>
                <Stack.Screen name="step1" component={Step1} />
                <Stack.Screen name="step2" component={Step2} />
                <Stack.Screen name="step3" component={Step3} />
                <Stack.Screen name="step4" component={Step4} />
                <Stack.Screen name="step5" component={Step5} />
              </>
            )
          ) : // Priority 2: Fallback to existing logic if onboardingStatus is not available
          user?.profile === false ? (
            <>
              <Stack.Screen name="step2" component={Step2} />
              <Stack.Screen name="step1" component={Step1} />
              <Stack.Screen name="step3" component={Step3} />
              <Stack.Screen name="step4" component={Step4} />
              <Stack.Screen name="step5" component={Step5} />
            </>
          ) : user?.first_name &&
            (!user?.document?.insurance ||
              !user?.document?.police_check ||
              !user?.document?.driver_license_front ||
              !user?.document?.driver_license_back ||
              !user?.document?.valid_id_front ||
              !user?.document?.valid_id_back ||
              !user?.document?.vulnurability) ? (
            <>
              <Stack.Screen name="step4" component={Step4} />
              <Stack.Screen name="step1" component={Step1} />
              <Stack.Screen name="step2" component={Step2} />
              <Stack.Screen name="step3" component={Step3} />
              <Stack.Screen name="step5" component={Step5} />
            </>
          ) : user?.document?.training_status === 0 ? (
            <>
              <Stack.Screen name="step5" component={Step5} />
              <Stack.Screen name="step1" component={Step1} />
              <Stack.Screen name="step2" component={Step2} />
              <Stack.Screen name="step3" component={Step3} />
              <Stack.Screen name="step4" component={Step4} />
            </>
          ) : user?.document?.review === 0 ? (
            <Stack.Screen name="successInfo" component={SuccessMessage} />
          ) : (
            <>
              <Stack.Screen name="dashboard" component={Dashboard} />
              <Stack.Screen name="viewimages" component={ViewImages} />
              <Stack.Screen name="myaccount" component={AccountInfomation} />
              <Stack.Screen name="historydetails" component={HistoryDetails} />
              <Stack.Screen name="amend" component={Amend} />
              <Stack.Screen name="editprofileotp" component={EditProfileOtp} />
              {/* <Stack.Screen name="logs" component={Logs} /> */}
              <Stack.Screen name="rate" component={Rate} />
              <Stack.Screen name="contactsupport" component={ContactSupport} />
              <Stack.Screen name="contactus" component={ContactUs} />
              <Stack.Screen name="profileinfo" component={ProfileInfo} />
              <Stack.Screen name="chatroom" component={ChatRoom} />
              <Stack.Screen name="documentupload" component={UpdateDocumnets} />
              <Stack.Screen name="profile" component={ProfileScreen} />
              <Stack.Screen name="successmessage" component={SuccessMessage} />
              <Stack.Screen name="invitefriends" component={InviteFriends} />
              <Stack.Screen
                name="editprofileinfo"
                component={EditProfileInfomation}
              />
              {/* <Stack.Screen name="profileinfo" component={ProfileInfomation} /> */}
            </>
          )
        ) : (
          <>
            <Stack.Screen name="welcome" component={Welcome} />
            <Stack.Screen name="forgotpassword" component={ForgotPassword} />
            <Stack.Screen
              name="forgotpasswordotp"
              component={ForgotPasswordOtp}
            />
            <Stack.Screen name="resetpassword" component={ResetPassword} />
            <Stack.Screen name="signupotp" component={SignupOtp} />
            <Stack.Screen name="createpassword" component={CreatePassword} />
            <Stack.Screen name="enterpassword" component={EnterPassword} />
            <Stack.Screen name="signup" component={SignUp} />
            <Stack.Screen name="login" component={Login} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
