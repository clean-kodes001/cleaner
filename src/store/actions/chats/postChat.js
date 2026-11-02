import {createAsyncThunk} from '@reduxjs/toolkit';
import {CHAT} from '../../../config/apis';
import {Client} from '../../../config/client';

export const postChat = createAsyncThunk(
  'user/postChat',
  async ({payload, image, callBack}) => {
    try {
      if (image) {
        const formData = new FormData();
        formData.append('image', image);
        await Client({
          method: 'POST',
          path: CHAT,
          data: formData,
          contentType: 'multipart/form-data',
          processError: false,
        });
        return;
      }

      const response = await Client({
        method: 'POST',
        path: CHAT,
        data: payload,
        processError: false,
      });

      return;
    } catch (error) {
      throw error;
    }
  },
);
