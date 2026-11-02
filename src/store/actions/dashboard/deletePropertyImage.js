import {createAsyncThunk} from '@reduxjs/toolkit';
import {PROPERTY_IMAGES} from '../../../config/apis';
import {Client} from '../../../config/client';
import {processSuccessMessage} from '../../../utils/processSuccessMessage';
import i18n from '../../../i18n/i18n';

export const deletePropertyImage = createAsyncThunk(
  'user/deletePropertyImage',
  async ({payload, cb}) => {
    try {
      const {
        data: {clean},
      } = await Client({
        method: 'POST',
        path: PROPERTY_IMAGES,
        data: payload,
        contentType: 'multipart/form-data',
      });
      cb();
      processSuccessMessage(i18n.t('toasts.image_deleted'));

      return clean;
    } catch (error) {
      throw error;
    }
  },
);
