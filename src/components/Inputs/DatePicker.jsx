import React, {useState, useEffect, useCallback} from 'react';
import {View, Platform, StyleSheet, TouchableOpacity, Modal} from 'react-native';
import Text from '../Shared/Text';

import DateTimePicker from '@react-native-community/datetimepicker';
import timeformatter from '../../utils/timeformatter';
import {
  parseDateOnly,
  formatDateOnly,
  parseTimeOnly,
} from '../../utils/dateOnly';
import {useTranslation} from 'react-i18next';

const Datepicker = ({
  mode = 'date',
  custom,
  label,
  placeholder,
  borderError,
  maximumDate,
  style,
  hideError,
  mt,
  fullWidth,
  disabled,
  width,
  value,
  onChangeText,
  error,
}) => {
  const {t} = useTranslation();
  const resolve = useCallback(
    v => (mode === 'time' ? parseTimeOnly(v) : parseDateOnly(v)),
    [mode],
  );

  const [date, setDate] = useState(() => resolve(value));

  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState(() => resolve(value) || new Date());

  // Keep the displayed date in sync when the form value changes externally
  // (prefilled onboarding data, restored saved data, or a programmatic reset),
  // so the field reflects the current value instead of stale local state.
  // resolve() is the exact inverse of what commit() emits, so re-running this
  // straight after a commit is a no-op rather than a one-day shift.
  useEffect(() => {
    setDate(resolve(value));
  }, [value, resolve]);

  const commit = selectedDate => {
    onChangeText(
      mode === 'time'
        ? timeformatter(selectedDate, 'time24')
        : formatDateOnly(selectedDate),
    );
    setDate(selectedDate);
  };

  const onChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShow(false);
      if (event.type === 'set' && selectedDate) {
        commit(selectedDate);
      }
      return;
    }
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const showDatePicker = () => {
    if (!show) {
      setTempDate(date || new Date());
    }
    setShow(prev => !prev);
  };

  const confirmIosDate = () => {
    commit(tempDate);
    setShow(false);
  };

  return (
    <View
      style={{
        marginTop: mt || 12,
        display: 'flex',
        width: fullWidth ? '100%' : width ? width : '47%',
      }}>
      {label && (
        <Text
          fontType={'Roboto'}
          medium
          style={{fontSize: 12, marginBottom: 3}}>
          {label}
        </Text>
      )}
      <View>
        <TouchableOpacity
          disabled={disabled}
          onPress={showDatePicker}
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: 8,
              padding: 15,
              borderColor:
                show && Platform.OS === 'ios'
                  ? '#000'
                  : custom
                  ? '#211c5b'
                  : '#CFD3D4',
              // borderColor: custom ? '#211c5b' : autoFucus ? '#000' : '#CFD3D4',
            },
            styles(show).inputContainer,
            borderError ? styles().borderErrorStyle : '',

            style,
          ]}>
          {show && Platform.OS === 'ios' ? (
            <Text color={'#fff'} center style={{width: '100%'}}>
              {t('common.close')}
            </Text>
          ) : (
            <Text center color={'#828282'}>
              {date
                ? mode === 'time'
                  ? timeformatter(date, 'time_only')
                  : formatDateOnly(date)
                : placeholder}
            </Text>
          )}
        </TouchableOpacity>

        {show && Platform.OS === 'ios' && (
          <Modal
            transparent
            animationType="slide"
            visible={show}
            onRequestClose={() => setShow(false)}>
            <View style={styles().modalOverlay}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => setShow(false)}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles().modalSheet}>
                <TouchableOpacity
                  onPress={confirmIosDate}
                  style={styles().modalDoneBtn}>
                  <Text color={'#122466'} medium>
                    {t('common.close')}
                  </Text>
                </TouchableOpacity>
                <DateTimePicker
                  textColor={'black'}
                  maximumDate={maximumDate}
                  testID="dateTimePicker"
                  display={'spinner'}
                  value={tempDate}
                  mode={mode}
                  is24Hour={true}
                  onChange={onChange}
                  style={styles().iosPicker}
                />
              </View>
            </View>
          </Modal>
        )}
        {show && Platform.OS === 'android' && (
          <DateTimePicker
            textColor={'black'}
            maximumDate={maximumDate}
            testID="dateTimePicker"
            display={'spinner'}
            value={date || new Date()}
            mode={mode}
            is24Hour={true}
            onChange={onChange}
          />
        )}
      </View>

      {!hideError && error && (
        <Text
          notCapitalized
          fontType={'roboto'}
          style={{
            marginTop: 2,
            marginLeft: 4,
            fontSize: 12,
            color: 'red',
          }}>
          {error}
        </Text>
      )}
    </View>
  );
};

export default Datepicker;

const styles = show =>
  StyleSheet.create({
    inputContainer: {
      paddingRight: 14,
      paddingLeft: 14,
      width: '100%',
      borderRadius: 8,
      height: 52,
      borderWidth: 0.8,

      backgroundColor:
        show && Platform.OS === 'ios' ? '#122466' : 'transparent',
    },
    borderErrorStyle: {
      borderWidth: 2,
      borderColor: 'red',
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalSheet: {
      backgroundColor: '#fff',
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingBottom: 24,
    },
    modalDoneBtn: {
      alignSelf: 'flex-end',
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    iosPicker: {
      height: 216,
      width: '100%',
    },
  });
