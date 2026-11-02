import React, {useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Home from './Home';
import {StyleSheet, View} from 'react-native';
import Octicons from '@react-native-vector-icons/octicons';
import Ionicons from '@react-native-vector-icons/ionicons';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import {colors} from '../../config/colors';
import Chats from './Chats';
import History from '../History/History';
import Payments from './Payment/Payments';
import {authenticated} from '../../store/actions/onboarding/authenticated';
import {useDispatch} from 'react-redux';
import ChatRoom from './Chat/ChatRoom';
import ActiveCleanWrapper from './ActiveCleanWrapper';
import ProfileScreen from '../Profile/ProfileScreen';

const Tab = createBottomTabNavigator();

const Dashboard = ({navigation}) => {
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // dispatch(authenticated());
  }, []);

  const homeRoutes = [
    {
      id: 1,
      name: 'Home',
      label: t('dashboard.tab_home'),
      component: Home,
      icon: ({style, size, color}) => (
        <Octicons name="home" size={18} color={color} />
      ),
    },
    {
      id: 2,
      name: 'Active Clean',
      label: t('dashboard.tab_active_clean'),
      component: ActiveCleanWrapper,
      icon: ({style, size, color}) => (
        <MaterialIcons name="notifications-active" size={24} color={color} />
        // <Ionicons name="chatbubble-outline" size={22} color={color} />
      ),
    },
    {
      id: 3,
      name: 'History',
      label: t('dashboard.tab_history'),
      component: History,
      icon: ({style, size, color}) => (
        <MaterialCommunityIcons name="history" size={24} color={color} />
      ),
    },
    {
      id: 4,
      name: 'Payments',
      label: t('dashboard.tab_payments'),
      component: Payments,
      icon: ({style, size, color}) => (
        <Octicons name="graph" size={18} color={color} />
      ),
    },
    {
      id: 5,
      name: 'Profile',
      label: t('dashboard.tab_profile'),
      component: ProfileScreen,
      icon: ({style, size, color}) => (
        <Octicons name="person" size={18} color={color} />
      ),
    },
  ];

  return (    <Tab.Navigator
      screenOptions={{
        tabBarStyle: styles(insets).bottomBar,

        tabBarHideOnKeyboard: true,
          tabBarLabelStyle: styles().title,
          headerTitleStyle: {
            color: 'red',
          },
          barIcon: {
            width: 24,
            height: 24,
            resizeMode: 'contain',
          },
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: '#77767A',
        }}>
        {homeRoutes.map(item => {
          return (
            <Tab.Screen
              options={{
                keyboardHidesTabBar: false,
                tabBarLabel: item.label,
                tabBarIcon: ({color, focused}) => (
                  <View style={styles(insets).imageContainerStyle}>
                    {item.icon({
                      color: color,
                    })}
                  </View>
                ),
              }}
              name={item.name}
              key={item.name}
              component={item.component}
              option={{keyboardHidesTabBar: false}}
            />
          );
        })}
      </Tab.Navigator>
  );
};

export default Dashboard;

const styles = (insets = {bottom: 0}) =>
  StyleSheet.create({
    barIcon: {
      width: 24,
      height: 24,
    },
    options: {
      fontSize: 14,
      lineHeight: 20,
    },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    bottomBar: {
      backgroundColor: '#fff',
      elevation: 0,
      position: 'absolute',
      bottom: 0,
      borderTopWidth: 1,
      borderTopColor: '#ccc',
      paddingTop: 7.5,
      paddingBottom: insets.bottom > 0 ? insets.bottom : 6.0,
      height: 60 + insets.bottom,
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageContainerStyle: {
      position: 'relative',
    },
    title: {
      fontWeight: '500',
      fontSize: 12,
      lineHeight: 20,
      letterSpacing: 0.1,
      marginBottom: 5,
    },
  });
