// Navigation param list types for React Navigation

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  OTPVerification: { userId: string; type: 'phone' | 'email' };
  SetupSecurity: { userId: string };
};

export type MainStackParamList = {
  MainTabs: undefined;
  TransactionHistory: undefined;
  TransactionDetails: { transactionId: string };
  AirtimePurchase: undefined;
  Notifications: undefined;
  Settings: undefined;
  AccountDetails: undefined;
};

export type TabParamList = {
  Home: undefined;
  Transfer: {
    amount?: number;
    recipient?: string;
    type?: 'domestic' | 'international';
  } | undefined;
  Bills: undefined;
  Cards: undefined;
  Profile: undefined;
};
