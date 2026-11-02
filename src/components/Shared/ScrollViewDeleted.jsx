import React from 'react';
import {RefreshControl, ScrollView} from 'react-native';

const CustomScrollView = ({styles, children, canRefresh, onRefresh}) => {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles}
      refreshControl={
        <RefreshControl onRefresh={onRefresh} enabled={canRefresh} />
      }>
      {children}
    </ScrollView>
  );
};

export default CustomScrollView;
