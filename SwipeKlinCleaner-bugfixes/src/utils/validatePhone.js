import {parsePhoneNumber, isValidPhoneNumber} from 'libphonenumber-js';

/**
 * Validates a phone number for a specific country
 * @param {string} phoneNumber - The phone number to validate (with or without country code)
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code (e.g., 'CA', 'US', 'NG', 'GB')
 * @returns {{isValid: boolean, error: string, formatted: string}} - Validation result with formatted number
 */
export const validatePhoneNumber = (phoneNumber, countryCode = 'CA') => {
  // Handle empty input
  if (!phoneNumber || phoneNumber.trim() === '') {
    return {
      isValid: false,
      error: 'Phone number is required',
      formatted: '',
    };
  }

  // Normalize the input (remove spaces, dashes, parentheses)
  const normalizedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');

  // Check if countryCode is valid
  const validCountries = ['CA', 'US', 'NG', 'GB', 'UK'];
  const country = countryCode === 'UK' ? 'GB' : countryCode.toUpperCase();

  if (!validCountries.includes(country)) {
    return {
      isValid: false,
      error: `Unsupported country code: ${countryCode}`,
      formatted: phoneNumber,
    };
  }

  try {
    // First check if it's a valid phone number for the country
    const isValid = isValidPhoneNumber(normalizedPhone, country);

    if (!isValid) {
      // Provide country-specific error messages
      const countryMessages = {
        CA: 'Please enter a valid Canadian phone number (e.g., +1 234 567-8900)',
        US: 'Please enter a valid US phone number (e.g., +1 234 567-8900)',
        NG: 'Please enter a valid Nigerian phone number (e.g., +234 803 123 4567)',
        GB: 'Please enter a valid UK phone number (e.g., +44 20 7946 0958)',
      };

      return {
        isValid: false,
        error: countryMessages[country] || 'Please enter a valid phone number',
        formatted: phoneNumber,
      };
    }

    // Parse and format the phone number
    const parsedPhone = parsePhoneNumber(normalizedPhone, country);

    return {
      isValid: true,
      error: '',
      formatted: parsedPhone.formatInternational(),
    };
  } catch (error) {
    // Handle parsing errors
    return {
      isValid: false,
      error: 'Invalid phone number format',
      formatted: phoneNumber,
    };
  }
};

/**
 * Get example phone number format for a country
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code
 * @returns {string} - Example phone number format
 */
export const getPhoneNumberExample = countryCode => {
  const examples = {
    CA: '+1 (234) 567-8900',
    US: '+1 (234) 567-8900',
    NG: '+234 803 123 4567',
    GB: '+44 20 7946 0958',
  };

  return examples[countryCode] || '+1 (234) 567-8900';
};

/**
 * Extract country code from phone number
 * @param {string} phoneNumber - The phone number
 * @returns {string|null} - Country code or null
 */
export const extractCountryCode = phoneNumber => {
  try {
    const parsedPhone = parsePhoneNumber(phoneNumber);
    return parsedPhone ? parsedPhone.country : null;
  } catch (error) {
    return null;
  }
};

