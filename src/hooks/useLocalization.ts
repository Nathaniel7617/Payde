// src/hooks/useLocalization.ts
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { I18nManager } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Localization from 'expo-localization';

// Supported languages
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  sw: 'Kiswahili',
  ha: 'Hausa',
  yo: 'Yorùbá',
  ig: 'Igbo',
  tw: 'Twi',
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// Translation keys and values
interface Translations {
  // Common
  common: {
    yes: string;
    no: string;
    ok: string;
    cancel: string;
    save: string;
    edit: string;
    delete: string;
    confirm: string;
    back: string;
    next: string;
    done: string;
    loading: string;
    error: string;
    success: string;
    retry: string;
    pressed: string;
  };
  
  // Authentication
  auth: {
    login: string;
    register: string;
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    forgotPassword: string;
    loginSuccess: string;
    loginFailed: string;
    logout: string;
    biometricLogin: string;
    pinLogin: string;
  };
  
  // Dashboard
  dashboard: {
    welcome: string;
    balance: string;
    quickActions: string;
    recentTransactions: string;
    sendMoney: string;
    requestMoney: string;
    payBills: string;
    buyAirtime: string;
    cards: string;
    more: string;
  };
  
  // Transactions
  transactions: {
    history: string;
    details: string;
    amount: string;
    recipient: string;
    description: string;
    reference: string;
    status: string;
    date: string;
    fees: string;
    successful: string;
    pending: string;
    failed: string;
    cancelled: string;
    processing: string;
  };
  
  // Currency
  currency: {
    naira: string;
    cedi: string;
    shilling: string;
    dollar: string;
    euro: string;
    pound: string;
  };
  
  // Security
  security: {
    enterPin: string;
    confirmPin: string;
    pinMismatch: string;
    biometricAuth: string;
    deviceSecurity: string;
    securityCheck: string;
  };
}

// English translations (default)
const enTranslations: Translations = {
  common: {
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    done: 'Done',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    retry: 'Retry',
    pressed: 'pressed',
  },
  auth: {
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    firstName: 'First Name',
    lastName: 'Last Name',
    phoneNumber: 'Phone Number',
    forgotPassword: 'Forgot Password?',
    loginSuccess: 'Login successful',
    loginFailed: 'Login failed',
    logout: 'Logout',
    biometricLogin: 'Biometric Login',
    pinLogin: 'PIN Login',
  },
  dashboard: {
    welcome: 'Welcome',
    balance: 'Balance',
    quickActions: 'Quick Actions',
    recentTransactions: 'Recent Transactions',
    sendMoney: 'Send Money',
    requestMoney: 'Request Money',
    payBills: 'Pay Bills',
    buyAirtime: 'Buy Airtime',
    cards: 'Cards',
    more: 'More',
  },
  transactions: {
    history: 'Transaction History',
    details: 'Transaction Details',
    amount: 'Amount',
    recipient: 'Recipient',
    description: 'Description',
    reference: 'Reference',
    status: 'Status',
    date: 'Date',
    fees: 'Fees',
    successful: 'Successful',
    pending: 'Pending',
    failed: 'Failed',
    cancelled: 'Cancelled',
    processing: 'Processing',
  },
  currency: {
    naira: 'Nigerian Naira',
    cedi: 'Ghanaian Cedi',
    shilling: 'Kenyan Shilling',
    dollar: 'US Dollar',
    euro: 'Euro',
    pound: 'British Pound',
  },
  security: {
    enterPin: 'Enter PIN',
    confirmPin: 'Confirm PIN',
    pinMismatch: 'PINs do not match',
    biometricAuth: 'Biometric Authentication',
    deviceSecurity: 'Device Security',
    securityCheck: 'Security Check',
  },
};

// Swahili translations
const swTranslations: Translations = {
  common: {
    yes: 'Ndiyo',
    no: 'Hapana',
    ok: 'Sawa',
    cancel: 'Ghairi',
    save: 'Hifadhi',
    edit: 'Hariri',
    delete: 'Futa',
    confirm: 'Thibitisha',
    back: 'Rudi',
    next: 'Ifuatayo',
    done: 'Imemaliza',
    loading: 'Inapakia...',
    error: 'Hitilafu',
    success: 'Mafanikio',
    retry: 'Jaribu tena',
    pressed: 'imebonyezwa',
  },
  auth: {
    login: 'Ingia',
    register: 'Jisajili',
    email: 'Barua pepe',
    password: 'Nywila',
    confirmPassword: 'Thibitisha Nywila',
    firstName: 'Jina la Kwanza',
    lastName: 'Jina la Mwisho',
    phoneNumber: 'Nambari ya Simu',
    forgotPassword: 'Umesahau Nywila?',
    loginSuccess: 'Umeingia kwa mafanikio',
    loginFailed: 'Kuingia kumeshindwa',
    logout: 'Toka',
    biometricLogin: 'Kuingia kwa Kibayometriki',
    pinLogin: 'Kuingia kwa PIN',
  },
  dashboard: {
    welcome: 'Karibu',
    balance: 'Salio',
    quickActions: 'Vitendo vya Haraka',
    recentTransactions: 'Miamala ya Hivi Karibuni',
    sendMoney: 'Tuma Pesa',
    requestMoney: 'Omba Pesa',
    payBills: 'Lipa Bili',
    buyAirtime: 'Nunua Muda wa Maongezi',
    cards: 'Kadi',
    more: 'Zaidi',
  },
  transactions: {
    history: 'Historia ya Miamala',
    details: 'Maelezo ya Muamala',
    amount: 'Kiasi',
    recipient: 'Mpokeaji',
    description: 'Maelezo',
    reference: 'Rejeleo',
    status: 'Hali',
    date: 'Tarehe',
    fees: 'Ada',
    successful: 'Imefanikiwa',
    pending: 'Inasubiri',
    failed: 'Imeshindwa',
    cancelled: 'Imeghairiwa',
    processing: 'Inachakatwa',
  },
  currency: {
    naira: 'Naira ya Nigeria',
    cedi: 'Cedi ya Ghana',
    shilling: 'Shilingi ya Kenya',
    dollar: 'Dola ya Marekani',
    euro: 'Euro',
    pound: 'Pauni ya Uingereza',
  },
  security: {
    enterPin: 'Ingiza PIN',
    confirmPin: 'Thibitisha PIN',
    pinMismatch: 'PIN hazilingani',
    biometricAuth: 'Uthibitishaji wa Kibayometriki',
    deviceSecurity: 'Usalama wa Kifaa',
    securityCheck: 'Ukaguzi wa Usalama',
  },
};

// All translations
const translations: Record<SupportedLanguage, Translations> = {
  en: enTranslations,
  sw: swTranslations,
  ha: enTranslations, // Placeholder - would need proper Hausa translations
  yo: enTranslations, // Placeholder - would need proper Yoruba translations
  ig: enTranslations, // Placeholder - would need proper Igbo translations
  tw: enTranslations, // Placeholder - would need proper Twi translations
};

interface LocalizationContextType {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  t: (key: string) => string;
  isRTL: boolean;
  formatCurrency: (amount: number, currency: string) => string;
  formatPhoneNumber: (phone: string, country: string) => string;
  formatDate: (date: Date | string) => string;
  formatTime: (date: Date | string) => string;
  formatDateTime: (date: Date | string) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

interface LocalizationProviderProps {
  children: ReactNode;
}

export const LocalizationProvider: React.FC<LocalizationProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [isRTL, setIsRTL] = useState(false);

  useEffect(() => {
    loadLanguagePreference();
  }, []);

  useEffect(() => {
    // Update RTL layout
    const shouldBeRTL = ['ar'].includes(language); // Add RTL languages here
    setIsRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
  }, [language]);

  const loadLanguagePreference = async () => {
    try {
      const savedLanguage = await SecureStore.getItemAsync('language_preference');
      if (savedLanguage && savedLanguage in SUPPORTED_LANGUAGES) {
        setLanguage(savedLanguage as SupportedLanguage);
      } else {
        // Use device locale as fallback
        const deviceLocale = Localization.locale.split('-')[0];
        if (deviceLocale in SUPPORTED_LANGUAGES) {
          setLanguage(deviceLocale as SupportedLanguage);
        }
      }
    } catch (error) {
      console.error('Failed to load language preference:', error);
    }
  };

  const saveLanguagePreference = async (lang: SupportedLanguage) => {
    try {
      await SecureStore.setItemAsync('language_preference', lang);
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  };

  const handleSetLanguage = (lang: SupportedLanguage) => {
    setLanguage(lang);
    saveLanguagePreference(lang);
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    if (typeof value === 'string') {
      return value;
    }
    
    // Fallback to English
    value = translations.en;
    for (const k of keys) {
      value = value?.[k];
    }
    
    return typeof value === 'string' ? value : key;
  };

  const formatCurrency = (amount: number, currency: string): string => {
    const currencySymbols: Record<string, string> = {
      NGN: '₦',
      GHS: '₵',
      KES: 'KSh',
      USD: '$',
      EUR: '€',
      GBP: '£',
    };

    const symbol = currencySymbols[currency] || currency;
    
    try {
      return new Intl.NumberFormat(getLocaleForLanguage(language), {
        style: 'currency',
        currency: currency,
        currencyDisplay: 'symbol',
      }).format(amount).replace(/[A-Z]{3}/, symbol);
    } catch (error) {
      // Fallback formatting
      return `${symbol}${amount.toLocaleString()}`;
    }
  };

  const formatPhoneNumber = (phone: string, country: string): string => {
    // Remove non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    switch (country) {
      case 'NG':
        // Nigerian format: +234 xxx xxx xxxx
        if (cleaned.length === 11 && cleaned.startsWith('0')) {
          return `+234 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
        }
        break;
      case 'GH':
        // Ghanaian format: +233 xx xxx xxxx
        if (cleaned.length === 10) {
          return `+233 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
        }
        break;
      case 'KE':
        // Kenyan format: +254 xxx xxx xxx
        if (cleaned.length === 10) {
          return `+254 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
        }
        break;
    }
    
    return phone;
  };

  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    try {
      return new Intl.DateTimeFormat(getLocaleForLanguage(language), {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(dateObj);
    } catch (error) {
      return dateObj.toLocaleDateString();
    }
  };

  const formatTime = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    try {
      return new Intl.DateTimeFormat(getLocaleForLanguage(language), {
        hour: '2-digit',
        minute: '2-digit',
      }).format(dateObj);
    } catch (error) {
      return dateObj.toLocaleTimeString();
    }
  };

  const formatDateTime = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    try {
      return new Intl.DateTimeFormat(getLocaleForLanguage(language), {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(dateObj);
    } catch (error) {
      return dateObj.toLocaleString();
    }
  };

  const value: LocalizationContextType = {
    language,
    setLanguage: handleSetLanguage,
    t,
    isRTL,
    formatCurrency,
    formatPhoneNumber,
    formatDate,
    formatTime,
    formatDateTime,
  };

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
};

const getLocaleForLanguage = (language: SupportedLanguage): string => {
  const localeMap: Record<SupportedLanguage, string> = {
    en: 'en-US',
    sw: 'sw-KE',
    ha: 'ha-NG',
    yo: 'yo-NG',
    ig: 'ig-NG',
    tw: 'tw-GH',
  };
  
  return localeMap[language] || 'en-US';
};

export const useLocalization = (): LocalizationContextType => {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};

export default useLocalization;