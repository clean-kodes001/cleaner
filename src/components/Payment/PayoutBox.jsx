import React, {useState} from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  TouchableOpacity,
  View,
} from 'react-native';
import Text from '../Shared/Text';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import {useTranslation} from 'react-i18next';

const PayoutBox = ({
  card,
  isDefault,
  showDelete,
  loadingAction,
  onSetDefault,
  onDelete,
}) => {
  const {t} = useTranslation();
  const [show, setShow] = useState(false);

  const hasMenuItems = (!isDefault && !!onSetDefault) || (showDelete && !!onDelete);

  const handleDotsPress = () => {
    if (!hasMenuItems) return;
    setShow(prev => !prev);
  };

  return (
    <View style={{width: '95%', position: 'relative'}}>
      <View
        style={{
          height: 100,
          borderColor: '#767676',
          borderRadius: 8,
          overflow: 'hidden',
          backgroundColor: 'rgba(156, 237, 33,0.9)',
        }}>
        <ImageBackground
          style={{paddingTop: 12, paddingBottom: 4, width: '100%', height: 100}}
          source={require('../../assets/media/images/bank-bg.png')}>
          <View
            style={{
              flex: 1,
              marginHorizontal: 20,
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}>
            <View>
              <Text
                fontType={'roboto'}
                medium
                color={'#222'}
                style={{marginBottom: 8, fontSize: 18}}>
                {card?.account_holder_name || card?.bank_name || 'Bank account'}
              </Text>
              {card?.bank_name && card?.account_holder_name ? (
                <Text
                  fontType={'roboto'}
                  color={'#333'}
                  style={{marginBottom: 6, fontSize: 13}}>
                  {card?.bank_name}
                </Text>
              ) : null}
              {isDefault ? (
                <Text
                  fontType={'roboto'}
                  medium
                  color={'#000'}
                  style={{
                    fontSize: 10,
                    backgroundColor: '#FFE680',
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 4,
                    alignSelf: 'flex-start',
                  }}>{t('accounts.default_badge')}</Text>
              ) : null}
            </View>
            <Text fontType={'roboto'} color={'#FFF'} style={{fontSize: 18}}>
              ****{card?.last4 || '----'}
            </Text>
          </View>
          <View style={{width: '100%', paddingRight: 20, alignItems: 'flex-end'}}>
            <TouchableOpacity onPress={handleDotsPress}>
              <MaterialCommunityIcons
                style={{fontSize: 40}}
                color={hasMenuItems ? '#FFF' : 'rgba(255,255,255,0.3)'}
                name={'dots-horizontal'}
              />
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>

      {show && (
        <>
          <TouchableOpacity
            onPress={() => setShow(false)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10,
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 56,
              right: 16,
              zIndex: 20,
              borderRadius: 12,
              paddingVertical: 8,
              paddingHorizontal: 16,
              backgroundColor: '#fff',
              minWidth: 160,
              shadowColor: '#000',
              shadowOffset: {width: 0, height: 2},
              shadowOpacity: 0.15,
              shadowRadius: 6,
              elevation: 6,
            }}>
            {loadingAction ? (
              <ActivityIndicator color={'#000'} style={{paddingVertical: 8}} />
            ) : (
              <>
                {!isDefault && onSetDefault && (
                  <TouchableOpacity
                    onPress={() => {
                      setShow(false);
                      onSetDefault();
                    }}
                    style={{paddingVertical: 10}}>
                    <Text fontType={'roboto'} medium color={'#000'} style={{fontSize: 14}}>{t('accounts.set_as_default')}</Text>
                  </TouchableOpacity>
                )}
                {showDelete && onDelete && (
                  <TouchableOpacity
                    onPress={() => {
                      setShow(false);
                      onDelete();
                    }}
                    style={{paddingVertical: 10}}>
                    <Text fontType={'roboto'} medium color={'#cc0000'} style={{fontSize: 14}}>{t('accounts.delete')}</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </>
      )}
    </View>
  );
};

export default PayoutBox;
