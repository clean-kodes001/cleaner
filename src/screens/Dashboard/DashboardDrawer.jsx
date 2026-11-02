import React from 'react';
import {createDrawerNavigator} from '@react-navigation/drawer';
import Home from './Home';
import ProfileScreen from '../Profile/ProfileScreen';

import {NavigationContainer} from '@react-navigation/native';
import UpdateDocumnets from '../Profile/UpdateDocuments';

const Drawer = createDrawerNavigator();

const Dashboard = ({navigation}) => {
  return (
    // <NavigationContainer>
    // </NavigationContainer>
    (<Drawer.Navigator
      screenOptions={{headerShown: false}}
      initialRouteName="Home">
      <Drawer.Screen name="Home" component={Home} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
      <Drawer.Screen name="Validation Documents" component={UpdateDocumnets} />
    </Drawer.Navigator>)
  );
};

export default Dashboard;
