import {createAsyncThunk} from '@reduxjs/toolkit';
import {Client} from '../../../config/client';
import {processSuccessMessage} from '../../../utils/processSuccessMessage';

import {proccessErrorMessage} from '../../../utils/proccessErrorMessage';
import {CLEAN} from '../../../config/apis';
import {logHelper} from '../../../utils/logHelper';
import {getClean} from './getClean';
import {resetCleanRequest} from '../../reducer/userSlice';

export const acceptClean = createAsyncThunk(
  'user/acceptClean',
  async ({payload, navigation}, {dispatch}) => {
    try {
      const response = await Client({
        method: 'POST',
        path: `${CLEAN}/${payload.id}`,
        data: {status: 1},
      });

      return response.data.clean;
    } catch (error) {
      if (
        error?.response?.data?.message ===
          'Cleaning service request already accepted or rejected!' ||
        error?.message ===
          'Cleaning service request already accepted or rejected!' ||
        error === 'Cleaning service request already accepted or rejected!'
      ) {
        dispatch(getClean());
      } else {
        dispatch(resetCleanRequest());
      }
      throw error;
    }
  },
);
