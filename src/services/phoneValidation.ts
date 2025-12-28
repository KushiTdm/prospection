import { parsePhoneNumber, getNumberType } from 'libphonenumber-js';
import type { PhoneType } from '../types';

export const classifyPhoneNumber = (phoneNumber: string, defaultCountry: string = 'US'): PhoneType => {
  try {
    const parsed = parsePhoneNumber(phoneNumber, defaultCountry as any);

    if (!parsed || !parsed.isValid()) {
      return 'UNKNOWN';
    }

    const type = getNumberType(parsed.number, parsed.country);

    if (type === 'MOBILE' || type === 'FIXED_LINE_OR_MOBILE') {
      return 'MOBILE';
    } else if (type === 'FIXED_LINE') {
      return 'FIXED_LINE';
    }

    return 'UNKNOWN';
  } catch (error) {
    return 'UNKNOWN';
  }
};

export const formatPhoneNumber = (phoneNumber: string, defaultCountry: string = 'US'): string => {
  try {
    const parsed = parsePhoneNumber(phoneNumber, defaultCountry as any);
    return parsed?.formatInternational() || phoneNumber;
  } catch (error) {
    return phoneNumber;
  }
};

export const validatePhoneNumber = (phoneNumber: string, defaultCountry: string = 'US'): boolean => {
  try {
    const parsed = parsePhoneNumber(phoneNumber, defaultCountry as any);
    return parsed?.isValid() || false;
  } catch (error) {
    return false;
  }
};
