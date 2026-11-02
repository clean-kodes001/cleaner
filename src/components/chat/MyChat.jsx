import React, {useState} from 'react';
import {ActivityIndicator, Image, StyleSheet, View} from 'react-native';
import Text from '../Shared/Text';
import {useDispatch, useSelector} from 'react-redux';
import {postChat} from '../../store/actions/chats/postChat';
import {Pressable} from 'react-native';
import {useTranslation} from 'react-i18next';

const OthersChat = ({message, time, isLastItem, messageType, onImagePress}) => {
  const {t} = useTranslation();
  const {lastMessageStatus} = useSelector(state => state.chat);
  const isImage = messageType === 'image';

  const dispatch = useDispatch();
  const handleResendMessage = () => {
    // Image resend isn't possible from here (the local file reference is
    // gone) — the user re-sends from the attachment picker instead.
    if (isImage) {
      return;
    }
    const data = {
      message: message,
    };
    dispatch(postChat({payload: data, cb: () => {}}));
  };

  return (
    <Pressable
      onPress={
        lastMessageStatus === 'failed' && !isImage ? handleResendMessage : null
      }
      style={styles.myChat}>
      {isImage ? (
        <Pressable onPress={onImagePress} style={styles.imageBox}>
          <Image
            source={{uri: message}}
            style={styles.chatImage}
            resizeMode="cover"
          />
        </Pressable>
      ) : (
        <View style={styles.myChatTextBox}>
          <Text style={styles.myChatText}>{message}</Text>
        </View>
      )}
      {isLastItem && lastMessageStatus === 'sending' ? (
        <ActivityIndicator style={{marginRight: 12, marginTop: 4}} />
      ) : isLastItem && lastMessageStatus === 'failed' && !isImage ? (
        <Text semibold style={styles.resend}>{t('otp.resend')}</Text>
      ) : (
        <Text style={styles.timeText}>{time}</Text>
      )}
    </Pressable>
  );
};

export default OthersChat;

const styles = StyleSheet.create({
  myChat: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    marginBottom: 18,
    maxWidth: '85%',
  },
  myChatTextBox: {
    backgroundColor: '#262068',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  myChatText: {fontSize: 14, lineHeight: 24, color: '#FFFFFF'},
  imageBox: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E5E5E7',
  },
  chatImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },

  timeText: {
    fontSize: 10,
    marginVertical: 4,
    lineHeight: 16,
    color: '#919094',
  },
  resend: {
    marginRight: 8,
    marginTop: 4,
    fontSize: 10,
    color: '#122466',
  },
});
