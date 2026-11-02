/**
 * Validates and formats postal codes for different countries
 * @param {string} postalCode - The postal code to validate
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code (e.g., 'CA', 'US', 'GB')
 * @param {boolean} useStrict - Use strict validation (default: true)
 * @returns {{isValid: boolean, error: string, formatted: string}} - Validation result
 */
export const validatePostalCode = (
  postalCode,
  countryCode = 'CA',
  useStrict = true,
) => {
  // Handle empty input
  if (!postalCode || postalCode.trim() === '') {
    return {
      isValid: false,
      error: 'Postal code is required',
      formatted: '',
    };
  }

  const normalizedCode = postalCode.trim().toUpperCase();
  const country = countryCode.toUpperCase();

  switch (country) {
    case 'CA':
      return validateCanadianPostalCode(normalizedCode, useStrict);
    case 'US':
      return validateUSZipCode(normalizedCode, useStrict);
    case 'GB':
    case 'UK':
      return validateUKPostcode(normalizedCode, useStrict);
    default:
      return {
        isValid: false,
        error: `Unsupported country code: ${countryCode}`,
        formatted: postalCode,
      };
  }
};

/**
 * Validates Canadian postal codes
 * Format: A1A 1A1 (strict) or A1A1A1 (lenient)
 * @param {string} postalCode - The postal code
 * @param {boolean} strict - Use strict validation
 * @returns {{isValid: boolean, error: string, formatted: string}}
 */
const validateCanadianPostalCode = (postalCode, strict = true) => {
  // Remove spaces for validation
  const codeWithoutSpaces = postalCode.replace(/\s/g, '');

  // Canadian postal code regex (strict)
  // Format: Letter-Number-Letter Number-Letter-Number
  // First letter cannot be: D, F, I, O, Q, U, W, Z
  const strictRegex =
    /^[ABCEGHJKLMNPRSTVXY][0-9][ABCEGHJKLMNPRSTVWXYZ]\s?[0-9][ABCEGHJKLMNPRSTVWXYZ][0-9]$/i;

  // Lenient regex (just basic format check)
  const lenientRegex = /^[A-Z][0-9][A-Z]\s?[0-9][A-Z][0-9]$/i;

  const regex = strict ? strictRegex : lenientRegex;

  if (!regex.test(postalCode)) {
    return {
      isValid: false,
      error: 'Please enter a valid Canadian postal code (e.g., A1A 1A1)',
      formatted: postalCode,
    };
  }

  // Format with space: A1A 1A1
  const formatted =
    codeWithoutSpaces.length === 6
      ? `${codeWithoutSpaces.slice(0, 3)} ${codeWithoutSpaces.slice(3)}`
      : postalCode;

  return {
    isValid: true,
    error: '',
    formatted: formatted.toUpperCase(),
  };
};

/**
 * Validates US ZIP codes
 * Format: 12345 or 12345-6789
 * @param {string} zipCode - The ZIP code
 * @param {boolean} strict - Use strict validation (requires 5 digits)
 * @returns {{isValid: boolean, error: string, formatted: string}}
 */
const validateUSZipCode = (zipCode, strict = true) => {
  // Remove spaces and hyphens
  const normalized = zipCode.replace(/[\s\-]/g, '');

  // ZIP+4 format: 12345-6789
  const zipPlus4Regex = /^[0-9]{5}-?[0-9]{4}$/;
  // Standard 5-digit ZIP
  const zip5Regex = /^[0-9]{5}$/;

  if (zip5Regex.test(normalized)) {
    return {
      isValid: true,
      error: '',
      formatted: normalized,
    };
  }

  if (!strict && zipPlus4Regex.test(zipCode)) {
    // Format with hyphen: 12345-6789
    const formatted =
      normalized.length === 9
        ? `${normalized.slice(0, 5)}-${normalized.slice(5)}`
        : zipCode;

    return {
      isValid: true,
      error: '',
      formatted,
    };
  }

  return {
    isValid: false,
    error: strict
      ? 'Please enter a valid 5-digit ZIP code (e.g., 12345)'
      : 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)',
    formatted: zipCode,
  };
};

/**
 * Validates UK postcodes
 * Format: Various formats (e.g., SW1A 1AA, EC1A 1BB)
 * @param {string} postcode - The postcode
 * @param {boolean} strict - Use strict validation
 * @returns {{isValid: boolean, error: string, formatted: string}}
 */
const validateUKPostcode = (postcode, strict = true) => {
  // Remove spaces
  const normalized = postcode.replace(/\s/g, '');

  // UK postcode regex (comprehensive)
  // Covers formats like: A9 9AA, A99 9AA, AA9 9AA, AA99 9AA, A9A 9AA, AA9A 9AA
  const ukRegex =
    /^([A-Z]{1,2}[0-9]{1,2}[A-Z]?)\s?([0-9][A-Z]{2})$/i;

  const match = postcode.match(ukRegex);

  if (!match) {
    return {
      isValid: false,
      error: 'Please enter a valid UK postcode (e.g., SW1A 1AA)',
      formatted: postcode,
    };
  }

  // Format with space
  const outward = normalized.slice(0, -3);
  const inward = normalized.slice(-3);
  const formatted = `${outward} ${inward}`.toUpperCase();

  return {
    isValid: true,
    error: '',
    formatted,
  };
};

/**
 * Auto-format postal code as user types
 * @param {string} postalCode - The postal code being entered
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code
 * @returns {string} - Formatted postal code
 */
export const formatPostalCodeAsYouType = (postalCode, countryCode = 'CA') => {
  const country = countryCode.toUpperCase();
  const normalized = postalCode.toUpperCase().replace(/[^A-Z0-9]/g, '');

  switch (country) {
    case 'CA': {
      // Auto-add space after 3rd character for Canadian postal codes
      if (normalized.length <= 3) {
        return normalized;
      }
      return `${normalized.slice(0, 3)} ${normalized.slice(3, 6)}`;
    }
    case 'US': {
      // Auto-add hyphen for ZIP+4
      if (normalized.length <= 5) {
        return normalized;
      }
      return `${normalized.slice(0, 5)}-${normalized.slice(5, 9)}`;
    }
    case 'GB':
    case 'UK': {
      // UK postcodes vary, so we'll just return normalized
      // The validation will handle proper formatting
      return postalCode.toUpperCase();
    }
    default:
      return postalCode;
  }
};

/**
 * Get example postal code for a country
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code
 * @returns {string} - Example postal code
 */
export const getPostalCodeExample = countryCode => {
  const examples = {
    CA: 'A1A 1A1',
    US: '12345',
    GB: 'SW1A 1AA',
    UK: 'SW1A 1AA',
  };

  return examples[countryCode] || 'A1A 1A1';
};

