import * as Yup from 'yup';
import {CANADIAN_PROVINCES} from './googlePlaces';
import i18n from '../i18n/i18n';

const t = key => i18n.t(`validation.${key}`);

const checkAddressProvinceMatch = (address, state) => {
  if (!address || !state?.name) return true;
  const addressLower = address.toLowerCase();
  const selectedName = state.name.toLowerCase();
  // Find the short code for the selected province (e.g. "ON" for Ontario)
  const selectedCode = CANADIAN_PROVINCES.find(
    p => p.name.toLowerCase() === selectedName,
  )?.id?.toLowerCase();
  const conflict = CANADIAN_PROVINCES.find(p => {
    const pName = p.name.toLowerCase();
    const pCode = p.id.toLowerCase();
    if (pName === selectedName) return false;
    // Match full name ("saskatchewan") or short code preceded by comma/space and end of string
    // e.g. ", SK" or " SK " or "SK" at end
    const shortCodePattern = new RegExp(`(?:,\\s*|\\s)${pCode}(?:\\s|,|$)`);
    return addressLower.includes(pName) || shortCodePattern.test(addressLower);
  });
  return !conflict;
};

export const _emailSchema = Yup.object().shape({
  email: Yup.string()
    .email(() => t('email_invalid'))
    // require a real TLD ('foo@gmail' rejected) and a single domain label
    // before it, so doubled/stacked TLDs like 'foo@gmail.co.com' are rejected too
    .matches(/^[^\s@]+@[^\s@.]+\.[A-Za-z]{3,}$/, {
      message: () => t('email_invalid'),
      excludeEmptyString: true,
    })
    .required(() => t('email_required')),
});
export const _step4Schema = Yup.object().shape({
  driver_license_front: Yup.mixed().required(() => t('required')),
  driver_license_back: Yup.mixed().required(() => t('required')),
  valid_id_front: Yup.mixed().required(() => t('required')),
  valid_id_back: Yup.mixed().required(() => t('required')),
  cleanerInsurance: Yup.mixed().required(() => t('required')),
  backgroundCheck: Yup.mixed().required(() => t('required')),
  vulnurability: Yup.mixed().required(() => t('required')),
});
export const _distanceSchema = Yup.object().shape({
  distance: Yup.string().required(() => t('required')),
});

// Individual field schemas for profile editing
export const _phoneEditSchema = Yup.object().shape({
  phone: Yup.string()
    .required(() => t('phone_required'))
    .test('regex test', () => t('phone_invalid'), val => {
      const regExp = /[a-zA-Z]/;
      return !regExp.test(val);
    })
    .test('empty string test', () => t('phone_empty'), val => {
      return val?.trim() !== '';
    }),
});

export const _emailEditSchema = Yup.object().shape({
  email: Yup.string()
    .email(() => t('email_invalid'))
    .required(() => t('email_required')),
});

export const _genderEditSchema = Yup.object().shape({
  gender: Yup.object().required(() => t('required')),
});

export const _nameEditSchema = Yup.object().shape({
  first_name: Yup.string().required(() => t('required')),
  last_name: Yup.string().required(() => t('required')),
});

export const _addressEditSchema = Yup.object().shape({
  country: Yup.object().required(() => t('required')),
  state: Yup.object().required(() => t('required')),
  city: Yup.object().required(() => t('required')),
  postal_code: Yup.string()
    .required(() => t('postal_code_required'))
    .test('canadian-postal-code', () => t('postal_code_invalid'), function(value) {
      if (!value || value.trim() === '') {
        return false;
      }
      const codeWithoutSpaces = value.trim().toUpperCase().replace(/\s/g, '');
      if (codeWithoutSpaces.length !== 6) {
        return false;
      }
      const canadianPostalCodeRegex = /^[ABCEGHJKLMNPRSTVXY][0-9][ABCEGHJKLMNPRSTVWXYZ][0-9][ABCEGHJKLMNPRSTVWXYZ][0-9]$/i;
      return canadianPostalCodeRegex.test(codeWithoutSpaces);
    }),
  address: Yup.string().required(() => t('required')),
});
export const _accountSchema = Yup.object().shape({
  account_holder_name: Yup.string().required(() => t('required')),
  account_number: Yup.string().required(() => t('required')),
  transit_code: Yup.string().required(() => t('required')),
  institution_number: Yup.string().required(() => t('required')),
  // name: Yup.string().required('Required'),
  // currency: Yup.mixed().required('Required'),
  // country: Yup.mixed().required('Required'),
});
export const _step3Schema = Yup.object().shape({
  phone: Yup.string()
    .required(() => t('phone_required'))
    .test('regex test', () => t('phone_invalid'), val => {
      const regExp = /[a-zA-Z]/;
      return !regExp.test(val);
    })

    .test('empty string test', () => t('phone_empty'), val => {
      return val.trim() !== '';
    }),
  first_name: Yup.string().required(() => t('required')),
  last_name: Yup.string().required(() => t('required')),

  dob: Yup.date().required(() => t('required')),
  country: Yup.object().required(() => t('required')),
  gender: Yup.object().required(() => t('required')),
  state: Yup.object().required(() => t('required')),
  city: Yup.object().required(() => t('required')),
  postal_code: Yup.string()
    .required(() => t('postal_code_required'))
    .test('canadian-postal-code', () => t('postal_code_invalid'), function(value) {
      if (!value || value.trim() === '') {
        return false;
      }
      // Canadian postal code regex: Letter-Number-Letter Number-Letter-Number
      // Format: A1A 1A1 or A1A1A1
      const codeWithoutSpaces = value.trim().toUpperCase().replace(/\s/g, '');
      if (codeWithoutSpaces.length !== 6) {
        return false;
      }
      // First letter cannot be: D, F, I, O, Q, U, W, Z
      const canadianPostalCodeRegex = /^[ABCEGHJKLMNPRSTVXY][0-9][ABCEGHJKLMNPRSTVWXYZ][0-9][ABCEGHJKLMNPRSTVWXYZ][0-9]$/i;
      return canadianPostalCodeRegex.test(codeWithoutSpaces);
    }),
  address: Yup.string()
    .required(() => t('required'))
    .test('province-match', () => t('address_province_mismatch'), function (address) {
      return checkAddressProvinceMatch(address, this.parent.state);
    }),
});
export const _supportSchema = Yup.object().shape({
  first_name: Yup.string().required(() => t('required')),
  last_name: Yup.string().required(() => t('required')),
  document: Yup.mixed().required(() => t('required')),
  dob: Yup.date().required(() => t('required')),
  gender: Yup.object().required(() => t('required')),
});
export const _loginSchema = Yup.object().shape({
  username: Yup.string()
    .email(() => t('email_invalid'))
    .required(() => t('email_required')),
  password: Yup.string()
    .required(() => t('password_required'))
    .min(8, () => t('password_min')),
});

export const _createPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .required(() => t('password_required'))
    .min(8, () => t('password_min')),
  password_confirmation: Yup.string()
    .when('password', (password, schema) => {
      if (password) return schema.required(() => t('confirm_password_required'));
    })
    .oneOf([Yup.ref('password')], () => t('passwords_match')),
});

export const _enterPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .required(() => t('password_required'))
    .min(8, () => t('password_min')),
});
