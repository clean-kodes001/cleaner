import {createAsyncThunk} from '@reduxjs/toolkit';
import {Client} from '../../../config/client';
import {processSuccessMessage} from '../../../utils/processSuccessMessage';

import {proccessErrorMessage} from '../../../utils/proccessErrorMessage';
import {CLEAN} from '../../../config/apis';
import {logHelper} from '../../../utils/logHelper';

export const arrive = createAsyncThunk(
  'user/arrive',
  async ({payload, navigation}) => {
    try {
      const {
        data: {clean},
      } = await Client({
        method: 'PUT',
        path: `${CLEAN}/${payload.id}`,
        data: payload,
      });
      return clean;
    } catch (error) {
      throw error;
    }
  },
);
