import React from 'react';
import {Image, Pressable, StyleSheet, View} from 'react-native';
import Text from '../Shared/Text';

const OthersChat = ({avatar, message, time, first_name, messageType, onImagePress}) => {
  const isImage = messageType === 'image';
  return (
    <View style={styles.othersChat}>
      {/* <Image style={styles.image} source={{uri: item.user.avatar}} /> */}
      <View>
        <Text capitalized style={[styles.timeText, {color: '#333'}]}>
          {first_name}
        </Text>
        {isImage ? (
          <Pressable onPress={onImagePress} style={styles.imageBox}>
            <Image
              source={{uri: message}}
              style={styles.chatImage}
              resizeMode="cover"
            />
          </Pressable>
        ) : (
          <View style={styles.othersChatTextBox}>
            <Text style={styles.othersChatText}>{message}</Text>
          </View>
        )}
        <Text style={styles.timeText}>{time}</Text>
      </View>
    </View>
  );
};

export default OthersChat;

const styles = StyleSheet.create({
  othersChat: {flexDirection: 'row', marginBottom: 18, maxWidth: '84%'},
  othersChatTextBox: {
    backgroundColor: '#F2F4F5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  image: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 4,
  },
  othersChatText: {fontSize: 14, lineHeight: 24, color: '#112950'},
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
});
