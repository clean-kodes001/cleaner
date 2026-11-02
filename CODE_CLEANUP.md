# Code Cleanup Documentation

## Overview
This document outlines code cleanup tasks, redundant implementations, and best practice violations identified during code review. The review covers file validation, form data storage, onboarding flows, address autocomplete, message count management, location updates, and general code quality issues.

---

## 1. File Validation Implementation

### Current State
- Centralized validation utility (`src/utils/fileValidation.js`)
- Validation for Avatar (5MB), Documents (9MB), Chat Images (9MB), Contact Documents (2MB)
- Format validation for avatars and contact documents

### Issues Identified

#### 1.1 Redundant Validation in UpdatePropertyImages.jsx
**Location:** `src/screens/Dashboard/UpdatePropertyImages.jsx`

**Problem:**
- Validation occurs in both `handleChange` callback AND `DocumentPicker` component (via `validationType="chat"`)
- Double validation is unnecessary and can cause confusion

**Fix:**
```javascript
// Remove validation from handleChange, rely on DocumentPicker validationType
const handleChange = value => {
  if (value) {
    // Remove: if (!validateChatImage(value)) return;
    const propertyImages = typeof value === 'string' 
      ? value 
      : processImageUri(value, 'file', true);
    // ... rest of logic
  }
};
```

#### 1.2 Inconsistent Validation in CleanDeepDetails.jsx
**Location:** `src/screens/Dashboard/CleanDeepDetails.jsx`

**Problem:**
- Inline validation instead of using centralized utility
- Hardcoded size check (9MB) should use `FILE_SIZE_LIMITS.CHAT_IMAGES`

**Fix:**
```javascript
import {validateChatImage} from '../../utils/fileValidation';

const handleUploadImage = async type => {
  // ... existing code
  if (image?.assets) {
    // Replace inline validation with utility
    if (!validateChatImage(image.assets)) {
      return;
    }
    // ... rest of logic
  }
};
```

#### 1.3 Silent Failure on Missing File Size
**Location:** `src/utils/fileValidation.js` (line 39-42)

**Problem:**
- When `fileSize === 0`, validation is silently skipped with only a console.warn
- Users may not know their file wasn't validated

**Fix:**
```javascript
// Option 1: Show warning to user
if (fileSize === 0) {
  Alert.alert(
    'Warning',
    'Unable to verify file size. Please ensure your file is within the size limit.'
  );
  // Still allow upload, backend will catch it
}

// Option 2: Attempt to get file size from file system
// (Requires additional library like react-native-fs)
```

---

## 2. Form Data Storage (Step2, Step3, Step4)

### Current State
- Temporary form data persistence using AsyncStorage
- Prefilling logic from onboarding status
- Debounced saving to prevent excessive writes

### Issues Identified

#### 2.1 Duplicate Prefilling Logic
**Location:** `src/screens/Profile/Step3.jsx` and `src/screens/Profile/Step4.jsx`

**Problem:**
- Similar prefilling/loading logic repeated across Step3 and Step4
- Code duplication makes maintenance difficult

**Fix:**
Create a shared custom hook:
```javascript
// src/hooks/useFormDataPrefill.js
export const useFormDataPrefill = (stepNumber, onboardingStatus, form) => {
  const [prefilledValues, setPrefilledValues] = useState(null);
  const [isLoadingSavedData, setIsLoadingSavedData] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      // Shared prefilling logic
      // ... extract common logic here
    };
    loadData();
  }, [onboardingStatus]);

  return { prefilledValues, isLoadingSavedData, setPrefilledValues };
};
```

#### 2.2 Debounce Timing Too Short
**Location:** `src/screens/Profile/Step4.jsx` (line ~450)

**Problem:**
- 500ms debounce may be too short for rapid typing/selection
- Could cause excessive AsyncStorage writes

**Fix:**
```javascript
// Increase to 1000ms for better performance
const timeoutId = setTimeout(() => {
  saveStep4Data(form.values);
}, 1000); // Changed from 500ms
```

#### 2.3 Memory Leak Risk in Step2
**Location:** `src/screens/Profile/Step2.jsx` (line 69)

**Problem:**
- `clearStep2Data()` is called in `handleNext`, but if navigation fails, data isn't cleared
- No error handling for AsyncStorage operations

**Fix:**
```javascript
const handleNext = async () => {
  try {
    // ... existing avatar processing
    
    // Clear saved data on successful navigation
    await clearStep2Data();
    
    dispatch(uploadImage({
      // ... existing params
    }));
  } catch (error) {
    console.error('Error in handleNext:', error);
    // Optionally: show error to user, don't clear data
  }
};
```

---

## 3. Onboarding Status Flow

### Current State
- Backend-driven navigation using `bio_data` and `document_upload` flags
- Timeout mechanisms to prevent infinite loading
- Component-level navigation handling

### Issues Identified

#### 3.1 Repeated Numeric/Boolean Checks
**Location:** Multiple files (Step2, Step3, Step4, SuccessMessage, routes.js)

**Problem:**
- Pattern `=== 1 || === true` repeated throughout codebase
- Makes code harder to read and maintain

**Fix:**
Create utility function:
```javascript
// src/utils/onboardingUtils.js
export const isTrue = (value) => {
  return value === 1 || value === true;
};

export const isFalse = (value) => {
  return value === 0 || value === false || !value;
};

// Usage:
const isUpdate = isTrue(onboardingStatus?.onboarding_status?.bio_data);
```

#### 3.2 Hardcoded Timeout Values
**Location:** `src/screens/Profile/Step3.jsx`, `src/screens/Profile/Step4.jsx`, `src/components/Shared/SuccessMessage.jsx`

**Problem:**
- Timeout values (10s, 15s) are hardcoded
- Should be centralized constants

**Fix:**
```javascript
// src/constants/timeouts.js
export const TIMEOUTS = {
  SUBMISSION_NAVIGATION: 10000, // 10 seconds
  ONBOARDING_STATUS_API: 15000, // 15 seconds
  FORM_DEBOUNCE: 1000, // 1 second
};

// Usage:
setTimeout(() => {
  // ... logic
}, TIMEOUTS.SUBMISSION_NAVIGATION);
```

#### 3.3 Navigation Race Conditions
**Location:** `src/screens/Profile/Step3.jsx` and `src/screens/Profile/Step4.jsx`

**Problem:**
- `useEffect` watching `onboardingStatus` can fire before Redux state fully updates
- Can cause incorrect navigation decisions

**Fix:**
```javascript
// Use ref to track if navigation already occurred
const hasNavigatedRef = useRef(false);

useEffect(() => {
  if (hasSubmitted && onboardingStatus?.onboarding_status && !hasNavigatedRef.current) {
    const currentBioData = isTrue(onboardingStatus?.onboarding_status?.bio_data);
    
    if (!currentBioData && hasSubmitted) {
      hasNavigatedRef.current = true; // Prevent duplicate navigation
      // ... navigation logic
    }
  }
}, [onboardingStatus?.onboarding_status?.bio_data, hasSubmitted]);
```

---

## 4. Address Autocomplete

### Current State
- Google Places integration for address selection
- Postal code validation with Google API
- Prefilling support for existing addresses

### Issues Identified

#### 4.1 Inefficient Key Prop Remounting
**Location:** `src/screens/Profile/EditProfileInfomation.jsx`

**Problem:**
- `key` prop forces component remount when address changes
- Inefficient and can cause performance issues

**Fix:**
```javascript
// Remove key prop, use controlled value updates
<AddressAutocomplete
  // Remove: key={`address-${...}`}
  value={form.values.address || user?.address || ''}
  onChangeText={handleAddressChange}
  onAddressSelected={handleAddressSelected}
  error={formHandler('address', form).error}
  placeholder="Search for your address"
/>
```

#### 4.2 Missing Debounce on Google Validation
**Location:** `src/screens/Profile/EditProfileInfomation.jsx` (line ~120)

**Problem:**
- Postal code validates on every keystroke
- Can cause excessive API calls to Google

**Fix:**
```javascript
import {debounce} from 'lodash'; // or implement custom debounce

const debouncedValidatePostalCode = useCallback(
  debounce(async (postalCode) => {
    await validateCanadianPostalCode(postalCode);
  }, 500),
  []
);

// In TextInputField onChangeText:
onChangeText={async text => {
  form.setFieldValue('postal_code', text);
  debouncedValidatePostalCode(text);
}}
```

#### 4.3 Missing Error Recovery
**Location:** `src/screens/Profile/EditProfileInfomation.jsx`

**Problem:**
- If Google validation fails, error state may persist
- No mechanism to reset error state

**Fix:**
```javascript
const validateCanadianPostalCode = useCallback(async postalCode => {
  // ... existing validation
  
  try {
    const googleValidation = await validatePostalCodeWithGoogle(postalCode, 'CA');
    // ... existing logic
  } catch (error) {
    console.error('Error validating postal code:', error);
    // Reset error state on API failure
    setPostalCodeError('');
    // Optionally: fall back to local validation only
  }
}, []);
```

---

## 5. Message Count Management

### Current State
- Persisted unread message count across app restarts
- Server sync on app start
- Real-time updates via WebSocket

### Issues Identified

#### 5.1 Complex Sync Logic
**Location:** `src/store/reducer/userSlice.js` (getClean.fulfilled)

**Problem:**
- Nested conditionals make logic hard to follow
- Difficult to test and maintain

**Fix:**
Extract to helper function:
```javascript
// src/utils/messageCountSync.js
export const syncMessageCount = (serverCount, currentCount) => {
  // Validate server count
  if (serverCount === undefined || serverCount === null || serverCount < 0) {
    console.log('Invalid server count, keeping persisted count');
    return currentCount;
  }

  // Server has higher count - new messages arrived
  if (serverCount > currentCount) {
    return serverCount;
  }

  // Both agree on zero
  if (serverCount === 0 && currentCount === 0) {
    return 0;
  }

  // Server count is lower - keep persisted (server might be wrong)
  if (serverCount < currentCount) {
    return currentCount;
  }

  // They're equal
  return currentCount;
};

// Usage in reducer:
state.messageCount = syncMessageCount(
  action.payload?.unread_chat_count,
  state.messageCount || 0
);
```

#### 5.2 Console Logs in Production
**Location:** Multiple files (userSlice.js, Home.jsx, etc.)

**Problem:**
- Many `console.log` statements should be removed or gated
- Can impact performance and expose sensitive data

**Fix:**
```javascript
// src/utils/logger.js
const isDevelopment = __DEV__;

export const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  error: (...args) => {
    // Always log errors, even in production
    console.error(...args);
  },
};

// Usage:
logger.log('getClean.fulfilled:', { currentCount, serverCount });
```

#### 5.3 Potential Race Condition
**Location:** `src/store/reducer/userSlice.js`

**Problem:**
- `incrementMessageCount` and server sync can conflict
- No mechanism to resolve conflicts

**Fix:**
```javascript
// Add timestamp to track when count was last updated
incrementMessageCount: (state, action) => {
  const timestamp = Date.now();
  state.messageCount = (state.messageCount || 0) + 1;
  state.messageCountLastUpdated = timestamp;
},

// In getClean.fulfilled, only update if server timestamp is newer
// (Requires backend to provide timestamp)
```

---

## 6. Location Updates (Home.jsx)

### Current State
- Throttled location updates to prevent API rate limiting
- Real-time location tracking when online
- Geocoding for address display

### Issues Identified

#### 6.1 Throttle Constants Not Centralized
**Location:** `src/screens/Dashboard/Home.jsx`

**Problem:**
- `UPDATE_STATUS_THROTTLE_MS` and `GET_CLEAN_THROTTLE_MS` defined inline
- Should be in constants file

**Fix:**
```javascript
// src/constants/api.js
export const API_THROTTLES = {
  UPDATE_STATUS: 30000, // 30 seconds
  GET_CLEAN: 5000, // 5 seconds
  LOCATION_UPDATE: 30000, // 30 seconds
};

// Usage:
const UPDATE_STATUS_THROTTLE_MS = API_THROTTLES.UPDATE_STATUS;
```

#### 6.2 Ref Usage Could Be Utility
**Location:** `src/screens/Dashboard/Home.jsx`

**Problem:**
- Multiple refs (`lastUpdateStatusCall`, `lastGetCleanCall`) for throttling
- Could be abstracted into reusable utility

**Fix:**
```javascript
// src/hooks/useThrottle.js
export const useThrottle = (delay) => {
  const lastCallRef = useRef(0);

  return useCallback((callback) => {
    const now = Date.now();
    if (now - lastCallRef.current >= delay) {
      lastCallRef.current = now;
      callback();
    }
  }, [delay]);
};

// Usage:
const throttledUpdateStatus = useThrottle(API_THROTTLES.UPDATE_STATUS);
const throttledGetClean = useThrottle(API_THROTTLES.GET_CLEAN);
```

#### 6.3 Excessive Dependencies in useEffect
**Location:** `src/screens/Dashboard/Home.jsx` (location watching useEffect)

**Problem:**
- Many dependencies cause frequent re-runs
- Can impact performance

**Fix:**
```javascript
// Use refs for values that don't need to trigger re-runs
const locationAddressRef = useRef(locationAddress);
const userRef = useRef(user);
const pendingRef = useRef(pending);

useEffect(() => {
  locationAddressRef.current = locationAddress;
  userRef.current = user;
  pendingRef.current = pending;
}, [locationAddress, user, pending]);

// In location watch callback, use refs instead of direct values
useEffect(() => {
  const watchID = Geolocation.watchPosition(
    position => {
      // Use refs: locationAddressRef.current, userRef.current, etc.
    },
    // ... rest of logic
  );
  
  return () => Geolocation.clearWatch(watchID);
}, []); // Empty deps, use refs inside
```

---

## 7. DocumentPicker Component

### Current State
- Centralized file picking with validation
- Support for documents and images
- Multiple picker types (camera, library, document)

### Issues Identified

#### 7.1 Prop Drilling for ValidationType
**Location:** `src/components/Inputs/DocumentPicker.jsx`

**Problem:**
- `validationType` prop passed through multiple layers
- Could use context or validation registry

**Fix:**
```javascript
// Option 1: Validation Context
const ValidationContext = createContext();

// Option 2: Validation Registry (simpler)
// src/utils/validationRegistry.js
const VALIDATION_REGISTRY = {
  onboarding: validateOnboardingDocument,
  chat: validateChatImage,
  contact: validateContactDocument,
};

// In DocumentPicker:
const validate = VALIDATION_REGISTRY[validationType];
if (validate && !validate(result)) {
  return; // Don't set result
}
```

#### 7.2 Duplicate Validation Code
**Location:** `src/components/Inputs/DocumentPicker.jsx`

**Problem:**
- Validation logic repeated in `openCamera`, `openImageLibrary`, `openPicker`, `openPickMiltiple`
- Should be extracted to single function

**Fix:**
```javascript
// Extract validation to single function
const validateResult = (result, validationType, type) => {
  if (!result) return true; // No result, validation passes
  
  let isValid = true;
  const files = Array.isArray(result) ? result : [result];
  
  if (validationType === 'chat') {
    isValid = validateChatImage(files);
  } else if (validationType === 'contact') {
    isValid = validateContactDocument(files);
  } else if (validationType === 'onboarding') {
    isValid = validateOnboardingDocument(files);
  } else if (type === 'image' && !validationType) {
    isValid = validateChatImage(files);
  }
  
  return isValid;
};

// Use in all picker functions:
if (validateResult(normalizedResult, validationType, type)) {
  setResult([normalizedResult]);
}
```

#### 7.3 Missing Prop Validation
**Location:** `src/components/Inputs/DocumentPicker.jsx`

**Problem:**
- No PropTypes or TypeScript to ensure `validationType` is valid
- Can lead to runtime errors

**Fix:**
```javascript
import PropTypes from 'prop-types';

DocumentPickerRN.propTypes = {
  validationType: PropTypes.oneOf(['onboarding', 'chat', 'contact']),
  type: PropTypes.oneOf(['image', 'document']),
  // ... other props
};
```

---

## 8. Contact Us Feature

### Current State
- New feature for user support messages
- Form with message title and message fields
- Redux action for API call

### Issues Identified

#### 8.1 Duplicate Actions
**Location:** `src/store/actions/profile/contactUs.js` and `src/store/actions/profile/contactSupport.js`

**Problem:**
- Two similar actions exist: `contactUs` and `contactSupport`
- Unclear distinction between them

**Fix:**
- **Option 1:** Consolidate into single action with type parameter
- **Option 2:** Document the difference clearly
- **Option 3:** Remove one if truly duplicate

```javascript
// If consolidating:
export const contactSupport = createAsyncThunk(
  'user/contactSupport',
  async ({payload, type = 'general'}, {rejectWithValue}) => {
    // type can be 'general', 'profile_change', etc.
    // ... existing logic
  }
);
```

#### 8.2 Form Clearing Reliability
**Location:** `src/screens/Profile/ContactUs.jsx`

**Problem:**
- `form.resetForm()` called in callback, but success state may not be reliable
- Should use `useEffect` watching success state

**Fix:**
```javascript
const {success} = useSelector(state => state.ui);

useEffect(() => {
  if (success) {
    form.resetForm();
    // Optionally: dispatch action to reset success state
  }
}, [success, form]);
```

---

## 9. General Code Quality Issues

### 9.1 Inconsistent Error Handling
**Problem:**
- Mix of `Alert.alert` and toast messages
- No standardized error handling pattern

**Fix:**
```javascript
// src/utils/errorHandler.js
import {Alert} from 'react-native';
import {showToast} from './showToast';

export const handleError = (error, type = 'toast') => {
  const message = error?.response?.data?.message || error?.message || 'An error occurred';
  
  if (type === 'alert') {
    Alert.alert('Error', message);
  } else {
    showToast(message, 'error');
  }
};
```

### 9.2 Commented Code
**Location:** Multiple files (Home.jsx, etc.)

**Problem:**
- Hardcoded location values commented but still present
- Dead code should be removed

**Fix:**
- Remove all commented code
- Use version control (git) for history
- If needed for reference, add TODO comments with explanation

### 9.3 Magic Numbers
**Problem:**
- Timeouts, limits, and thresholds scattered throughout code
- Should be centralized

**Fix:**
```javascript
// src/constants/app.js
export const APP_CONSTANTS = {
  TIMEOUTS: {
    SUBMISSION_NAVIGATION: 10000,
    ONBOARDING_STATUS_API: 15000,
    FORM_DEBOUNCE: 1000,
  },
  FILE_LIMITS: {
    AVATAR: 5 * 1024 * 1024,
    DOCUMENTS: 9 * 1024 * 1024,
    CHAT_IMAGES: 9 * 1024 * 1024,
    CONTACT_DOCUMENTS: 2 * 1024 * 1024,
  },
  THROTTLES: {
    UPDATE_STATUS: 30000,
    GET_CLEAN: 5000,
  },
};
```

### 9.4 ESLint Suppressions
**Problem:**
- Many `eslint-disable-next-line` comments
- Should address root causes

**Fix:**
- Review each suppression
- Fix underlying issues (missing dependencies, unused vars, etc.)
- Only suppress if truly necessary with explanation comment

---

## 10. Best Practices Violations

### 10.1 Large Components
**Problem:**
- Step3.jsx: 1004 lines
- Step4.jsx: 606+ lines
- Home.jsx: 929 lines

**Fix:**
Split into smaller components:
```javascript
// Step3.jsx structure:
- Step3.jsx (main container, ~200 lines)
  - Step3Form.jsx (form logic, ~300 lines)
  - Step3Fields.jsx (field rendering, ~200 lines)
  - useStep3Data.js (custom hook for data management, ~200 lines)
  - Step3Validation.js (validation logic, ~100 lines)
```

### 10.2 Mixed Concerns
**Problem:**
- Components handle API calls, validation, navigation, and UI
- Violates single responsibility principle

**Fix:**
- Extract API calls to custom hooks
- Move validation to separate utilities
- Use navigation hooks/utilities
- Keep components focused on UI rendering

### 10.3 Missing Error Boundaries
**Problem:**
- No error boundaries for async operations
- App can crash on unhandled errors

**Fix:**
```javascript
// src/components/ErrorBoundary.jsx
import React from 'react';
import {ErrorBoundary as ReactErrorBoundary} from 'react-error-boundary';

const ErrorFallback = ({error, resetErrorBoundary}) => (
  <View>
    <Text>Something went wrong</Text>
    <Button onPress={resetErrorBoundary}>Try again</Button>
  </View>
);

export const ErrorBoundary = ({children}) => (
  <ReactErrorBoundary FallbackComponent={ErrorFallback}>
    {children}
  </ReactErrorBoundary>
);

// Wrap critical sections:
<ErrorBoundary>
  <Step3 />
</ErrorBoundary>
```

### 10.4 Inconsistent State Management
**Problem:**
- Some state in Redux, some in local state, some in AsyncStorage
- No clear pattern

**Fix:**
- **Redux:** Global app state, user data, API responses
- **Local State:** Component-specific UI state (modals, form fields)
- **AsyncStorage:** Only for persistence (via Redux Persist)
- **Session Storage:** Temporary form data (current implementation is correct)

---

## 11. Priority Recommendations

### High Priority (Do First)
1. ✅ Extract numeric/boolean check utility (`isTrue`, `isFalse`)
2. ✅ Centralize all constants (timeouts, limits, throttles)
3. ✅ Remove redundant validation in `UpdatePropertyImages.jsx`
4. ✅ Fix inconsistent validation in `CleanDeepDetails.jsx`
5. ✅ Remove all `console.log` statements or gate behind debug flag
6. ✅ Remove commented code

### Medium Priority (Do Next)
1. ✅ Extract shared prefilling logic to custom hook
2. ✅ Create throttling utility hook
3. ✅ Extract message count sync logic to helper function
4. ✅ Add debounce to postal code Google validation
5. ✅ Consolidate duplicate validation in DocumentPicker
6. ✅ Fix form clearing in ContactUs using useEffect

### Low Priority (Nice to Have)
1. ✅ Split large components (Step3, Step4, Home)
2. ✅ Add error boundaries
3. ✅ Add PropTypes/TypeScript
4. ✅ Create validation context/registry
5. ✅ Optimize useEffect dependencies with refs
6. ✅ Standardize error handling

---

## 12. Implementation Checklist

- [ ] Create `src/utils/onboardingUtils.js` with `isTrue`/`isFalse` helpers
- [ ] Create `src/constants/app.js` with all magic numbers
- [ ] Create `src/constants/timeouts.js` with timeout values
- [ ] Create `src/utils/logger.js` for gated console logging
- [ ] Create `src/hooks/useThrottle.js` for throttling utility
- [ ] Create `src/hooks/useFormDataPrefill.js` for shared prefilling logic
- [ ] Create `src/utils/messageCountSync.js` for message count sync logic
- [ ] Create `src/utils/errorHandler.js` for standardized error handling
- [ ] Remove redundant validation in `UpdatePropertyImages.jsx`
- [ ] Fix validation in `CleanDeepDetails.jsx` to use utility
- [ ] Remove all commented code
- [ ] Replace all `console.log` with `logger.log`
- [ ] Replace all numeric/boolean checks with `isTrue`/`isFalse`
- [ ] Replace all hardcoded timeouts with constants
- [ ] Add debounce to postal code validation
- [ ] Fix form clearing in ContactUs
- [ ] Extract validation logic in DocumentPicker
- [ ] Add PropTypes to DocumentPicker
- [ ] Optimize useEffect dependencies
- [ ] Add error boundaries to critical sections

---

## 13. Testing Recommendations

After cleanup, ensure:
1. File validation still works for all file types
2. Form data persists correctly across navigation
3. Onboarding flow navigation works as expected
4. Address autocomplete and postal code validation function
5. Message count syncs correctly with server
6. Location updates are properly throttled
7. No console errors or warnings
8. Performance is not degraded

---

## Notes

- This cleanup should be done incrementally, not all at once
- Test thoroughly after each major change
- Consider creating feature branches for each cleanup area
- Document any breaking changes
- Update this document as cleanup progresses

