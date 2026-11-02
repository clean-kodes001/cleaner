import React from 'react';
import {RefreshControl, ScrollView} from 'react-native';

const CustomScrollView = ({styles, children, canRefresh, onRefresh}) => {
  const [refreshing, setRefreshing] = React.useState(false);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          enabled={canRefresh}
        />
      }>
      {children}
    </ScrollView>
  );
};

export default CustomScrollView;
