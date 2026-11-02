import React, {useCallback, useRef} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import BottomSheet, {BottomSheetModalProvider} from '@gorhom/bottom-sheet';

const BottomSelect = ({children, handleShowbottomSheet, snapPoints}) => {
  const handleSheetChanges = useCallback(index => {}, []);
  const bottomSheetRef = useRef();
  return (
    <GestureHandlerRootView
      style={{
        width: '100%',
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: '100%',
        zIndex: 10,
        backgroundColor: 'transparent',
      }}>
      <Pressable
        onPress={() => handleShowbottomSheet(false)}
        style={{
          backgroundColor: 'rgba(0,0,0,0.3)',
          position: 'absolute',
          bottom: 0,
          top: 0,
          height: '100%',
          width: '100%',
        }}></Pressable>
      <BottomSheetModalProvider>
        <BottomSheet
          enableDynamicSizing={false}
          //   onDismiss={() => handleShowbottomSheet(false)}
          enableDismissOnClose={true}
          ref={bottomSheetRef}
          // index={1}
          style={{backgroundColor: 'transparent'}}
          // snapPoints={snapPoints || [175, 175]}
          snapPoints={snapPoints || [175]}
          //   enablePanDownToClose={true}
          // backdropComponent={render}
          onChange={handleSheetChanges}>
          <View style={styles.inner}>{children}</View>
        </BottomSheet>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
};

export default BottomSelect;

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    height: 200,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});
