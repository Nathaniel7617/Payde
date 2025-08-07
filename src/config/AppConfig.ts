
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Environment types
export type Environment = 'development' | 'staging' | 'production';

// Application configuration interface
export interface AppConfig {
  environment: Environment;
  api: APIConfig;
  security: SecurityConfig;
  features: FeatureConfig;
  ui: UIConfig;
  regional: RegionalConfig;
  receipt: ReceiptConfig;
  currency: CurrencyConfig;
  notifications: NotificationConfig;
}

export interface APIConfig {
  baseURL: string;
  websocketURL: string;
  timeout: number;
  retryAttempts: number;
  endpoints: APIEndpoints;
}

export interface APIEndpoints {
  auth: AuthEndpoints;
  transactions: TransactionEndpoints;
  accounts: AccountEndpoints;
  cards: CardEndpoints;
  bills: BillEndpoints;
  exchange: ExchangeEndpoints;
}

export interface AuthEndpoints {
  register: string;
  login: string;
  logout: string;
  refreshToken: string;
  verifyPhone: string;
  verifyEmail: string;
  verifyIdentity: string;
  setupSecurity: string;
  resetPin: string;
  enable2FA: string;
}

export interface TransactionEndpoints {
  list: string;
  details: string;
  transfer: string;
  international: string;
  billPayment: string;
  airtime: string;
  data: string;
  fees: string;
  limits: string;
}

export interface AccountEndpoints {
  profile: string;
  balance: string;
  statement: string;
  limits: string;
  preferences: string;
}

export interface CardEndpoints {
  list: string;
  create: string;
  block: string;
  unblock: string;
  limits: string;
  transactions: string;
}

export interface BillEndpoints {
  categories: string;
  providers: string;
  validate: string;
  pay: string;
  history: string;
}

export interface ExchangeEndpoints {
  rates: string;
  convert: string;
  corridors: string;
}

export interface SecurityConfig {
  pinLength: {
    login: number;
    transaction: number;
  };
  sessionTimeout: number;
  maxFailedAttempts: number;
  lockoutDuration: number;
  biometricEnabled: boolean;
  encryptionLevel: string;
  certificatePinning: boolean;
}

export interface FeatureConfig {
  internationalTransfers: boolean;
  virtualCards: boolean;
  billPayments: boolean;
  airtimePurchase: boolean;
  dataPurchase: boolean;
  recurringPayments: boolean;
  budgetTracking: boolean;
  savingsGoals: boolean;
  investmentOptions: boolean;
  cryptoSupport: boolean;
  demoMode: boolean;
}

export interface UIConfig {
  theme: ThemeConfig;
  animations: AnimationConfig;
  accessibility: AccessibilityConfig;
}

export interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  error: string;
  warning: string;
  success: string;
  text: TextColors;
  fonts: FontConfig;
}

export interface TextColors {
  primary: string;
  secondary: string;
  disabled: string;
  inverse: string;
}

export interface FontConfig {
  regular: string;
  medium: string;
  bold: string;
  light: string;
}

export interface AnimationConfig {
  duration: {
    short: number;
    medium: number;
    long: number;
  };
  easing: string;
  enabledAnimations: boolean;
}

export interface AccessibilityConfig {
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  highContrast: boolean;
  reduceMotion: boolean;
  screenReaderSupport: boolean;
}

export interface RegionalConfig {
  supportedCountries: Country[];
  defaultCountry: string;
  supportedLanguages: Language[];
  defaultLanguage: string;
  compliance: ComplianceConfig;
}

export interface Country {
  code: string;
  name: string;
  currency: string;
  phonePrefix: string;
  regulatoryBody: string;
  kycRequirements: KYCRequirement[];
  transactionLimits: TransactionLimits;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  rtl: boolean;
}

export interface KYCRequirement {
  level: number;
  documents: string[];
  limits: TransactionLimits;
}

export interface TransactionLimits {
  daily: number;
  monthly: number;
  yearly: number;
  perTransaction: number;
}

export interface ComplianceConfig {
  aml: AMLConfig;
  kyc: KYCConfig;
  pci: PCIConfig;
}

export interface AMLConfig {
  enabled: boolean;
  thresholds: Record<string, number>;
  monitoring: boolean;
  reporting: boolean;
}

export interface KYCConfig {
  levels: number;
  autoVerification: boolean;
  documentTypes: string[];
  faceMatch: boolean;
}

export interface PCIConfig {
  level: number;
  tokenization: boolean;
  encryption: string;
}

export interface ReceiptConfig {
  defaultFormat: 'pdf' | 'html' | 'image';
  deliveryMethods: ('email' | 'sms' | 'push' | 'download')[];
  templates: ReceiptTemplate[];
  branding: ReceiptBranding;
}

export interface ReceiptTemplate {
  id: string;
  name: string;
  type: 'standard' | 'detailed' | 'summary';
  layout: string;
}

export interface ReceiptBranding {
  logo: string;
  colors: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
  };
  companyInfo: CompanyInfo;
  footer: string;
}

export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  license: string;
}

export interface CurrencyConfig {
  supported: SupportedCurrency[];
  default: string;
  exchangeProvider: string;
  updateInterval: number;
}

export interface SupportedCurrency {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
  country: string;
  enabled: boolean;
}

export interface NotificationConfig {
  push: PushConfig;
  email: EmailConfig;
  sms: SMSConfig;
}

export interface PushConfig {
  enabled: boolean;
  provider: string;
  topics: string[];
}

export interface EmailConfig {
  enabled: boolean;
  provider: string;
  templates: EmailTemplate[];
}

export interface SMSConfig {
  enabled: boolean;
  provider: string;
  templates: SMSTemplate[];
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  template: string;
}

export interface SMSTemplate {
  id: string;
  name: string;
  template: string;
}

// Environment-specific configurations
const getEnvironmentConfig = (): Partial<AppConfig> => {
  const env = (Constants.expoConfig?.extra?.environment || 'development') as Environment;

  switch (env) {
    case 'production':
      return {
        environment: 'production',
        api: {
          baseURL: 'https://api.payde.com',
          websocketURL: 'wss://ws.payde.com',
          timeout: 30000,
          retryAttempts: 3,
          endpoints: PRODUCTION_ENDPOINTS
        },
        security: {
          ...SECURITY_CONFIG,
          encryptionLevel: 'AES-256',
          certificatePinning: true
        },
        features: {
          ...FEATURE_CONFIG,
          demoMode: false
        }
      };

    case 'staging':
      return {
        environment: 'staging',
        api: {
          baseURL: 'https://api-staging.payde.com',
          websocketURL: 'wss://ws-staging.payde.com',
          timeout: 30000,
          retryAttempts: 3,
          endpoints: STAGING_ENDPOINTS
        },
        security: {
          ...SECURITY_CONFIG,
          encryptionLevel: 'AES-256',
          certificatePinning: true
        },
        features: {
          ...FEATURE_CONFIG,
          demoMode: true
        }
      };

    default: // development
      return {
        environment: 'development',
        api: {
          baseURL: 'https://api-dev.payde.com',
          websocketURL: 'wss://ws-dev.payde.com',
          timeout: 15000,
          retryAttempts: 2,
          endpoints: DEVELOPMENT_ENDPOINTS
        },
        security: {
          ...SECURITY_CONFIG,
          encryptionLevel: 'AES-128',
          certificatePinning: false
        },
        features: {
          ...FEATURE_CONFIG,
          demoMode: true
        }
      };
  }
};

// Base configurations
const SECURITY_CONFIG: SecurityConfig = {
  pinLength: {
    login: 6,
    transaction: 4
  },
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  maxFailedAttempts: 5,
  lockoutDuration: 30 * 60 * 1000, // 30 minutes
  biometricEnabled: true,
  encryptionLevel: 'AES-256',
  certificatePinning: false
};

const FEATURE_CONFIG: FeatureConfig = {
  internationalTransfers: true,
  virtualCards: true,
  billPayments: true,
  airtimePurchase: true,
  dataPurchase: true,
  recurringPayments: true,
  budgetTracking: true,
  savingsGoals: true,
  investmentOptions: false,
  cryptoSupport: false,
  demoMode: true
};

const UI_CONFIG: UIConfig = {
  theme: {
    primary: '#0066CC',
    secondary: '#10B981',
    accent: '#F59E0B',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    error: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      disabled: '#9CA3AF',
      inverse: '#FFFFFF'
    },
    fonts: {
      regular: Platform.select({
        ios: 'San Francisco',
        android: 'Roboto',
        default: 'System'
      }),
      medium: Platform.select({
        ios: 'San Francisco',
        android: 'Roboto',
        default: 'System'
      }),
      bold: Platform.select({
        ios: 'San Francisco',
        android: 'Roboto',
        default: 'System'
      }),
      light: Platform.select({
        ios: 'San Francisco',
        android: 'Roboto',
        default: 'System'
      })
    }
  },
  animations: {
    duration: {
      short: 200,
      medium: 300,
      long: 500
    },
    easing: 'ease-in-out',
    enabledAnimations: true
  },
  accessibility: {
    fontSize: 'medium',
    highContrast: false,
    reduceMotion: false,
    screenReaderSupport: true
  }
};

const REGIONAL_CONFIG: RegionalConfig = {
  supportedCountries: [
    {
      code: 'NG',
      name: 'Nigeria',
      currency: 'NGN',
      phonePrefix: '+234',
      regulatoryBody: 'CBN',
      kycRequirements: [
        {
          level: 1,
          documents: ['phone', 'email'],
          limits: { daily: 50000, monthly: 300000, yearly: 1000000, perTransaction: 20000 }
        },
        {
          level: 2,
          documents: ['phone', 'email', 'bvn', 'government_id'],
          limits: { daily: 200000, monthly: 1000000, yearly: 5000000, perTransaction: 100000 }
        },
        {
          level: 3,
          documents: ['phone', 'email', 'bvn', 'government_id', 'address_proof'],
          limits: { daily: 5000000, monthly: 20000000, yearly: 100000000, perTransaction: 1000000 }
        }
      ],
      transactionLimits: { daily: 5000000, monthly: 20000000, yearly: 100000000, perTransaction: 1000000 }
    },
    {
      code: 'GH',
      name: 'Ghana',
      currency: 'GHS',
      phonePrefix: '+233',
      regulatoryBody: 'BOG',
      kycRequirements: [
        {
          level: 1,
          documents: ['phone', 'email'],
          limits: { daily: 2000, monthly: 10000, yearly: 50000, perTransaction: 1000 }
        },
        {
          level: 2,
          documents: ['phone', 'email', 'ghana_card', 'tin'],
          limits: { daily: 10000, monthly: 50000, yearly: 200000, perTransaction: 5000 }
        },
        {
          level: 3,
          documents: ['phone', 'email', 'ghana_card', 'tin', 'address_proof'],
          limits: { daily: 50000, monthly: 200000, yearly: 1000000, perTransaction: 20000 }
        }
      ],
      transactionLimits: { daily: 50000, monthly: 200000, yearly: 1000000, perTransaction: 20000 }
    },
    {
      code: 'KE',
      name: 'Kenya',
      currency: 'KES',
      phonePrefix: '+254',
      regulatoryBody: 'CBK',
      kycRequirements: [
        {
          level: 1,
          documents: ['phone', 'email'],
          limits: { daily: 70000, monthly: 300000, yearly: 1500000, perTransaction: 35000 }
        },
        {
          level: 2,
          documents: ['phone', 'email', 'national_id', 'kra_pin'],
          limits: { daily: 300000, monthly: 1500000, yearly: 7500000, perTransaction: 150000 }
        },
        {
          level: 3,
          documents: ['phone', 'email', 'national_id', 'kra_pin', 'address_proof'],
          limits: { daily: 1000000, monthly: 5000000, yearly: 25000000, perTransaction: 500000 }
        }
      ],
      transactionLimits: { daily: 1000000, monthly: 5000000, yearly: 25000000, perTransaction: 500000 }
    }
  ],
  defaultCountry: 'NG',
  supportedLanguages: [
    { code: 'en', name: 'English', nativeName: 'English', rtl: false },
    { code: 'fr', name: 'French', nativeName: 'Français', rtl: false },
    { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', rtl: false },
    { code: 'ha', name: 'Hausa', nativeName: 'Hausa', rtl: false },
    { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', rtl: false },
    { code: 'ig', name: 'Igbo', nativeName: 'Igbo', rtl: false }
  ],
  defaultLanguage: 'en',
  compliance: {
    aml: {
      enabled: true,
      thresholds: {
        NGN: 1000000,
        GHS: 5000,
        KES: 500000,
        USD: 10000
      },
      monitoring: true,
      reporting: true
    },
    kyc: {
      levels: 3,
      autoVerification: false,
      documentTypes: ['government_id', 'passport', 'driver_license', 'utility_bill', 'bank_statement'],
      faceMatch: true
    },
    pci: {
      level: 1,
      tokenization: true,
      encryption: 'AES-256'
    }
  }
};

const CURRENCY_CONFIG: CurrencyConfig = {
  supported: [
    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', decimals: 2, country: 'NG', enabled: true },
    { code: 'GHS', name: 'Ghanaian Cedi', symbol: '¢', decimals: 2, country: 'GH', enabled: true },
    { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', decimals: 2, country: 'KE', enabled: true },
    { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2, country: 'US', enabled: true },
    { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2, country: 'EU', enabled: true },
    { code: 'GBP', name: 'British Pound', symbol: '£', decimals: 2, country: 'GB', enabled: true }
  ],
  default: 'NGN',
  exchangeProvider: 'xe.com',
  updateInterval: 60000 // 1 minute
};

const RECEIPT_CONFIG: ReceiptConfig = {
  defaultFormat: 'pdf',
  deliveryMethods: ['email', 'download'],
  templates: [
    { id: 'standard', name: 'Standard Receipt', type: 'standard', layout: 'default' },
    { id: 'detailed', name: 'Detailed Receipt', type: 'detailed', layout: 'comprehensive' },
    { id: 'summary', name: 'Summary Receipt', type: 'summary', layout: 'minimal' }
  ],
  branding: {
    logo: 'assets/images/payde-logo.png',
    colors: {
      primary: '#0066CC',
      secondary: '#10B981',
      text: '#111827',
      background: '#F9FAFB'
    },
    companyInfo: {
      name: 'Payde Financial Services',
      address: '123 Financial District, Lagos, Nigeria',
      phone: '+234-700-PAYDE-NOW',
      email: 'support@payde.com',
      website: 'www.payde.com',
      license: 'CBN/PSP/2024/001'
    },
    footer: 'Thank you for choosing Payde. Your trusted financial partner.'
  }
};

const NOTIFICATION_CONFIG: NotificationConfig = {
  push: {
    enabled: true,
    provider: 'expo',
    topics: ['transactions', 'security', 'promotions', 'updates']
  },
  email: {
    enabled: true,
    provider: 'sendgrid',
    templates: [
      { id: 'welcome', name: 'Welcome Email', subject: 'Welcome to Payde!', template: 'welcome_template' },
      { id: 'transaction', name: 'Transaction Alert', subject: 'Transaction Alert', template: 'transaction_template' },
      { id: 'security', name: 'Security Alert', subject: 'Security Alert', template: 'security_template' }
    ]
  },
  sms: {
    enabled: true,
    provider: 'twilio',
    templates: [
      { id: 'otp', name: 'OTP Verification', template: 'Your Payde OTP is: {code}. Valid for 10 minutes.' },
      { id: 'transaction', name: 'Transaction Alert', template: 'Transaction of {amount} {currency} successful. Ref: {reference}' }
    ]
  }
};

// API Endpoints for different environments
const PRODUCTION_ENDPOINTS: APIEndpoints = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    logout: '/auth/logout',
    refreshToken: '/auth/refresh-token',
    verifyPhone: '/auth/verify-phone',
    verifyEmail: '/auth/verify-email',
    verifyIdentity: '/auth/verify-identity',
    setupSecurity: '/auth/setup-security',
    resetPin: '/auth/reset-pin',
    enable2FA: '/auth/enable-2fa'
  },
  transactions: {
    list: '/transactions',
    details: '/transactions/:id',
    transfer: '/transactions/transfer',
    international: '/transactions/international',
    billPayment: '/transactions/bills',
    airtime: '/transactions/airtime',
    data: '/transactions/data',
    fees: '/transactions/fees',
    limits: '/transactions/limits'
  },
  accounts: {
    profile: '/accounts/profile',
    balance: '/accounts/balance',
    statement: '/accounts/statement',
    limits: '/accounts/limits',
    preferences: '/accounts/preferences'
  },
  cards: {
    list: '/cards',
    create: '/cards/create',
    block: '/cards/:id/block',
    unblock: '/cards/:id/unblock',
    limits: '/cards/:id/limits',
    transactions: '/cards/:id/transactions'
  },
  bills: {
    categories: '/bills/categories',
    providers: '/bills/providers',
    validate: '/bills/validate',
    pay: '/bills/pay',
    history: '/bills/history'
  },
  exchange: {
    rates: '/exchange/rates',
    convert: '/exchange/convert',
    corridors: '/exchange/corridors'
  }
};

const STAGING_ENDPOINTS = PRODUCTION_ENDPOINTS;
const DEVELOPMENT_ENDPOINTS = PRODUCTION_ENDPOINTS;

// Main configuration object
const createAppConfig = (): AppConfig => {
  const envConfig = getEnvironmentConfig();
  
  return {
    environment: envConfig.environment || 'development',
    api: envConfig.api || PRODUCTION_ENDPOINTS as any,
    security: envConfig.security || SECURITY_CONFIG,
    features: envConfig.features || FEATURE_CONFIG,
    ui: UI_CONFIG,
    regional: REGIONAL_CONFIG,
    receipt: RECEIPT_CONFIG,
    currency: CURRENCY_CONFIG,
    notifications: NOTIFICATION_CONFIG
  };
};

// Export the configuration
export const AppConfig = createAppConfig();

// Configuration utilities
export const getCountryConfig = (countryCode: string): Country | undefined => {
  return AppConfig.regional.supportedCountries.find(country => country.code === countryCode);
};

export const getCurrencyConfig = (currencyCode: string): SupportedCurrency | undefined => {
  return AppConfig.currency.supported.find(currency => currency.code === currencyCode);
};

export const getTransactionLimits = (countryCode: string, kycLevel: number): TransactionLimits | undefined => {
  const country = getCountryConfig(countryCode);
  if (!country) return undefined;
  
  const kycRequirement = country.kycRequirements.find(req => req.level === kycLevel);
  return kycRequirement?.limits || country.transactionLimits;
};

export const isFeatureEnabled = (feature: keyof FeatureConfig): boolean => {
  return AppConfig.features[feature];
};

export const getAPIEndpoint = (category: keyof APIEndpoints, endpoint: string): string => {
  const categoryEndpoints = AppConfig.api.endpoints[category] as any;
  return `${AppConfig.api.baseURL}${categoryEndpoints[endpoint]}`;
};

export default AppConfig;