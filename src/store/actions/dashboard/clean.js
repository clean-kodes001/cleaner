import {createAsyncThunk} from '@reduxjs/toolkit';
import {CLEAN} from '../../../config/apis';
import {Client} from '../../../config/client';
import {proccessErrorMessage} from '../../../utils/proccessErrorMessage';

export const clean = createAsyncThunk('user/clean', async data => {
  try {
    const {
      data: {clean},
    } = await Client({
      method: 'GET',
      path: CLEAN,
      data: data,
    });

    return clean;
  } catch (error) {
    throw error;
  }
});
