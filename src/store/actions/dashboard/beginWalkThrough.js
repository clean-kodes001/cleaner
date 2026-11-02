import {createAsyncThunk} from '@reduxjs/toolkit';
import {PROFILE, PROFILE_DOCUMENT, PROPERTY_IMAGES} from '../../../config/apis';
import {Client} from '../../../config/client';
import {processSuccessMessage} from '../../../utils/processSuccessMessage';
import {proccessErrorMessage} from '../../../utils/proccessErrorMessage';

export const beginWalkThrough = createAsyncThunk(
  'user/beginWalkThrough',
  async payload => {
    const {navigation, data, type} = payload;
    try {
      const {
        data: {clean},
      } = await Client({
        method: 'POST',
        path: PROPERTY_IMAGES,
        data: data,
        contentType: 'multipart/form-data',
      });

      // navigation.goBack();
      return clean;
    } catch (error) {
      throw error;
    }
  },
);
