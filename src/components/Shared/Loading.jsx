import React from 'react';
import {View} from 'react-native';
import LottieView from 'lottie-react-native';

const Loading = () => {
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        backgroundColor: 'rgba(255, 255, 255, 1)',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <LottieView
        source={require('../../assets/animations/swipeklin_loader.json')}
        autoPlay
        loop
        style={{height: 256, width: 256}}
      />
    </View>
  );
};

export default Loading;
