import React, {useState} from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import {useTranslation} from 'react-i18next';
import Text from '../Shared/Text';
import {colors} from '../../config/colors';

// Two rows on a typical phone (4 per row at 72px). Everything beyond this stays
// one tap away behind the toggle — never dropped.
const COLLAPSED_COUNT = 8;

const PropertyImageStrip = ({
  serverImages = [],
  uploads,
  onPressServerImage,
  onRetry,
}) => {
  const {t} = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const pending = Object.values(uploads || {});

  if (!serverImages.length && !pending.length) {
    return <></>;
  }

  const reasonFor = entry =>
    entry.reasonText || (entry.reasonKey ? t(entry.reasonKey) : null);

  const captionFor = entry => {
    if (entry.status === 'uploading') {
      return t('cleanDetails.photo_uploading');
    }
    return entry.status === 'failed'
      ? t('cleanDetails.photo_retry')
      : t('cleanDetails.photo_retake');
  };

  const unfinishedCount = pending.filter(
    entry => entry.status !== 'uploading',
  ).length;

  // The grid sits inside a bottom sheet, so 20 photos would bury the room
  // details. Nothing is ever dropped: confirmed photos collapse to the first
  // two rows behind a toggle, and pending/failed entries are always rendered
  // because they are the actionable ones.
  const collapsible = serverImages.length > COLLAPSED_COUNT;
  const visibleServerImages =
    collapsible && !expanded
      ? serverImages.slice(0, COLLAPSED_COUNT)
      : serverImages;

  return (
    <View style={styles.wrap}>
      <Text fontType={'roboto'} style={styles.count} color={'#525354'}>
        {t('cleanDetails.photos_uploaded_count', {count: serverImages.length})}
        {unfinishedCount > 0
          ? ` · ${t('cleanDetails.photos_not_uploaded_count', {
              count: unfinishedCount,
            })}`
          : ''}
      </Text>
      <View style={styles.grid}>
        {visibleServerImages.map((uri, index) => (
          <TouchableOpacity
            key={uri}
            onPress={() => onPressServerImage(index)}
            style={styles.cell}>
            <Image source={{uri}} style={styles.thumb} />
          </TouchableOpacity>
        ))}

        {pending.map(entry => (
          <View key={entry.localId} style={styles.cell}>
            <TouchableOpacity
              disabled={entry.status !== 'failed'}
              onPress={() => onRetry(entry)}>
              <Image
                source={{uri: entry.uri}}
                style={[styles.thumb, styles.thumbMuted]}
              />
              <View style={styles.overlay}>
                {entry.status === 'uploading' ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <MaterialCommunityIcons
                    name={
                      entry.status === 'failed'
                        ? 'reload'
                        : 'camera-off-outline'
                    }
                    size={22}
                    color={
                      entry.status === 'failed' ? colors.orangeDark : '#525354'
                    }
                  />
                )}
              </View>
            </TouchableOpacity>
            <Text
              fontType={'roboto'}
              style={styles.caption}
              color={entry.status === 'failed' ? colors.orangeDark : '#525354'}>
              {captionFor(entry)}
            </Text>
            {entry.status !== 'uploading' && reasonFor(entry) ? (
              <Text fontType={'roboto'} style={styles.reason} color={'#525354'}>
                {reasonFor(entry)}
              </Text>
            ) : null}
          </View>
        ))}
      </View>

      {collapsible ? (
        <TouchableOpacity
          onPress={() => setExpanded(current => !current)}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Text fontType={'roboto'} semibold style={styles.toggle} color={colors.primary}>
            {expanded
              ? t('cleanDetails.photos_show_less')
              : t('cleanDetails.photos_show_all', {
                  count: serverImages.length,
                })}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export default PropertyImageStrip;

const styles = StyleSheet.create({
  wrap: {
    marginTop: 4,
    gap: 8,
  },
  count: {
    fontSize: 12,
  },
  // Wraps rather than scrolls horizontally: every photo has to be visible at a
  // glance, and a horizontal scroller nested in the BottomSheetScrollView fights
  // the sheet's own pan gesture.
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'flex-start',
  },
  cell: {
    width: 72,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: colors.borderColor,
  },
  toggle: {
    fontSize: 13,
    paddingVertical: 2,
  },
  thumbMuted: {
    opacity: 0.35,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  caption: {
    fontSize: 12,
    marginTop: 4,
  },
  reason: {
    fontSize: 10,
    marginTop: 2,
  },
});
