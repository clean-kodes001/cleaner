import React, {useEffect, useState} from 'react';
import {Platform, Pressable, StyleSheet, TextInput, View} from 'react-native';
import Entypo from "@react-native-vector-icons/entypo";
import {useTranslation} from 'react-i18next';
const ChatInput = ({
  value,
  handleEnterClicked,
  onChange,
  onChangeText,
  attachmentPressed,
}) => {
  const {t} = useTranslation();
  return (
    <View style={[styles.chat]}>
      <TextInput
        onSubmitEditing={handleEnterClicked}
        // onFocus={ }
        // onSubmitEditing={}
        // keyboardType={keyboardType || "default"}
        underlineColorAndroid={'transparent'}
        // caretHidden={true}
        // contextMenuHidden={true}
        // enterKeyHint="search"
        placeholder={t('chat.input_placeholder')}
        placeholderTextColor={'rgba(9, 15, 71, 0.45)'}
        value={value}
        onChange={onChange}
        onChangeText={onChangeText}
        // textAlign="right"
        // returnKeyType="done"
        style={[styles.inputStyle]}
      />
      <Pressable onPress={attachmentPressed}>
        <Entypo name="attachment" size={16} color="#122466" />
      </Pressable>
    </View>
  );
};

export default ChatInput;

const styles = StyleSheet.create({
  chat: {
    borderRadius: 26,
    paddingHorizontal: 20,
    width: '85%',
    display: 'flex',
    backgroundColor: 'transparent',
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 0.8,
    borderColor: '#122466',
  },
  inputStyle: {
    flex: 1,
    color: '#121212',
    fontSize: 14,
    lineHeight: 17,
    fontFamily: 'Roboto-Medium',
  },
});
