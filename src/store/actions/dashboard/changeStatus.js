import {createAsyncThunk} from '@reduxjs/toolkit';
import {ONLINE} from '../../../config/apis';
import {Client} from '../../../config/client';

export const changeStatus = createAsyncThunk(
  'user/changeStatus',
  async ({data, cb}) => {
    try {
      const {
        data: {user},
      } = await Client({
        method: 'POST',
        path: ONLINE,
        data: data,
      });
      console.log('✅ changeStatus SUCCESS:', {
        userId: user?.id,
        online: user?.online,
        current_position: data?.current_position,
      });
      if (cb) cb();
      return user;
    } catch (error) {
      console.warn('changeStatus error:', error);
    }
  },
);
