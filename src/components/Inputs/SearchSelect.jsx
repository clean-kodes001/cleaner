import React, {useEffect, useRef} from 'react';
import {StyleSheet, View} from 'react-native';
import Text from '../Shared/Text';
import AntDesign from '@react-native-vector-icons/ant-design';
import SelectDropdown from 'react-native-select-dropdown';
import Ionicons from '@react-native-vector-icons/ionicons';

const SearchSelect = ({
  label,
  mt,
  error,
  hideError,
  value,
  list,
  disabled,
  onValueChange,
  custom,
  borderError,
}) => {
  const ref = useRef();

  useEffect(() => {
    if (ref?.current) {
      ref.current.reset();
    }
  }, [value]);

  const containerStyle = [styles.container, mt ? {marginTop: mt} : null];

  const buttonStyle = [
    styles.select,
    custom ? styles.selectCustomBorder : styles.selectDefaultBorder,
    borderError ? styles.selectErrorBorder : null,
  ];

  return (
    <View style={containerStyle}>
      {label && (
        <Text fontType={'Roboto'} medium style={styles.label}>
          {label}
        </Text>
      )}
      <SelectDropdown
        search={true}
        searchInputStyle={styles.searchInput}
        searchInputTxtStyle={styles.searchInputText}
        searchPlaceHolder="Search..."
        renderSearchInputLeftIcon={() => (
          <Ionicons name="search-outline" size={20} color="#211c5b" />
        )}
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
        buttonStyle={buttonStyle}
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
        <Text notCapitalized fontType={'roboto'} style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
};

export default SearchSelect;

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    display: 'flex',
    flex: 1,
  },
  label: {
    fontSize: 12,
    marginBottom: 3,
  },
  select: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: 8,
    height: 52,
    width: '100%',
    backgroundColor: 'transparent',
  },
  selectCustomBorder: {
    borderColor: '#211c5b',
  },
  selectDefaultBorder: {
    borderColor: '#CFD3D4',
  },
  selectErrorBorder: {
    borderColor: 'red',
  },
  selectText: {
    color: '#323232',
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CFD3D4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 8,
    marginTop: 8,
    width: 'fit-content',
  },
  searchInputText: {
    color: '#323232',
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
  },
  errorText: {
    marginTop: 2,
    marginLeft: 4,
    fontSize: 12,
    color: 'red',
  },
});
