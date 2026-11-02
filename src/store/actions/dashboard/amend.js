import {createAsyncThunk} from '@reduxjs/toolkit';
import {Client} from '../../../config/client';
import {processSuccessMessage} from '../../../utils/processSuccessMessage';
import {proccessErrorMessage} from '../../../utils/proccessErrorMessage';
import {AMEND_CLEAN, CLEAN} from '../../../config/apis';
import {logHelper} from '../../../utils/logHelper';
import i18n from '../../../i18n/i18n';

export const amend = createAsyncThunk(
  'user/amend',
  async ({data, navigation}) => {
    try {
      const {
        data: {clean},
      } = await Client({
        method: 'POST',
        path: AMEND_CLEAN,
        data: data,
      });

      processSuccessMessage(i18n.t('toasts.amend_sent_review'));
      if (navigation) {
        navigation.goBack();
      }
      return clean;
    } catch (error) {
      throw error;
    }
  },
);
