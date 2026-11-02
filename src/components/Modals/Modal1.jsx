import React from 'react';
import {Pressable, View} from 'react-native';
import Button from '../Shared/Button';

const Modal1 = ({children, setShowModal, style}) => {
  return (
    <>
      <Pressable
        onPress={() => setShowModal(false)}
        style={{
          backgroundColor: 'rgba(0,0,0,0.3)',
          position: 'absolute',
          bottom: 0,
          top: 0,
          height: '100%',
          width: '100%',
        }}></Pressable>
      <View
        style={{
          backgroundColor: '#fff',
          position: 'absolute',
          bottom: 70,

          width: '90%',
          marginHorizontal: '5%',

          borderRadius: 16,
          height: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          ...style,
        }}>
        {children}
      </View>
    </>
  );
};

export default Modal1;
