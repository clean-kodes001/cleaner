import {combineReducers} from '@reduxjs/toolkit';
import ui from './reducer/uiSlice';
import user from './reducer/userSlice';
import profile from './reducer/profileSlice';
import data from './reducer/dataSlice';
import chat from './reducer/chatSlice';
import history from './reducer/historySlice';
import log from './reducer/logSlice';
import notification from './reducer/notificationSlice';
import payment from './reducer/paymentSlice';

export const rootReducer = combineReducers({
  ui,
  user,
  profile,
  data,
  chat,
  history,
  log,
  notification,
  payment,
});
