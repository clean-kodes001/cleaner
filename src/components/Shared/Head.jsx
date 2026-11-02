import React from 'react';
import {TouchableOpacity, View} from 'react-native';
import Icon from "@react-native-vector-icons/material-design-icons";
import MaterialIcons from "@react-native-vector-icons/material-icons";
import Text from './Text';
import {colors} from '../../config/colors';
const Head = ({
  navigation,
  secondButtonTitle,
  handleSecondButton,
  disableSecondButton,
  pageTitle,
  type,
}) => {
  return (
    <View
      style={{
        width: '100%',
        marginRight: 12,
        marginTop: 8,
        marginBottom: 4,
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: 'row',
      }}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{
          width: 30,
          height: 30,
        }}>
        {type === 2 ? (
          <Icon name="keyboard-backspace" color={colors.textBlack} size={28} />
        ) : (
          <Icon name="chevron-left" color={colors.primaryText} size={36} />
        )}
      </TouchableOpacity>
      {type === 2 && (
        <View
          style={{
            padding: 10,
          }}>
          <Text
            fontType={'roboto'}
            medium
            color={colors.textBlack}
            style={{fontSize: 18}}>
            {pageTitle}
          </Text>
        </View>
      )}
      <TouchableOpacity
        disabled={disableSecondButton}
        onPress={handleSecondButton}
        style={{
          padding: type === 2 ? 10 : 15,
          opacity: disableSecondButton ? 0.5 : 1,
        }}>
        <Text
          fontType={'roboto'}
          medium
          color={colors.primaryText}
          style={{fontSize: 16}}>
          {secondButtonTitle}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default Head;
