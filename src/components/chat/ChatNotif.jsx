import React from 'react';
import {StyleSheet, View} from 'react-native';
import Text from '../Shared/Text';

const ChatNotif = ({info}) => {
  return (
    <View style={styles.notif}>
      <View style={styles.line}></View>
      <View style={styles.notifMid}>
        <Text style={styles.notifMidText} light>
          {info}
        </Text>
      </View>
      <View style={styles.line}></View>
    </View>
  );
};

export default ChatNotif;

const styles = StyleSheet.create({
  notif: {
    display: 'flex',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  notifMid: {
    minWidth: 151,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  notifMidText: {
    fontSize: 9,
    alignItems: 'center',
    marginHorizontal: 12,
    color: '#474747',
  },
  line: {
    height: 1,
    backgroundColor: '#C4C4C4',
    flex: 1,
  },
});
