import React from 'react';
import {StyleSheet, View} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import {useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import Text from '../Shared/Text';
import {getDistance} from 'geolib';
import {MONITORED_STATUSES} from '../../screens/Dashboard/ActiveCleanWrapper';

const DEFAULT_RADIUS_M = 100;
const ASSUMED_ACCURACY_M = 100;

/**
 * Warns the cleaner the moment they cross the monitoring boundary, so they can come back
 * before anything is recorded against them.
 *
 * Detection here is for the banner only — the server owns the flag decision and the
 * thresholds. Nothing this renders ever blocks a button.
 */
const JobSiteBanner = () => {
  const {t} = useTranslation();

  const acceptedCleanRequest = useSelector(
    state => state.user.acceptedCleanRequest,
  );
  const livePosition = useSelector(state => state.user.livePosition);
  const permissionState = useSelector(
    state => state.user.monitoring?.permissionState,
  );
  const config = useSelector(state => state.user.monitoringConfig);

  const status = acceptedCleanRequest?.status;

  if (config?.enabled === false) return null;
  if (!MONITORED_STATUSES.includes(status)) return null;

  if (permissionState === 'denied') {
    return (
      <View style={[styles.banner, styles.warn]}>
        <Ionicons
          name="location-outline"
          size={16}
          color="#8a6d3b"
          style={styles.icon}
        />
        <Text fontType={'roboto'} style={[styles.text, {color: '#8a6d3b'}]}>
          {t('cleanerDashboard.location_off_warning')}
        </Text>
      </View>
    );
  }

  const target = acceptedCleanRequest?.clean?.position;

  // No fix yet is not the same as being away. Staying silent here is deliberate: the very
  // first thing a cleaner sees on arriving must never be an accusation.
  if (!livePosition?.lat || !target?.lat || !target?.lng) return null;

  const distance = getDistance(
    {latitude: livePosition.lat, longitude: livePosition.lng},
    {latitude: target.lat, longitude: target.lng},
  );

  const radius = config?.radius_m ?? DEFAULT_RADIUS_M;
  const accuracy = livePosition.accuracy ?? ASSUMED_ACCURACY_M;

  // Same accuracy-aware comparison the server uses, so the banner and the flag can't
  // disagree about whether the cleaner is off site.
  if (distance - accuracy <= radius) return null;

  return (
    <View style={[styles.banner, styles.alert]}>
      <Ionicons
        name="alert-circle"
        size={16}
        color="#a94442"
        style={styles.icon}
      />
      <Text fontType={'roboto'} style={[styles.text, {color: '#a94442'}]}>
        {t('cleanerDashboard.left_job_site_warning')}
      </Text>
    </View>
  );
};

export default JobSiteBanner;

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginVertical: 8,
  },
  warn: {
    backgroundColor: '#FCF8E3',
  },
  alert: {
    backgroundColor: '#FFEBEE',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 12,
    flex: 1,
  },
});
