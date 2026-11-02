import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {rootReducer} from '../src/store/rootReducer';
import EditProfileInfomation from '../src/screens/Profile/EditProfileInfomation';

// useFocusEffect requires a NavigationContainer; it's a no-op in this screen
// (useFocusEffect(useCallback(() => {}, []))), so stub it rather than stand
// up a full navigator just for that.
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useFocusEffect: jest.fn(),
}));

// react-native-device-info's NativeEventEmitter setup requires a real native
// module that isn't present under jest; rootReducer pulls it in transitively
// via src/config/client.js.
jest.mock('react-native-device-info', () => ({
  getDeviceName: jest.fn().mockResolvedValue('Test Device'),
  getVersion: jest.fn().mockReturnValue('1.0.0'),
}));

// Ships untranspiled ESM (used by Select/SearchSelect, rendered by the
// 'address' itemID) and isn't covered by jest.config.js's
// transformIgnorePatterns allow-list.
jest.mock('react-native-select-dropdown', () => 'SelectDropdown');

// Native picker view, only exercised by the 'address' itemID's
// country/state/city selects and the (unreachable via navigation) 'dob'
// branch; not relevant to what this test is checking.
jest.mock('@react-native-picker/picker', () => {
    const React = require('react');
    const Picker = ({children}) => React.createElement('Picker', null, children);
    Picker.Item = () => null;
    return {Picker};
});

// Real Google Places network calls have no place in a render smoke test.
jest.mock('../src/components/Inputs/AddressAutocomplete', () => 'AddressAutocomplete');

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

const buildStore = () =>
  configureStore({
    reducer: rootReducer,
    preloadedState: {
      data: {
        unAuthenticated: {
          gender: [
            {id: 1, name: 'Male'},
            {id: 2, name: 'Female'},
          ],
          cities: [{id: 1, name: 'Regina', state_id: 1}],
          states: [{id: 1, name: 'Saskatchewan', country_id: 1}],
          countries: [{id: 1, name: 'Canada'}],
        },
      },
      user: {
        user: {
          id: '1',
          first_name: 'Local',
          last_name: 'Cleaner',
          email: 'local_cleaner@mailinator.com',
          phone: '4165040324',
          distance: '60',
          address: '44 Barr Street, Regina, SK, Canada',
          postal_code: 'S4R4A7',
          country_id: 1,
          state_id: 1,
          city_id: 1,
          gender_id: 1,
        },
      },
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({immutableCheck: false, serializableCheck: false}),
  });

const navigation = {navigate: jest.fn(), goBack: jest.fn()};

const safeAreaMetrics = {
  frame: {x: 0, y: 0, width: 390, height: 844},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const renderScreen = itemID => {
  let tree;
  act(() => {
    tree = renderer.create(
      <SafeAreaProvider initialMetrics={safeAreaMetrics}>
        <Provider store={buildStore()}>
          <EditProfileInfomation
            navigation={navigation}
            route={{params: {itemID, title: itemID}}}
          />
        </Provider>
      </SafeAreaProvider>,
    );
  });
  return tree;
};

describe('EditProfileInfomation', () => {
  it.each(['email', 'phone', 'address', 'distance'])(
    'renders the %s field without crashing (regression test for BUG-0012)',
    itemID => {
      const tree = renderScreen(itemID);
      expect(tree.toJSON()).toBeTruthy();
      act(() => {
        tree.unmount();
      });
    },
  );
});
