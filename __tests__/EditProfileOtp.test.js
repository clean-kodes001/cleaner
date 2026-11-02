import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {rootReducer} from '../src/store/rootReducer';
import {Client} from '../src/config/client';
import EditProfileOtp from '../src/screens/Profile/EditProfileOtp';

// The screen's only job is to collect four digits and resend the profile payload, so the
// real axios wrapper is replaced with a spy the assertions read the outgoing body off.
// The saved user is echoed back because the screen stays mounted under test (goBack is a
// spy, not a real pop) and re-renders against whatever the reducer stored.
jest.mock('../src/config/client', () => ({
  baseURL: 'https://example.test/api/app/',
  Client: jest.fn(() =>
    Promise.resolve({
      data: {user: {id: '1', email: 'new_address@mailinator.com'}},
    }),
  ),
}));

// Ships untranspiled ESM and isn't covered by jest.config.js's transformIgnorePatterns
// allow-list. Stubbed down to the one prop this test drives.
jest.mock('react-native-confirmation-code-field', () => {
  const React = require('react');
  return {
    CodeField: props => React.createElement('CodeField', props),
    Cursor: () => null,
    useBlurOnFulfill: () => ({current: null}),
    useClearByFocusCell: () => [{}, () => () => {}],
  };
});

jest.mock('react-native-device-info', () => ({
  getDeviceName: jest.fn().mockResolvedValue('Test Device'),
  getVersion: jest.fn().mockReturnValue('1.0.0'),
}));

const buildStore = distance =>
  configureStore({
    reducer: rootReducer,
    preloadedState: {
      user: {
        user: {
          id: '1',
          first_name: 'Local',
          last_name: 'Cleaner',
          other_name: '',
          email: 'local_cleaner@mailinator.com',
          phone: '4165040324',
          dob: '1990-01-01',
          gender_id: 1,
          distance,
          address: '44 Barr Street, Regina, SK, Canada',
          postal_code: 'S4R 4A7',
          country_id: 1,
          state_id: 1,
          city_id: 1,
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

// The email row is the cheapest way in: EditProfileInfomation hands this screen the whole
// form, and only the edited field differs from what's already on the account.
const securedData = {
  email: 'new_address@mailinator.com',
  phone: '4165040324',
  address: '44 Barr Street, Regina, SK, Canada',
  postal_code: 'S4R 4A7',
  country: {id: 1, name: 'Canada'},
  state: {id: 1, name: 'Saskatchewan'},
  city: {id: 1, name: 'Regina'},
};

const submitOtp = async distance => {
  let tree;
  await act(async () => {
    tree = renderer.create(
      <SafeAreaProvider initialMetrics={safeAreaMetrics}>
        <Provider store={buildStore(distance)}>
          <EditProfileOtp
            navigation={navigation}
            route={{params: {data: securedData}}}
          />
        </Provider>
      </SafeAreaProvider>,
    );
  });

  const codeField = tree.root.findByType('CodeField');
  await act(async () => {
    codeField.props.onChangeText('1234');
  });

  const body = Client.mock.calls.at(-1)[0].data;
  const parts = body.getParts
    ? body.getParts().map(part => [part.fieldName, part.string])
    : Array.from(body.entries());

  act(() => {
    tree.unmount();
  });

  return new Map(parts);
};

describe('EditProfileOtp', () => {
  beforeEach(() => {
    Client.mockClear();
  });

  // BUG-0027: FormData stringifies whatever it is handed, so an account with no work
  // radius on file used to post the literal "null"/"undefined". The backend rule is
  // nullable|integer|min:1, so a cleaner confirming an email change was told "The
  // distance field must be an integer" and the change never saved.
  it.each([
    ['null', null],
    ['undefined', undefined],
  ])('never posts a %s work radius as text', async (_label, distance) => {
    const sent = await submitOtp(distance);

    expect(sent.get('distance')).toBe('');
    expect(sent.get('email')).toBe('new_address@mailinator.com');
  });

  it('still posts a radius the account actually has', async () => {
    const sent = await submitOtp(60);

    expect(sent.get('distance')).toBe('60');
  });
});
