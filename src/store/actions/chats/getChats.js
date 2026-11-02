import {createAsyncThunk} from '@reduxjs/toolkit';
import {CHAT} from '../../../config/apis';
import {Client} from '../../../config/client';
import {logHelper} from '../../../utils/logHelper';

export const getChat = createAsyncThunk('user/getChat', async () => {
  try {
    const {
      data: {clean},
    } = await Client({
      method: 'GET',
      path: CHAT,
    });

    return clean?.clean?.chats?.reverse();
  } catch (error) {
    throw error;
  }
});
