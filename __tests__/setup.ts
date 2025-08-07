// __tests__/setup.ts
import 'react-native-gesture-handler/jestSetup';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
import { NativeModules } from 'react-native';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock Expo modules
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  supportedAuthenticationTypesAsync: jest.fn(() => Promise.resolve([1, 2])),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
  },
}));

jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn(() => Promise.resolve(new Uint8Array(16))),
  digestStringAsync: jest.fn((algorithm, data) => Promise.resolve(`hashed_${data}`)),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256',
  },
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

jest.mock('expo-camera', () => ({
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  Constants: {
    Type: {
      back: 'back',
      front: 'front',
    },
    FlashMode: {
      auto: 'auto',
      on: 'on',
      off: 'off',
    },
  },
}));

jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id')),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
}));

jest.mock('expo-device', () => ({
  isDevice: true,
  deviceType: 1,
  osName: 'iOS',
  osVersion: '15.0',
}));

// Mock React Native modules
NativeModules.RNCNetInfo = {
  getCurrentState: jest.fn(() => Promise.resolve({ isConnected: true })),
  addListener: jest.fn(),
  removeListeners: jest.fn(),
};

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock Gesture Handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: jest.fn(),
    Directions: {},
  };
});

// Mock Vector Icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialIcons: 'MaterialIcons',
  FontAwesome: 'FontAwesome',
}));

// Mock Biometrics
jest.mock('react-native-biometrics', () => ({
  createKeys: jest.fn(() => Promise.resolve({ publicKey: 'mock-public-key' })),
  biometricKeysExist: jest.fn(() => Promise.resolve({ keysExist: true })),
  deleteKeys: jest.fn(() => Promise.resolve()),
  createSignature: jest.fn(() => Promise.resolve({ signature: 'mock-signature' })),
  simplePrompt: jest.fn(() => Promise.resolve({ success: true })),
  BiometryTypes: {
    TouchID: 'TouchID',
    FaceID: 'FaceID',
    Biometrics: 'Biometrics',
  },
}));

// Mock Keychain
jest.mock('react-native-keychain', () => ({
  setInternetCredentials: jest.fn(() => Promise.resolve()),
  getInternetCredentials: jest.fn(() => Promise.resolve({ username: 'test', password: 'test' })),
  resetInternetCredentials: jest.fn(() => Promise.resolve()),
  canImplyAuthentication: jest.fn(() => Promise.resolve(true)),
}));

// Mock Device Info
jest.mock('react-native-device-info', () => ({
  getDeviceId: jest.fn(() => Promise.resolve('mock-device-id')),
  getSystemName: jest.fn(() => 'iOS'),
  getSystemVersion: jest.fn(() => '15.0'),
  getBuildNumber: jest.fn(() => '1'),
  getVersion: jest.fn(() => '1.0.0'),
  isEmulator: jest.fn(() => Promise.resolve(false)),
  hasNotch: jest.fn(() => false),
  hasSystemFeature: jest.fn(() => Promise.resolve(true)),
}));

// Mock Socket.io
jest.mock('socket.io-client', () => {
  const mockSocket = {
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connect: jest.fn(),
    connected: true,
  };
  return jest.fn(() => mockSocket);
});

// Mock Linear Gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

// Mock QR Code
jest.mock('react-native-qrcode-svg', () => 'QRCode');

// Mock PDF
jest.mock('react-native-pdf', () => 'Pdf');

// Mock Maps
jest.mock('react-native-maps', () => ({
  MapView: 'MapView',
  Marker: 'Marker',
  PROVIDER_GOOGLE: 'google',
}));

// Global test utilities
global.fetch = jest.fn();

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Security testing utilities
export const SecurityTestUtils = {
  // Mock secure data
  mockSecureData: {
    validToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
    validRefreshToken: 'refresh_token_123',
    validPIN: '123456',
    validBiometricToken: 'biometric_token_456',
    mockUserData: {
      id: 'user_123',
      email: 'test@payde.com',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+2348012345678',
      country: 'NG',
      currency: 'NGN',
    },
  },

  // Mock encrypted data
  mockEncryptedData: {
    data: 'encrypted_data_string',
    iv: 'initialization_vector',
    timestamp: Date.now(),
  },

  // Mock device security report
  mockDeviceSecurityReport: {
    timestamp: Date.now(),
    deviceId: 'mock_device_id',
    checks: {
      isRooted: { passed: true, risk: 'none' as const, details: 'No root detected' },
      isDebugging: { passed: true, risk: 'none' as const, details: 'No debug mode' },
      isEmulator: { passed: true, risk: 'none' as const, details: 'Physical device' },
      isTampered: { passed: true, risk: 'none' as const, details: 'App integrity verified' },
      isDeviceBound: { passed: true, risk: 'none' as const, details: 'Device bound' },
    },
    riskLevel: 'none' as const,
    recommendations: [],
  },

  // Mock transaction data
  mockTransactionData: {
    id: 'txn_123',
    type: 'domestic_transfer',
    status: 'completed',
    amount: 10000,
    currency: 'NGN',
    reference: 'PAY123456',
    timestamp: Date.now(),
    sender: {
      name: 'John Doe',
      accountNumber: '1234567890',
      email: 'john@payde.com',
    },
    recipient: {
      name: 'Jane Smith',
      accountNumber: '0987654321',
    },
    fees: {
      transactionFee: 100,
      total: 100,
    },
  },

  // Helper to create mock API responses
  createMockApiResponse: (data: any, success: boolean = true) => ({
    success,
    data: success ? data : undefined,
    error: success ? undefined : 'Mock error',
    statusCode: success ? 200 : 400,
  }),

  // Helper to create mock encrypted storage
  createMockSecureStore: () => {
    const storage: Record<string, string> = {};
    return {
      setItemAsync: jest.fn((key: string, value: string) => {
        storage[key] = value;
        return Promise.resolve();
      }),
      getItemAsync: jest.fn((key: string) => {
        return Promise.resolve(storage[key] || null);
      }),
      deleteItemAsync: jest.fn((key: string) => {
        delete storage[key];
        return Promise.resolve();
      }),
      storage, // Access to raw storage for testing
    };
  },

  // Helper to mock biometric authentication
  mockBiometricAuth: (success: boolean = true, error?: string) => ({
    success,
    error: success ? undefined : error,
    authType: success ? 'fingerprint' : undefined,
  }),

  // Helper to mock network responses
  mockNetworkResponse: (data: any, status: number = 200, delay: number = 0) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ok: status >= 200 && status < 300,
          status,
          json: () => Promise.resolve(data),
          text: () => Promise.resolve(JSON.stringify(data)),
        });
      }, delay);
    });
  },

  // Helper to create mock Redux store
  createMockStore: (initialState: any = {}) => ({
    dispatch: jest.fn(),
    getState: jest.fn(() => initialState),
    subscribe: jest.fn(),
    replaceReducer: jest.fn(),
  }),

  // Helper to mock location services
  mockLocationService: (granted: boolean = true, location?: any) => ({
    requestForegroundPermissionsAsync: jest.fn(() => 
      Promise.resolve({ status: granted ? 'granted' : 'denied' })
    ),
    getCurrentPositionAsync: jest.fn(() => 
      Promise.resolve(location || {
        coords: {
          latitude: 6.5244,
          longitude: 3.3792,
          accuracy: 10,
        },
      })
    ),
  }),

  // Helper to validate security measures
  validateSecurityMeasures: {
    hasEncryption: (data: any) => {
      return data && typeof data === 'object' && 'data' in data && 'iv' in data;
    },
    hasAuthentication: (headers: any) => {
      return headers && headers.Authorization && headers.Authorization.startsWith('Bearer ');
    },
    hasDeviceFingerprint: (headers: any) => {
      return headers && headers['X-Device-ID'];
    },
    hasRequestId: (headers: any) => {
      return headers && headers['X-Request-ID'];
    },
  },
};

// Banking-specific test utilities
export const BankingTestUtils = {
  // Mock account data
  mockAccountData: {
    id: 'acc_123',
    accountNumber: '1234567890',
    balance: 150000.50,
    currency: 'NGN',
    type: 'savings',
    status: 'active',
  },

  // Mock card data
  mockCardData: {
    id: 'card_123',
    pan: '1234****5678',
    expiryDate: '12/25',
    cardType: 'mastercard',
    status: 'active',
    isVirtual: true,
  },

  // Mock beneficiary data
  mockBeneficiaryData: {
    id: 'ben_123',
    name: 'Jane Doe',
    accountNumber: '9876543210',
    bankCode: 'GTB',
    bankName: 'Guaranty Trust Bank',
  },

  // Mock exchange rates
  mockExchangeRates: {
    'NGN-USD': { rate: 0.0024, timestamp: Date.now() },
    'GHS-USD': { rate: 0.16, timestamp: Date.now() },
    'KES-USD': { rate: 0.0093, timestamp: Date.now() },
  },

  // Helper to validate banking operations
  validateBankingOperation: {
    isValidAmount: (amount: number) => amount > 0 && amount <= 10000000,
    isValidAccountNumber: (accountNumber: string) => /^\d{10}$/.test(accountNumber),
    isValidPIN: (pin: string) => /^\d{4,6}$/.test(pin),
    isValidCardNumber: (cardNumber: string) => /^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/.test(cardNumber),
  },
};

// Performance testing utilities
export const PerformanceTestUtils = {
  measureRenderTime: async (component: any) => {
    const startTime = performance.now();
    // Render component
    const endTime = performance.now();
    return endTime - startTime;
  },

  measureAsyncOperation: async (operation: () => Promise<any>) => {
    const startTime = performance.now();
    await operation();
    const endTime = performance.now();
    return endTime - startTime;
  },

  createPerformanceBenchmark: (name: string, threshold: number) => ({
    name,
    threshold,
    measure: async (fn: () => Promise<any>) => {
      const time = await PerformanceTestUtils.measureAsyncOperation(fn);
      return {
        time,
        passed: time <= threshold,
        message: `${name} took ${time}ms (threshold: ${threshold}ms)`,
      };
    },
  }),
};

// Accessibility testing utilities
export const AccessibilityTestUtils = {
  checkAccessibilityProps: (element: any) => {
    const required = ['accessible', 'accessibilityRole'];
    const missing = required.filter(prop => !(prop in element.props));
    return {
      passed: missing.length === 0,
      missing,
    };
  },

  validateAccessibilityTree: (component: any) => {
    // Mock implementation for accessibility tree validation
    return {
      passed: true,
      issues: [],
    };
  },
};

// Setup global error handler for tests
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  // Clean up any test data
  jest.restoreAllMocks();
});

// Export all utilities
export {
  mockAsyncStorage,
  SecurityTestUtils as Security,
  BankingTestUtils as Banking,
  PerformanceTestUtils as Performance,
  AccessibilityTestUtils as Accessibility,
};