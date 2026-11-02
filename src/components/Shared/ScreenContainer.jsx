import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

function ScreenContainer({style, color, children, edges = ['top', 'bottom']}) {
  const insets = useSafeAreaInsets();
  
  // Calculate padding based on which edges should be safe
  const safeAreaStyle = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };

  return (
    <View style={[styles(color).container, safeAreaStyle, style || {}]}>
      {children}
    </View>
  );
}

const styles = color =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: color,
    },
  });

export default ScreenContainer;
