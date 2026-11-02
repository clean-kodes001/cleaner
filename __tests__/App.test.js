import 'react-native';
import React from 'react';
import renderer, {act} from 'react-test-renderer';

jest.mock('../src/config/routes', () => ({
  Routes: () => null,
}));

import App from '../App';

it('renders correctly', () => {
  let tree;
  act(() => {
    tree = renderer.create(<App />);
  });
  act(() => {
    tree.unmount();
  });
});
