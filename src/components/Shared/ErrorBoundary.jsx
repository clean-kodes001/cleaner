import React, {Component} from 'react';
import {View, StyleSheet} from 'react-native';
import Text from './Text';
import {colors} from '../../config/colors';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {hasError: false};
  }

  static getDerivedStateFromError() {
    return {hasError: true};
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled app error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({hasError: false});
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text fontType={'roboto'} bold style={styles.title}>
            Something went wrong
          </Text>
          <Text fontType={'roboto'} style={styles.message}>
            Please try again. If this keeps happening, contact support.
          </Text>
          <Text
            onPress={this.handleRetry}
            fontType={'roboto'}
            bold
            style={styles.retry}>
            Try Again
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    color: colors.textBlack,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: colors.grayText,
    textAlign: 'center',
    marginBottom: 20,
  },
  retry: {
    fontSize: 16,
    color: colors.primary,
  },
});
