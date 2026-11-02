import React from 'react';
import Text from '../../components/Shared/Text';
import ScreenContainer from '../../components/Shared/ScreenContainer';
import {useTranslation} from 'react-i18next';

const Chats = () => {
  const {t} = useTranslation();
  return (
    <ScreenContainer style={{flex: 1, justifyContent: 'center'}}>
      <Text center>{t('cleanerDashboard.chats_in_development')}</Text>
    </ScreenContainer>
  );
};

export default Chats;
