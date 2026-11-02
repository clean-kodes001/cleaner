import React, {useEffect, useState} from 'react';
import {Modal, StyleSheet, View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import Text from '../Shared/Text';
import Button from '../Shared/Button';
import {colors} from '../../config/colors';
import {MONITORED_STATUSES} from '../../screens/Dashboard/ActiveCleanWrapper';

export const DISCLOSURE_KEY = 'job_site_monitoring_disclosure_ack';

/**
 * One-time notice, shown the first time a cleaner reaches an active job after upgrading.
 *
 * Acknowledgement is a single button and blocks nothing beyond itself — it exists so the
 * collection is disclosed before it starts, not to gate the job.
 */
const JobSiteDisclosure = () => {
  const {t} = useTranslation();
  const [visible, setVisible] = useState(false);

  const acceptedCleanRequest = useSelector(
    state => state.user.acceptedCleanRequest,
  );
  const config = useSelector(state => state.user.monitoringConfig);

  const status = acceptedCleanRequest?.status;
  const active = MONITORED_STATUSES.includes(status) && config?.enabled !== false;

  useEffect(() => {
    let cancelled = false;

    if (!active) {
      setVisible(false);
      return;
    }

    AsyncStorage.getItem(DISCLOSURE_KEY)
      .then(value => {
        if (!cancelled && !value) {
          setVisible(true);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [active]);

  const acknowledge = () => {
    setVisible(false);
    AsyncStorage.setItem(DISCLOSURE_KEY, new Date().toISOString()).catch(
      () => {},
    );
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={acknowledge}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text fontType={'roboto'} style={styles.title}>
            {t('cleanerDashboard.monitoring_disclosure_title')}
          </Text>
          <Text fontType={'roboto'} style={styles.body}>
            {t('cleanerDashboard.monitoring_disclosure_body')}
          </Text>
          <Button
            text={t('cleanerDashboard.monitoring_disclosure_accept')}
            pressed={acknowledge}
            height={48}
            style={styles.button}
          />
        </View>
      </View>
    </Modal>
  );
};

export default JobSiteDisclosure;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  body: {
    fontSize: 13,
    lineHeight: 20,
    color: '#525354',
    marginBottom: 20,
  },
  button: {
    width: '100%',
    backgroundColor: colors.brandGreen,
    borderRadius: 8,
  },
});
