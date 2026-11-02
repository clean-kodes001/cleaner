import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
  Clipboard,
  TouchableOpacity,
  Share,
} from 'react-native';
import ScreenContainer from '../../components/Shared/ScreenContainer';
import Head from '../../components/Shared/Head';
import Button from '../../components/Shared/Button';
import {useSelector} from 'react-redux';
import {showToast} from '../../utils/showToast';
import {useTranslation} from 'react-i18next';

const InviteFriends = ({navigation}) => {
  const {t} = useTranslation();
  const {user} = useSelector(state => state.user);
  const {referral_code} = user;
  const copyToClipboard = () => {
    Clipboard.setString(referral_code);
    showToast({
      type: 1,
      title: 'Copied',
      message: t('inviteFriends.copied_message'),
      bottom: 20,
    });
  };
  const shareReferralLink = async () => {
    try {
      await Share.share({
        message: `I'm inviting you to use SwipeKlin "Cleaner App" for your Cleaning Services Opportunities. Use the referral code: "${referral_code}" when signing up to earn me a referral bonus.

You can download that app from your app stores: swipeklin.com/download`,
      });
    } catch (error) {
      Alert.alert(
        'Error',
        'Something went wrong while trying to share the referral link.',
      );
    }
  };
  return (
    <ScreenContainer style={styles.container}>
      <ScrollView style={styles.container}>
        <View>
          <Head pageTitle={t('inviteFriends.invite_button')} type={2} navigation={navigation} />
        </View>
        <View style={styles.body}>
          <Image
            style={{height: 250, width: 250, alignSelf: 'center'}}
            resizeMode="contain"
            source={require('../../assets/media/images/refer_friend.png')}
          />
          <Text style={styles.title}>{t('inviteFriends.heading')}</Text>
          <Text style={styles.message}>{t('inviteFriends.description')}</Text>

          <View style={styles.referralContainer}>
            <Text style={styles.label}>{t('inviteFriends.referral_code_label')}</Text>
            <View style={styles.referralContentContainer}>
              <Text style={styles.referralCode}>{referral_code}</Text>
              <TouchableOpacity
                onPress={copyToClipboard}
                style={styles.copyButton}>
                <Text style={styles.copyText}>{t('inviteFriends.copy')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Button
            disabled={false}
            pressed={shareReferralLink}
            height={52}
            style={{borderRadius: 8, marginTop: 32}}
            text={t('inviteFriends.invite_button')}
            textStyle={{fontSize: 15}}
          />

          <Text style={styles.termsText}>
            {t('inviteFriends.terms_note')}
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

export default InviteFriends;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
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
  body: {
    flex: 1,
    flexDirection: 'column',
    alignContent: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 18,
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
  },
  message: {
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
    marginTop: 16,
  },
  label: {
    fontSize: 18,
    color: '#888',
    marginBottom: 10,
  },
  referralContainer: {
    padding: 20,
    backgroundColor: '#F4F6F9',
    borderRadius: 8,
    marginTop: 32,
  },
  referralContentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  referralCode: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 10,
  },
  copyButton: {
    backgroundColor: '#4CAF50', // Green button
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 5,
  },
  copyText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  termsText: {
    marginTop: 12,
    fontSize: 10,
    textAlign: 'center',
  },
});
