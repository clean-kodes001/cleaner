import {
  Keyboard,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import React, {useRef} from 'react';
const KeyboardAvoidingView = ({children, scrollToEnd, style, ...props}) => {
  const scrollView = useRef();

  return (
    <RNKeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 10}
      style={[styles.container, style]}>
      <TouchableWithoutFeedback
        onPress={() => {
          scrollToEnd && scrollView.current.scrollToEnd({animated: true});
          Keyboard.dismiss();
        }}
        style={styles.container}>
        <ScrollView
          ref={scrollView}
          onContentSizeChange={() =>
            scrollToEnd && scrollView.current.scrollToEnd({animated: true})
          }
          showsVerticalScrollIndicator={false}
          style={styles.container}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
          {...props}>
          {children}
        </ScrollView>
      </TouchableWithoutFeedback>
    </RNKeyboardAvoidingView>
  );
};

export default KeyboardAvoidingView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
