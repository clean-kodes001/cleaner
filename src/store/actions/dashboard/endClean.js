import {createAsyncThunk} from '@reduxjs/toolkit';
import {processSuccessMessage} from '../../../utils/processSuccessMessage';
import {Client} from '../../../config/client';
import {CLEAN} from '../../../config/apis';
import i18n from '../../../i18n/i18n';

export const endClean = createAsyncThunk(
  'user/endClean',
  async ({payload, navigation}) => {
    try {
      const data = await Client({
        method: 'PUT',
        path: `${CLEAN}/${payload.id}`,
        data: payload,
      });
      processSuccessMessage(i18n.t('toasts.clean_completed'));
      if (navigation) {
        navigation.navigate('rate', {
          id: payload?.id,
          status: 7,
        });
      }
      return {};
    } catch (error) {
      throw error;
    }
  },
);
