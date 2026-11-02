import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import Text from '../Shared/Text';
import {Picker} from '@react-native-picker/picker';
import AntDesign from '@react-native-vector-icons/ant-design';
import SelectDropdown from 'react-native-select-dropdown';

const Select = ({
  label,
  mt,
  error,
  hideError,
  value,
  borderError,
  list,
  placeholder,
  disabled,
  onValueChange,
  custom,
  onBlur,
  pickerRef,
}) => {
  const [showIOSSelect, setShowIOSSelect] = useState(false);

  const renderItems = item => {
    const {name, id} = item;

    return (
      <Picker.Item
        key={id}
        label={name}
        value={id}

        // style={{backgroundColor: 'cyan', color: 'red'}}
      />
    );
  };
  const ref = useRef();

  useEffect(() => {
    if (ref?.current) {
      ref.current.reset();
    }
  }, [value]);

  return (
    <View
      style={{
        marginTop: mt || 12,
        display: 'flex',
        flex: 1,
      }}>
      {label && (
        <Text
          fontType={'Roboto'}
          medium
          style={{fontSize: 12, marginBottom: 3}}>
          {label}
        </Text>
      )}
      <SelectDropdown
        disabled={disabled}
        defaultValue={value}
        data={list}
        onSelect={(selectedItem, index) => {
          onValueChange(selectedItem.name, selectedItem.id);
        }}
        renderDropdownIcon={() => (
          <AntDesign
            name="caret-down"
            size={12}
            color={custom ? '#262068' : '#BDBDBD'}
          />
        )}
        buttonStyle={[
          styles.select,
          {borderColor: borderError ? 'red' : custom ? '#211c5b' : '#CFD3D4'},
        ]}
        ref={ref}
        buttonTextStyle={styles.selectText}
        defaultButtonText={value?.name || value}
        buttonTextAfterSelection={(selectedItem, index) => {
          // text represented after item is selected
          // if data array is an array of objects then return selectedItem.property to render after item is selected
          return selectedItem.name;
        }}
        rowTextForSelection={(item, index) => {
          // text represented for each item in dropdown
          // if data array is an array of objects then return item.property to represent item in dropdown
          return item.name;
        }}
      />
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

export default Select;

const styles = StyleSheet.create({
  select: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 8,
    height: 52,
    width: '100%',
    backgroundColor: 'transparent',
    // borderColor: '#CFD3D4',
  },
  selectIOS: {
    fontSize: 25,
    color: 'red',
    textAlign: 'left',
    fontWeight: 'bold',
    backgroundColor: 'transparent',
  },
  selectText: {
    color: '#323232',
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
  },
});
