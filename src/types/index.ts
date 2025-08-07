// src/types/index.ts

// Base Types
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// User Types
export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  country: string;
  currency: string;
  accountNumber: string;
  kycLevel: 'basic' | 'intermediate' | 'enhanced';
  isVerified: boolean;
  profilePicture?: string;
  dateOfBirth?: string;
  address?: Address;
  preferences: UserPreferences;
  security: SecuritySettings;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface UserPreferences {
  language: string;
  currency: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  push: boolean;
  email: boolean;
  sms: boolean;
  transactionAlerts: boolean;
  securityAlerts: boolean;
  marketingEmails: boolean;
}

export interface SecuritySettings {
  biometricEnabled: boolean;
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  loginAlerts: boolean;
  deviceTrust: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private';
  transactionPrivacy: boolean;
  dataSharing: boolean;
}

// Transaction Types
export enum TransactionType {
  DOMESTIC_TRANSFER = 'domestic_transfer',
  INTERNATIONAL_TRANSFER = 'international_transfer',
  BILL_PAYMENT = 'bill_payment',
  AIRTIME_PURCHASE = 'airtime_purchase',
  DATA_PURCHASE = 'data_purchase',
  CARD_TRANSACTION = 'card_transaction',
  WALLET_FUNDING = 'wallet_funding',
  WITHDRAWAL = 'withdrawal',
  REFUND = 'refund'
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  SUCCESSFUL = 'successful', // Alias for COMPLETED
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REVERSED = 'reversed',
  REQUIRES_VERIFICATION = 'requires_verification'
}

export interface Transaction extends BaseEntity {
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  convertedAmount?: number;
  targetCurrency?: string;
  exchangeRate?: number;
  description: string;
  reference: string;
  
  // Sender information
  senderId: string;
  senderName: string;
  senderAccount: string;
  senderPhone?: string;
  senderEmail?: string;
  
  // Recipient information
  recipientName: string;
  recipientAccount?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  recipientBank?: string;
  
  // Financial details
  fees: TransactionFees;
  balanceSnapshot?: BalanceSnapshot;
  
  // Timestamps
  completedAt?: string;
  failedAt?: string;
  cancelledAt?: string;
  
  // Additional info
  additionalInfo?: Record<string, any>;
  receipt?: TransactionReceipt;
  confirmationCode?: string;
  estimatedCompletion?: string;
}

export interface TransactionFees {
  transactionFee: number;
  exchangeFee?: number;
  processingFee?: number;
  total: number;
}

export interface BalanceSnapshot {
  before: number;
  after: number;
  currency: string;
}

export interface TransactionReceipt {
  id: string;
  transactionId: string;
  status: TransactionStatus;
  amount: number;
  currency: string;
  fees: TransactionFees;
  timestamp: string;
  reference: string;
  description: string;
  sender: {
    name: string;
    account: string;
  };
  recipient: {
    name: string;
    account?: string;
  };
}

export interface FeeCalculation {
  transactionFee: number;
  exchangeFee: number;
  processingFee: number;
  total: number;
  totalAmount: number; // Adding the missing property
  breakdown: {
    baseAmount: number;
    feeAmount: number;
    finalAmount: number;
  };
}

// Account Types
export interface Account extends BaseEntity {
  accountNumber: string;
  accountName: string;
  accountType: 'savings' | 'current' | 'fixed';
  currency: string;
  balance: number;
  availableBalance: number;
  pendingBalance: number;
  isActive: boolean;
  isPrimary: boolean;
}

// Card Types
export interface Card extends BaseEntity {
  pan: string;
  maskedPan: string;
  expiryDate: string;
  cardType: 'visa' | 'mastercard' | 'verve';
  cardCategory: 'debit' | 'credit' | 'prepaid';
  isVirtual: boolean;
  status: 'active' | 'blocked' | 'expired' | 'pending';
  currency: string;
  balance?: number;
  spendingLimit: {
    daily: number;
    monthly: number;
  };
  restrictions: {
    onlineTransactions: boolean;
    internationalTransactions: boolean;
    atmWithdrawals: boolean;
    contactlessPayments: boolean;
  };
}

// Beneficiary Types
export interface Beneficiary extends BaseEntity {
  name: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
  phoneNumber?: string;
  email?: string;
  country: string;
  currency: string;
  isFrequent: boolean;
  lastUsed?: string;
  transactionCount: number;
}

// Notification Types
export interface Notification extends BaseEntity {
  type: 'info' | 'success' | 'warning' | 'error' | 'transaction' | 'security';
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  action?: {
    label: string;
    url: string;
  };
  metadata?: Record<string, any>;
}

// Security Types
export interface SecurityCheck {
  passed: boolean;
  risk: 'none' | 'low' | 'medium' | 'high' | 'critical';
  details: string;
  timestamp: number;
}

export interface DeviceSecurityReport {
  timestamp: number;
  deviceId: string;
  checks: {
    [key: string]: SecurityCheck;
  };
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

export interface BiometricCapabilities {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: string[];
  securityLevel: 'none' | 'low' | 'medium' | 'high';
}

// Currency Types
export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  decimalPlaces: number;
  isActive: boolean;
  country: string;
  region: 'africa' | 'europe' | 'americas' | 'asia' | 'oceania';
}

export interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  inverseRate: number;
  timestamp: number;
  source: string;
  spread?: number;
  midRate?: number;
  buyRate?: number;
  sellRate?: number;
}

// Navigation Types
export type RootStackParamList = {
  // Auth Stack
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  OTPVerification: { phone: string; email: string };
  SetupPIN: undefined;
  BiometricSetup: undefined;
  
  // Main App
  MainTabs: undefined;
  Dashboard: undefined;
  
  // Transaction Stack
  SendMoney: undefined;
  RequestMoney: undefined;
  TransactionHistory: undefined;
  TransactionDetails: { transactionId: string };
  
  // Cards Stack
  Cards: undefined;
  CardDetails: { cardId: string };
  CreateVirtualCard: undefined;
  
  // More Stack
  Profile: undefined;
  Settings: undefined;
  Security: undefined;
  Notifications: undefined;
  Help: undefined;
  
  // Bill Payment
  BillPayment: undefined;
  AirtimePurchase: undefined;
  DataPurchase: undefined;
  
  // Modals
  QRScanner: undefined;
  ContactPicker: undefined;
};

export type TabParamList = {
  Home: undefined;
  Transactions: undefined;
  Cards: undefined;
  More: undefined;
};

// Component Props Types
export interface QuickActionButtonProps {
  title: string;
  icon: string;
  color: string;
  onPress: () => void;
  flex?: number;
}

export interface TransactionListItemProps {
  transaction: Transaction;
  onPress: () => void;
  showDivider?: boolean;
}

export interface NotificationBannerProps {
  notification: Notification;
  onPress: () => void;
  onDismiss: () => void;
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode: number;
  timestamp: number;
  requestId?: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  country: string;
  currency: string;
  acceptTerms: boolean;
}

export interface TransferFormData {
  recipientType: 'account' | 'phone' | 'email';
  recipient: string;
  amount: number;
  currency: string;
  description: string;
  saveAsBeneficiary: boolean;
}

// Hook Types
export interface UseRealTimeDataOptions {
  userId: string;
  enableTransactionUpdates: boolean;
  enableBalanceUpdates: boolean;
  enableSecurityAlerts: boolean;
}

// Error Types
export interface AppError extends Error {
  code: string;
  statusCode?: number;
  details?: any;
}

// Theme Types
export interface ThemeColors {
  primary: string;
  primaryLight: string;
  secondary: string;
  secondaryLight: string;
  accent: string;
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  white: string;
  black: string;
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface ThemeFonts {
  regular: string;
  medium: string;
  semiBold: string;
  bold: string;
}

export interface ThemeFontSizes {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface ThemeBorderRadius {
  small: number;
  medium: number;
  large: number;
  full: number;
}

export interface Theme {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  fonts: ThemeFonts;
  fontSizes: ThemeFontSizes;
  borderRadius: ThemeBorderRadius;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Export all types
export * from './auth';
export * from './transaction';
export * from './card';
export * from './notification';

// Default export
export default {
  TransactionType,
  TransactionStatus,
};