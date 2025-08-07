
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { AuthService } from '../../services/AuthService';
import { BiometricService } from '../../services/BiometricService';
import { DeviceSecurityService } from '../../services/DeviceSecurityService';
import { EncryptionService } from '../../services/EncryptionService';

// Types
export interface User {
  id: string;
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
  security: SecuritySettings;
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

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  lastActivity: number;
  sessionExpiry: number;
  loginAttempts: number;
  isLocked: boolean;
  lockoutExpiry: number;
  biometricSupport: BiometricCapabilities | null;
  deviceSecurity: DeviceSecurityStatus;
  registrationFlow: RegistrationFlow;
}

export interface BiometricCapabilities {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: string[];
  securityLevel: 'none' | 'low' | 'medium' | 'high';
}

export interface DeviceSecurityStatus {
  isSecure: boolean;
  threats: string[];
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  lastCheck: number;
}

export interface RegistrationFlow {
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
  userData: Partial<User>;
  verificationData: {
    email: boolean;
    phone: boolean;
    identity: boolean;
    address: boolean;
  };
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  isInitializing: true,
  error: null,
  lastActivity: Date.now(),
  sessionExpiry: 0,
  loginAttempts: 0,
  isLocked: false,
  lockoutExpiry: 0,
  biometricSupport: null,
  deviceSecurity: {
    isSecure: true,
    threats: [],
    riskLevel: 'none',
    lastCheck: Date.now()
  },
  registrationFlow: {
    currentStep: 1,
    totalSteps: 6,
    completedSteps: [],
    userData: {},
    verificationData: {
      email: false,
      phone: false,
      identity: false,
      address: false
    }
  }
};

// Services
const authService = new AuthService();
const biometricService = new BiometricService();
const deviceSecurityService = new DeviceSecurityService();
const encryptionService = new EncryptionService();

// Async thunks
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      // Check device security first
      const securityReport = await deviceSecurityService.performSecurityChecks();
      
      if (securityReport.riskLevel === 'critical') {
        throw new Error('Device security compromised');
      }

      // Check for stored credentials
      const token = await SecureStore.getItemAsync('auth_token');
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      
      if (token && refreshToken) {
        // Validate token and get user data
        const userData = await authService.validateToken(token);
        if (userData) {
          return {
            user: userData,
            token,
            refreshToken,
            deviceSecurity: {
              isSecure: securityReport.riskLevel !== 'critical',
              threats: securityReport.checks.filter(check => !check.passed).map(check => check.details),
              riskLevel: securityReport.riskLevel,
              lastCheck: Date.now()
            }
          };
        }
      }

      // Check biometric capabilities
      const biometricCapabilities = await biometricService.checkBiometricSupport();
      
      return {
        biometricSupport: biometricCapabilities,
        deviceSecurity: {
          isSecure: securityReport.riskLevel !== 'critical',
          threats: securityReport.checks.filter(check => !check.passed).map(check => check.details),
          riskLevel: securityReport.riskLevel,
          lastCheck: Date.now()
        }
      };

    } catch (error) {
      return rejectWithValue(error.message || 'Initialization failed');
    }
  }
);

export const loginWithCredentials = createAsyncThunk(
  'auth/loginWithCredentials',
  async (
    credentials: { email: string; password: string; rememberMe: boolean },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { auth: AuthState };
      
      // Check if account is locked
      if (state.auth.isLocked && Date.now() < state.auth.lockoutExpiry) {
        throw new Error('Account temporarily locked due to too many failed attempts');
      }

      // Perform device security check
      const securityReport = await deviceSecurityService.performSecurityChecks();
      if (securityReport.riskLevel === 'critical') {
        throw new Error('Device security compromised');
      }

      const result = await authService.login(credentials);
      
      if (result.success) {
        // Store tokens securely
        await SecureStore.setItemAsync('auth_token', result.token);
        await SecureStore.setItemAsync('refresh_token', result.refreshToken);
        
        if (credentials.rememberMe) {
          await SecureStore.setItemAsync('remember_user', credentials.email);
        }

        return {
          user: result.user,
          token: result.token,
          refreshToken: result.refreshToken,
          sessionExpiry: Date.now() + (8 * 60 * 60 * 1000) // 8 hours
        };
      } else {
        throw new Error(result.error || 'Login failed');
      }

    } catch (error) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const loginWithBiometric = createAsyncThunk(
  'auth/loginWithBiometric',
  async (reason: string = 'Authenticate to access your account', { rejectWithValue }) => {
    try {
      const biometricResult = await biometricService.authenticateWithBiometric(reason);
      
      if (!biometricResult.success) {
        throw new Error(biometricResult.error || 'Biometric authentication failed');
      }

      // Get stored user data associated with biometric
      const encryptedUserData = await SecureStore.getItemAsync('biometric_user_data');
      if (!encryptedUserData) {
        throw new Error('No biometric login data found');
      }

      const userData = JSON.parse(await encryptionService.decrypt(JSON.parse(encryptedUserData)));
      
      // Generate new session token
      const sessionResult = await authService.createBiometricSession(userData.userId);
      
      return {
        user: userData,
        token: sessionResult.token,
        refreshToken: sessionResult.refreshToken,
        sessionExpiry: Date.now() + (8 * 60 * 60 * 1000)
      };

    } catch (error) {
      return rejectWithValue(error.message || 'Biometric login failed');
    }
  }
);

export const loginWithPIN = createAsyncThunk(
  'auth/loginWithPIN',
  async (pin: string, { rejectWithValue }) => {
    try {
      const result = await authService.loginWithPIN(pin);
      
      if (result.success) {
        return {
          user: result.user,
          token: result.token,
          refreshToken: result.refreshToken,
          sessionExpiry: Date.now() + (8 * 60 * 60 * 1000)
        };
      } else {
        throw new Error(result.error || 'PIN login failed');
      }

    } catch (error) {
      return rejectWithValue(error.message || 'PIN login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (registrationData: any, { rejectWithValue }) => {
    try {
      const result = await authService.register(registrationData);
      
      if (result.success) {
        return {
          user: result.user,
          registrationStep: result.nextStep || 'email_verification'
        };
      } else {
        throw new Error(result.error || 'Registration failed');
      }

    } catch (error) {
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async (
    { sessionId, otp, type }: { sessionId: string; otp: string; type: 'email' | 'sms' },
    { rejectWithValue }
  ) => {
    try {
      const result = await authService.verifyOTP(sessionId, otp, type);
      
      if (result.success) {
        return {
          verified: true,
          nextStep: result.nextStep
        };
      } else {
        throw new Error(result.error || 'OTP verification failed');
      }

    } catch (error) {
      return rejectWithValue(error.message || 'OTP verification failed');
    }
  }
);

export const enableBiometric = createAsyncThunk(
  'auth/enableBiometric',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      
      if (!state.auth.user) {
        throw new Error('User not authenticated');
      }

      const result = await biometricService.enableBiometricAuth(state.auth.user.id);
      
      if (result.success) {
        // Store encrypted user data for biometric login
        const encryptedUserData = await encryptionService.encrypt(
          JSON.stringify({
            userId: state.auth.user.id,
            email: state.auth.user.email,
            enabledAt: Date.now()
          })
        );
        
        await SecureStore.setItemAsync('biometric_user_data', JSON.stringify(encryptedUserData));
        
        return {
          biometricEnabled: true,
          supportedTypes: result.supportedTypes
        };
      } else {
        throw new Error(result.error || 'Failed to enable biometric authentication');
      }

    } catch (error) {
      return rejectWithValue(error.message || 'Biometric setup failed');
    }
  }
);

export const refreshAuthToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      
      if (!state.auth.refreshToken) {
        throw new Error('No refresh token available');
      }

      const result = await authService.refreshToken(state.auth.refreshToken);
      
      if (result.success) {
        await SecureStore.setItemAsync('auth_token', result.token);
        if (result.refreshToken) {
          await SecureStore.setItemAsync('refresh_token', result.refreshToken);
        }
        
        return {
          token: result.token,
          refreshToken: result.refreshToken || state.auth.refreshToken,
          sessionExpiry: Date.now() + (8 * 60 * 60 * 1000)
        };
      } else {
        throw new Error(result.error || 'Token refresh failed');
      }

    } catch (error) {
      return rejectWithValue(error.message || 'Token refresh failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { getState }) => {
    try {
      const state = getState() as { auth: AuthState };
      
      if (state.auth.token) {
        // Notify server of logout
        await authService.logout(state.auth.token);
      }

      // Clear all stored tokens and data
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('refresh_token');
      await SecureStore.deleteItemAsync('biometric_user_data');
      await SecureStore.deleteItemAsync('remember_user');

      return {};

    } catch (error) {
      // Even if server logout fails, clear local data
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('refresh_token');
      await SecureStore.deleteItemAsync('biometric_user_data');
      
      return {};
    }
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    
    updateLastActivity: (state) => {
      state.lastActivity = Date.now();
    },
    
    updateRegistrationStep: (state, action: PayloadAction<{ step: number; data?: any }>) => {
      state.registrationFlow.currentStep = action.payload.step;
      if (action.payload.data) {
        state.registrationFlow.userData = {
          ...state.registrationFlow.userData,
          ...action.payload.data
        };
      }
    },
    
    markVerificationComplete: (state, action: PayloadAction<keyof AuthState['registrationFlow']['verificationData']>) => {
      state.registrationFlow.verificationData[action.payload] = true;
    },
    
    updateUserPreferences: (state, action: PayloadAction<Partial<UserPreferences>>) => {
      if (state.user) {
        state.user.preferences = {
          ...state.user.preferences,
          ...action.payload
        };
      }
    },
    
    lockAccount: (state, action: PayloadAction<number>) => {
      state.isLocked = true;
      state.lockoutExpiry = Date.now() + action.payload;
    },
    
    unlockAccount: (state) => {
      state.isLocked = false;
      state.lockoutExpiry = 0;
      state.loginAttempts = 0;
    },
    
    autoLogout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.sessionExpiry = 0;
      state.error = 'Session expired due to inactivity';
    }
  },
  
  extraReducers: (builder) => {
    builder
      // Initialize auth
      .addCase(initializeAuth.pending, (state) => {
        state.isInitializing = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isInitializing = false;
        if (action.payload.user) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.refreshToken = action.payload.refreshToken;
          state.isAuthenticated = true;
        }
        if (action.payload.biometricSupport) {
          state.biometricSupport = action.payload.biometricSupport;
        }
        state.deviceSecurity = action.payload.deviceSecurity;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isInitializing = false;
        state.error = action.payload as string;
      })
      
      // Login with credentials
      .addCase(loginWithCredentials.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithCredentials.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.sessionExpiry = action.payload.sessionExpiry;
        state.loginAttempts = 0;
        state.isLocked = false;
        state.lastActivity = Date.now();
      })
      .addCase(loginWithCredentials.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.loginAttempts += 1;
        
        // Lock account after 5 failed attempts
        if (state.loginAttempts >= 5) {
          state.isLocked = true;
          state.lockoutExpiry = Date.now() + (30 * 60 * 1000); // 30 minutes
        }
      })
      
      // Biometric login
      .addCase(loginWithBiometric.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.sessionExpiry = action.payload.sessionExpiry;
        state.lastActivity = Date.now();
      })
      .addCase(loginWithBiometric.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // PIN login
      .addCase(loginWithPIN.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.sessionExpiry = action.payload.sessionExpiry;
        state.lastActivity = Date.now();
      })
      .addCase(loginWithPIN.rejected, (state, action) => {
        state.error = action.payload as string;
        state.loginAttempts += 1;
      })
      
      // Registration
      .addCase(registerUser.fulfilled, (state, action) => {
        state.registrationFlow.userData = action.payload.user;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // OTP verification
      .addCase(verifyOTP.fulfilled, (state, action) => {
        if (action.payload.nextStep) {
          state.registrationFlow.currentStep += 1;
        }
      })
      
      // Enable biometric
      .addCase(enableBiometric.fulfilled, (state, action) => {
        if (state.user) {
          state.user.preferences.security.biometricEnabled = action.payload.biometricEnabled;
        }
      })
      
      // Refresh token
      .addCase(refreshAuthToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.sessionExpiry = action.payload.sessionExpiry;
        state.lastActivity = Date.now();
      })
      .addCase(refreshAuthToken.rejected, (state) => {
        // Token refresh failed, logout user
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.sessionExpiry = 0;
      })
      
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.sessionExpiry = 0;
        state.lastActivity = 0;
        state.loginAttempts = 0;
        state.isLocked = false;
        state.lockoutExpiry = 0;
        state.error = null;
      });
  }
});

export const {
  clearError,
  updateLastActivity,
  updateRegistrationStep,
  markVerificationComplete,
  updateUserPreferences,
  lockAccount,
  unlockAccount,
  autoLogout
} = authSlice.actions;

export default authSlice.reducer;