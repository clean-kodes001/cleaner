import React, {useState} from 'react';
import {
  Alert,
  Keyboard,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import ChatInput from '../Inputs/ChatInput';
import {postChat} from '../../store/actions/chats/postChat';
import {useDispatch, useSelector} from 'react-redux';
import Feather from "@react-native-vector-icons/feather";
import {colors} from '../../config/colors';
import {showToast} from '../../utils/showToast';
import {useTranslation} from 'react-i18next';

const MAX_IMAGE_BYTES = 9 * 1024 * 1024;

const ChatBtm = ({pushMyChat, startTyping = null}) => {
  const {t} = useTranslation();
  const [message, setMessage] = useState('');
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const {pending} = useSelector(state => state.chat);
  const sendAChat = message => {
    if (message.length > 0) {
      const data = {
        message: message,
      };
      setMessage('');
      const time = new Date();
      pushMyChat(message, time);
      dispatch(postChat({payload: data, cb: () => {}}));
    }
  };

  const requestCameraPermission = async () => {
    if (Platform.OS !== 'android') {
      return true;
    }
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Camera permission error:', err);
      return false;
    }
  };

  const sendImageAsset = asset => {
    if (!asset?.uri) {
      return;
    }
    if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) {
      showToast({type: 0, message: t('chat.photo_too_large')});
      return;
    }

    const uri =
      Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', '');
    const filename = asset.fileName || asset.uri.split('/').pop() || 'chat.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const image = {
      uri,
      name: filename,
      type: asset.type || (match ? `image/${match[1]}` : 'image/jpeg'),
    };

    const time = new Date();
    // Optimistic local preview with the device-local uri; the canonical URL
    // reaches the other party via the broadcast.
    pushMyChat(asset.uri, time, 'image');
    dispatch(postChat({image}));
  };

  const pickFromCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      showToast({type: 0, message: t('common.camera_permission_required')});
      return;
    }
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1920,
        saveToPhotos: false,
      });
      if (result?.didCancel || result?.errorCode) {
        return;
      }
      sendImageAsset(result?.assets?.[0]);
    } catch (error) {
      console.warn('Chat camera error:', error);
      showToast({type: 0, message: t('chat.photo_failed')});
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1920,
        selectionLimit: 1,
      });
      if (result?.didCancel || result?.errorCode) {
        return;
      }
      sendImageAsset(result?.assets?.[0]);
    } catch (error) {
      console.warn('Chat gallery error:', error);
      showToast({type: 0, message: t('chat.photo_failed')});
    }
  };

  const handleAttachment = () => {
    Keyboard.dismiss();
    Alert.alert(t('chat.send_photo'), null, [
      {text: t('chat.take_photo'), onPress: pickFromCamera},
      {text: t('chat.choose_from_gallery'), onPress: pickFromGallery},
      {text: t('common.cancel'), style: 'cancel'},
    ]);
  };

  return (
    <View style={[styles.btm, {paddingBottom: Math.max(insets.bottom, 16)}]}>
      <View style={styles.btmInner}>
        <ChatInput
          handleEnterClicked={({nativeEvent: {text}}) => sendAChat(text)}
          attachmentPressed={handleAttachment}
          onChange={startTyping}
          onChangeText={setMessage}
          value={message}
        />

        <Pressable
          style={{
            // paddingTop: 4,
            marginRight: 12,
          }}
          disabled={pending}
          onPress={() => {
            Keyboard.dismiss();
            sendAChat(message);
          }}>
          <Feather
            style={{color: pending ? '#999' : '#181441'}}
            size={32}
            name="arrow-up-circle"
          />
        </Pressable>
      </View>
    </View>
  );
};

export default ChatBtm;

const styles = StyleSheet.create({
  btm: {
    // Let KeyboardAvoidingView manage the layout
    width: '100%',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  btmInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
