import {createAsyncThunk} from '@reduxjs/toolkit';
import {CLEAN} from '../../../config/apis';
import {Client} from '../../../config/client';

export const cancelClean = createAsyncThunk(
  'user/cancelClean',
  async ({payload, navigation}) => {
    try {
      const data = await Client({
        method: 'PUT',
        path: `${CLEAN}/${payload.id}`,
        data: payload,
      });
      return {};
    } catch (error) {
      throw error;
    }
  },
);
