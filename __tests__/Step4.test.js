import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {rootReducer} from '../src/store/rootReducer';
import Step4 from '../src/screens/Profile/Step4';

// react-native-device-info's NativeEventEmitter setup requires a real native
// module that isn't present under jest; rootReducer pulls it in transitively
// via src/config/client.js.
jest.mock('react-native-device-info', () => ({
  getDeviceName: jest.fn().mockResolvedValue('Test Device'),
  getVersion: jest.fn().mockReturnValue('1.0.0'),
}));

// The real picker pulls in react-native-document-picker / -image-picker
// (native modules jest can't resolve) and isn't what this test is checking —
// it asserts on the props Step4 *computes* for each of the 7 document
// sections, not the native picker's own behavior.
jest.mock('../src/components/Inputs/DocumentPicker', () => props =>
  require('react').createElement('DocumentPickerStub', props));

// StepsTopbar calls useNavigation(), which needs a real NavigationContainer;
// it's just the step-progress header, unrelated to the per-document status
// logic under test.
jest.mock('../src/components/Shared/StepsBar', () => 'StepsTopbar');

const DOCUMENT_LINK_KEYS = [
  'driver_license_front_link',
  'driver_license_back_link',
  'valid_id_front_link',
  'valid_id_back_link',
  'insurance_link',
  'police_check_link',
  'vulnurability_link',
];
// Render order in Step4.jsx's DOCUMENT_FIELDS — index 5 is the police-check picker.
const POLICE_CHECK_INDEX = 5;

const allDocumentLinks = () =>
  Object.fromEntries(DOCUMENT_LINK_KEYS.map(key => [key, `https://example.com/${key}`]));

const buildStore = ({requiredDocumentFields} = {}) =>
  configureStore({
    reducer: rootReducer,
    preloadedState: {
      user: {
        user: {
          id: '1',
          document: allDocumentLinks(),
        },
        onboardingStatus: {
          onboarding_status: {
            needs_update: true,
            document_upload: true,
            bio_data: false,
            required_document_fields: requiredDocumentFields,
          },
          document_data: allDocumentLinks(),
        },
      },
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({immutableCheck: false, serializableCheck: false}),
  });

const navigation = {navigate: jest.fn(), reset: jest.fn()};

const safeAreaMetrics = {
  frame: {x: 0, y: 0, width: 390, height: 844},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const renderStep4 = store => {
  let tree;
  act(() => {
    tree = renderer.create(
      <SafeAreaProvider initialMetrics={safeAreaMetrics}>
        <Provider store={store}>
          <Step4 navigation={navigation} route={{}} />
        </Provider>
      </SafeAreaProvider>,
    );
  });
  return tree;
};

describe('Step4 document re-upload status (regression test for BUG-1003)', () => {
  it('flags only the admin-flagged document as needing upload, not all seven', () => {
    const store = buildStore({requiredDocumentFields: ['police_check']});
    const tree = renderStep4(store);

    const pickers = tree.root.findAllByType('DocumentPickerStub');
    expect(pickers).toHaveLength(7);

    pickers.forEach((picker, index) => {
      if (index === POLICE_CHECK_INDEX) {
        expect(picker.props.disabled).toBe(false);
        expect(picker.props.documentUrl).toBeNull();
        expect(picker.props.error).toBeTruthy();
      } else {
        expect(picker.props.disabled).toBe(true);
        expect(picker.props.documentUrl).toEqual(expect.any(String));
        expect(picker.props.error).toBeFalsy();
      }
    });

    act(() => {
      tree.unmount();
    });
  });

  it('falls back to treating all seven documents as unsatisfied when flagged with no stored field list (legacy NIGO)', () => {
    const store = buildStore({requiredDocumentFields: undefined});
    const tree = renderStep4(store);

    const pickers = tree.root.findAllByType('DocumentPickerStub');
    expect(pickers).toHaveLength(7);

    pickers.forEach(picker => {
      expect(picker.props.documentUrl).toBeNull();
      expect(picker.props.disabled).toBe(false);
    });

    act(() => {
      tree.unmount();
    });
  });
});
