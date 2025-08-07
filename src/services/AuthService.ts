
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

// Types and Interfaces
export enum AuthState {
  UNAUTHENTICATED = 'unauthenticated',
  REGISTERING = 'registering',
  VERIFYING_PHONE = 'verifying_phone',
  VERIFYING_EMAIL = 'verifying_email',
  VERIFYING_IDENTITY = 'verifying_identity',
  SETTING_UP_SECURITY = 'setting_up_security',
  AUTHENTICATED = 'authenticated',
  LOCKED = 'locked',
  SESSION_EXPIRED = 'session_expired'
}

export enum KYCLevel {
  LEVEL_0 = 0, // Basic registration
  LEVEL_1 = 1, // Phone/Email verified
  LEVEL_2 = 2, // Identity documents verified
  LEVEL_3 = 3, // Enhanced verification (address, income proof)
}

export interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  nationality?: string;
  address?: Address;
  kycLevel: KYCLevel;
  status: 'active' | 'suspended' | 'pending_verification';
  preferences: UserPreferences;
  security: SecuritySettings;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface UserPreferences {
  currency: string;
  language: string;
  notifications: NotificationPreferences;
  receiptDelivery: ('email' | 'sms' | 'push' | 'download')[];
  theme: 'light' | 'dark' | 'auto';
}

export interface NotificationPreferences {
  push: boolean;
  email: boolean;
  sms: boolean;
  transactionAlerts: boolean;
  securityAlerts: boolean;
  marketingMessages: boolean;
}

export interface SecuritySettings {
  biometricEnabled: boolean;
  loginPinEnabled: boolean;
  transactionPinEnabled: boolean;
  twoFactorEnabled: boolean;
  twoFactorMethod: 'sms' | 'email' | 'totp';
  sessionTimeout: number; // minutes
  autoLockEnabled: boolean;
  autoLockTimeout: number; // minutes
}

export interface RegistrationData {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  address: Address;
  password: string;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
}

export interface IdentityDocuments {
  governmentId: DocumentUpload;
  proofOfAddress: DocumentUpload;
  selfie: DocumentUpload;
}

export interface DocumentUpload {
  uri: string;
  type: 'image' | 'pdf';
  name: string;
  size: number;
}

export interface LoginCredentials {
  email?: string;
  phone?: string;
  password?: string;
  loginPin?: string;
  biometric?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  tokenType: 'Bearer';
}

export interface OTPVerification {
  code: string;
  type: 'phone' | 'email' | 'sms' | 'totp';
  expiresAt: string;
}

// Constants
const SECURE_STORE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  LOGIN_PIN_HASH: 'login_pin_hash',
  LOGIN_PIN_SALT: 'login_pin_salt',
  TRANSACTION_PIN_HASH: 'transaction_pin_hash',
  TRANSACTION_PIN_SALT: 'transaction_pin_salt',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  USER_DATA: 'user_data',
  SECURITY_SETTINGS: 'security_settings',
  TOTP_SECRET: 'totp_secret',
  FAILED_ATTEMPTS: 'failed_attempts',
  LOCK_TIMESTAMP: 'lock_timestamp'
} as const;

const SECURITY_CONFIG = {
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION: 30 * 60 * 1000, // 30 minutes
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  PIN_EXPIRY_DAYS: 90,
  PASSWORD_MIN_LENGTH: 8,
  OTP_LENGTH: 6,
  OTP_EXPIRY_MINUTES: 10
};

class AuthService {
  private baseURL: string;
  private currentUser: User | null = null;
  private authState: AuthState = AuthState.UNAUTHENTICATED;
  private sessionTimer: NodeJS.Timeout | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.initializeAuth();
  }

  /**
   * Initialize authentication state from stored data
   */
  private async initializeAuth(): Promise<void> {
    try {
      const accessToken = await SecureStore.getItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN);
      const userData = await SecureStore.getItemAsync(SECURE_STORE_KEYS.USER_DATA);

      if (accessToken && userData) {
        this.currentUser = JSON.parse(userData);
        this.authState = AuthState.AUTHENTICATED;
        this.startSessionTimer();
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      await this.clearAuthData();
    }
  }

  /**
   * Register new user - Step 1: Basic Information
   */
  async registerUser(registrationData: RegistrationData): Promise<{ success: boolean; message: string; userId?: string }> {
    try {
      // Validate registration data
      this.validateRegistrationData(registrationData);

      // Hash password
      const hashedPassword = await this.hashPassword(registrationData.password);

      const response = await fetch(`${this.baseURL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...registrationData,
          password: hashedPassword
        }),
      });

      const result = await response.json();

      if (response.ok) {
        this.authState = AuthState.VERIFYING_PHONE;
        return {
          success: true,
          message: 'Registration successful. Please verify your phone number.',
          userId: result.userId
        };
      }

      return {
        success: false,
        message: result.message || 'Registration failed'
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Registration failed. Please try again.'
      };
    }
  }

  /**
   * Verify phone number with OTP
   */
  async verifyPhone(userId: string, otp: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseURL}/auth/verify-phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, otp }),
      });

      const result = await response.json();

      if (response.ok) {
        this.authState = AuthState.VERIFYING_EMAIL;
        return {
          success: true,
          message: 'Phone verified successfully. Please check your email for verification.'
        };
      }

      return {
        success: false,
        message: result.message || 'Phone verification failed'
      };
    } catch (error) {
      console.error('Phone verification error:', error);
      return {
        success: false,
        message: 'Verification failed. Please try again.'
      };
    }
  }

  /**
   * Verify email address with OTP
   */
  async verifyEmail(userId: string, otp: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseURL}/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, otp }),
      });

      const result = await response.json();

      if (response.ok) {
        this.authState = AuthState.VERIFYING_IDENTITY;
        return {
          success: true,
          message: 'Email verified successfully. Please upload identity documents.'
        };
      }

      return {
        success: false,
        message: result.message || 'Email verification failed'
      };
    } catch (error) {
      console.error('Email verification error:', error);
      return {
        success: false,
        message: 'Verification failed. Please try again.'
      };
    }
  }

  /**
   * Upload identity documents for KYC verification
   */
  async uploadIdentityDocuments(userId: string, documents: IdentityDocuments): Promise<{ success: boolean; message: string }> {
    try {
      const formData = new FormData();
      formData.append('userId', userId);
      
      // Add government ID
      formData.append('governmentId', {
        uri: documents.governmentId.uri,
        type: 'image/jpeg',
        name: documents.governmentId.name,
      } as any);

      // Add proof of address
      formData.append('proofOfAddress', {
        uri: documents.proofOfAddress.uri,
        type: 'image/jpeg',
        name: documents.proofOfAddress.name,
      } as any);

      // Add selfie
      formData.append('selfie', {
        uri: documents.selfie.uri,
        type: 'image/jpeg',
        name: documents.selfie.name,
      } as any);

      const response = await fetch(`${this.baseURL}/auth/verify-identity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        this.authState = AuthState.SETTING_UP_SECURITY;
        return {
          success: true,
          message: 'Documents uploaded successfully. Please set up your security preferences.'
        };
      }

      return {
        success: false,
        message: result.message || 'Document upload failed'
      };
    } catch (error) {
      console.error('Document upload error:', error);
      return {
        success: false,
        message: 'Upload failed. Please try again.'
      };
    }
  }

  /**
   * Set up security preferences
   */
  async setupSecurity(userId: string, securitySettings: Partial<SecuritySettings>): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseURL}/auth/setup-security`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, ...securitySettings }),
      });

      const result = await response.json();

      if (response.ok) {
        await SecureStore.setItemAsync(SECURE_STORE_KEYS.SECURITY_SETTINGS, JSON.stringify(securitySettings));
        return {
          success: true,
          message: 'Security setup completed successfully.'
        };
      }

      return {
        success: false,
        message: result.message || 'Security setup failed'
      };
    } catch (error) {
      console.error('Security setup error:', error);
      return {
        success: false,
        message: 'Setup failed. Please try again.'
      };
    }
  }

  /**
   * Create and store login PIN
   */
  async createLoginPIN(pin: string): Promise<{ success: boolean; message: string }> {
    try {
      if (pin.length !== 6 || !/^\d+$/.test(pin)) {
        return {
          success: false,
          message: 'PIN must be exactly 6 digits'
        };
      }

      const salt = await this.generateSalt();
      const hashedPin = await this.hashPIN(pin, salt);

      await SecureStore.setItemAsync(SECURE_STORE_KEYS.LOGIN_PIN_HASH, hashedPin);
      await SecureStore.setItemAsync(SECURE_STORE_KEYS.LOGIN_PIN_SALT, salt);

      return {
        success: true,
        message: 'Login PIN created successfully'
      };
    } catch (error) {
      console.error('Error creating login PIN:', error);
      return {
        success: false,
        message: 'Failed to create login PIN'
      };
    }
  }

  /**
   * Create and store transaction PIN
   */
  async createTransactionPIN(pin: string): Promise<{ success: boolean; message: string }> {
    try {
      if (pin.length !== 4 || !/^\d+$/.test(pin)) {
        return {
          success: false,
          message: 'Transaction PIN must be exactly 4 digits'
        };
      }

      const salt = await this.generateSalt();
      const hashedPin = await this.hashPIN(pin, salt);

      await SecureStore.setItemAsync(SECURE_STORE_KEYS.TRANSACTION_PIN_HASH, hashedPin);
      await SecureStore.setItemAsync(SECURE_STORE_KEYS.TRANSACTION_PIN_SALT, salt);

      return {
        success: true,
        message: 'Transaction PIN created successfully'
      };
    } catch (error) {
      console.error('Error creating transaction PIN:', error);
      return {
        success: false,
        message: 'Failed to create transaction PIN'
      };
    }
  }

  /**
   * Login with credentials
   */
  async login(credentials: LoginCredentials): Promise<{ success: boolean; message: string; tokens?: AuthTokens; user?: User }> {
    try {
      // Check if account is locked
      const isLocked = await this.isAccountLocked();
      if (isLocked) {
        return {
          success: false,
          message: 'Account is temporarily locked due to too many failed attempts. Please try again later.'
        };
      }

      let authResult: any;

      if (credentials.biometric) {
        authResult = await this.authenticateWithBiometric();
      } else if (credentials.loginPin) {
        authResult = await this.authenticateWithPIN(credentials.loginPin);
      } else if (credentials.email && credentials.password) {
        authResult = await this.authenticateWithPassword(credentials.email, credentials.password);
      } else {
        return {
          success: false,
          message: 'Invalid login credentials'
        };
      }

      if (authResult.success) {
        await this.clearFailedAttempts();
        this.authState = AuthState.AUTHENTICATED;
        this.currentUser = authResult.user;
        await this.storeAuthTokens(authResult.tokens);
        await SecureStore.setItemAsync(SECURE_STORE_KEYS.USER_DATA, JSON.stringify(authResult.user));
        this.startSessionTimer();

        return {
          success: true,
          message: 'Login successful',
          tokens: authResult.tokens,
          user: authResult.user
        };
      } else {
        await this.incrementFailedAttempts();
        return authResult;
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed. Please try again.'
      };
    }
  }

  /**
   * Authenticate with biometric
   */
  private async authenticateWithBiometric(): Promise<any> {
    try {
      const biometricEnabled = await SecureStore.getItemAsync(SECURE_STORE_KEYS.BIOMETRIC_ENABLED);
      if (!biometricEnabled) {
        return {
          success: false,
          message: 'Biometric authentication not enabled'
        };
      }

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        return {
          success: false,
          message: 'Biometric authentication not available'
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access your account',
        fallbackLabel: 'Use PIN instead',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Get stored user data and create session
        const userData = await SecureStore.getItemAsync(SECURE_STORE_KEYS.USER_DATA);
        const accessToken = await SecureStore.getItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN);

        if (userData && accessToken) {
          return {
            success: true,
            user: JSON.parse(userData),
            tokens: {
              accessToken,
              refreshToken: await SecureStore.getItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN),
              expiresAt: new Date(Date.now() + SECURITY_CONFIG.SESSION_TIMEOUT).toISOString(),
              tokenType: 'Bearer'
            }
          };
        }
      }

      return {
        success: false,
        message: 'Biometric authentication failed'
      };
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return {
        success: false,
        message: 'Biometric authentication failed'
      };
    }
  }

  /**
   * Authenticate with PIN
   */
  private async authenticateWithPIN(pin: string): Promise<any> {
    try {
      const isValid = await this.verifyLoginPIN(pin);
      if (!isValid) {
        return {
          success: false,
          message: 'Invalid PIN'
        };
      }

      // Get stored user data and create session
      const userData = await SecureStore.getItemAsync(SECURE_STORE_KEYS.USER_DATA);
      const accessToken = await SecureStore.getItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN);

      if (userData && accessToken) {
        return {
          success: true,
          user: JSON.parse(userData),
          tokens: {
            accessToken,
            refreshToken: await SecureStore.getItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN),
            expiresAt: new Date(Date.now() + SECURITY_CONFIG.SESSION_TIMEOUT).toISOString(),
            tokenType: 'Bearer'
          }
        };
      }

      return {
        success: false,
        message: 'Authentication failed'
      };
    } catch (error) {
      console.error('PIN authentication error:', error);
      return {
        success: false,
        message: 'PIN authentication failed'
      };
    }
  }

  /**
   * Authenticate with password
   */
  private async authenticateWithPassword(email: string, password: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          user: result.user,
          tokens: result.tokens
        };
      }

      return {
        success: false,
        message: result.message || 'Login failed'
      };
    } catch (error) {
      console.error('Password authentication error:', error);
      return {
        success: false,
        message: 'Authentication failed'
      };
    }
  }

  /**
   * Verify login PIN
   */
  async verifyLoginPIN(pin: string): Promise<boolean> {
    try {
      const storedHash = await SecureStore.getItemAsync(SECURE_STORE_KEYS.LOGIN_PIN_HASH);
      const salt = await SecureStore.getItemAsync(SECURE_STORE_KEYS.LOGIN_PIN_SALT);

      if (!storedHash || !salt) {
        return false;
      }

      const inputHash = await this.hashPIN(pin, salt);
      return storedHash === inputHash;
    } catch (error) {
      console.error('Error verifying login PIN:', error);
      return false;
    }
  }

  /**
   * Verify transaction PIN
   */
  async verifyTransactionPIN(pin: string): Promise<boolean> {
    try {
      const storedHash = await SecureStore.getItemAsync(SECURE_STORE_KEYS.TRANSACTION_PIN_HASH);
      const salt = await SecureStore.getItemAsync(SECURE_STORE_KEYS.TRANSACTION_PIN_SALT);

      if (!storedHash || !salt) {
        return false;
      }

      const inputHash = await this.hashPIN(pin, salt);
      return storedHash === inputHash;
    } catch (error) {
      console.error('Error verifying transaction PIN:', error);
      return false;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      // Call backend to invalidate tokens
      const accessToken = await SecureStore.getItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN);
      if (accessToken) {
        await fetch(`${this.baseURL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
      }

      // Clear local data
      await this.clearAuthData();
      this.stopSessionTimer();
      this.authState = AuthState.UNAUTHENTICATED;
      this.currentUser = null;

      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        message: 'Logout failed'
      };
    }
  }

  /**
   * Refresh authentication tokens
   */
  private async refreshTokens(): Promise<boolean> {
    try {
      const refreshToken = await SecureStore.getItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        return false;
      }

      const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const result = await response.json();
        await this.storeAuthTokens(result.tokens);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  /**
   * Helper methods
   */
  private async generateSalt(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    return Array.from(randomBytes, byte => (byte as number).toString(16).padStart(2, '0')).join('');
  }

  private async hashPIN(pin: string, salt: string): Promise<string> {
    const combined = pin + salt;
    return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, combined);
  }

  private async hashPassword(password: string): Promise<string> {
    return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
  }

  private async storeAuthTokens(tokens: AuthTokens): Promise<void> {
    await SecureStore.setItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    await SecureStore.setItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
  }

  private async clearAuthData(): Promise<void> {
    const keys = Object.values(SECURE_STORE_KEYS);
    await Promise.all(keys.map(key => SecureStore.deleteItemAsync(key).catch(() => {})));
  }

  private startSessionTimer(): void {
    this.stopSessionTimer();
    this.sessionTimer = setTimeout(() => {
      this.handleSessionExpiry();
    }, SECURITY_CONFIG.SESSION_TIMEOUT);
  }

  private stopSessionTimer(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
  }

  private async handleSessionExpiry(): Promise<void> {
    const refreshed = await this.refreshTokens();
    if (refreshed) {
      this.startSessionTimer();
    } else {
      this.authState = AuthState.SESSION_EXPIRED;
      await this.clearAuthData();
      this.currentUser = null;
    }
  }

  private async incrementFailedAttempts(): Promise<void> {
    const attempts = await this.getFailedAttempts();
    const newAttempts = attempts + 1;
    
    await SecureStore.setItemAsync(SECURE_STORE_KEYS.FAILED_ATTEMPTS, newAttempts.toString());
    
    if (newAttempts >= SECURITY_CONFIG.MAX_FAILED_ATTEMPTS) {
      await SecureStore.setItemAsync(SECURE_STORE_KEYS.LOCK_TIMESTAMP, Date.now().toString());
    }
  }

  private async clearFailedAttempts(): Promise<void> {
    await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.FAILED_ATTEMPTS);
    await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.LOCK_TIMESTAMP);
  }

  private async getFailedAttempts(): Promise<number> {
    const attempts = await SecureStore.getItemAsync(SECURE_STORE_KEYS.FAILED_ATTEMPTS);
    return attempts ? parseInt(attempts) : 0;
  }

  private async isAccountLocked(): Promise<boolean> {
    const lockTimestamp = await SecureStore.getItemAsync(SECURE_STORE_KEYS.LOCK_TIMESTAMP);
    if (!lockTimestamp) {
      return false;
    }

    const lockedAt = parseInt(lockTimestamp);
    const now = Date.now();
    
    return (now - lockedAt) < SECURITY_CONFIG.LOCKOUT_DURATION;
  }

  private validateRegistrationData(data: RegistrationData): void {
    if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) {
      throw new Error('Invalid email address');
    }
    
    if (!data.phone || data.phone.length < 10) {
      throw new Error('Invalid phone number');
    }
    
    if (!data.password || data.password.length < SECURITY_CONFIG.PASSWORD_MIN_LENGTH) {
      throw new Error(`Password must be at least ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH} characters long`);
    }
    
    if (!data.firstName || !data.lastName) {
      throw new Error('First name and last name are required');
    }
    
    if (!data.acceptedTerms || !data.acceptedPrivacy) {
      throw new Error('You must accept the terms and privacy policy');
    }
  }

  // Public getters
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getAuthState(): AuthState {
    return this.authState;
  }

  isAuthenticated(): boolean {
    return this.authState === AuthState.AUTHENTICATED && this.currentUser !== null;
  }
}

export default AuthService;