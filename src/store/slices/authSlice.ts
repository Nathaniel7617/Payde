
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, AuthState, LoginCredentials } from '../../services/AuthService';
import AuthService from '../../services/AuthService';
import { AppConfig } from '../../config/AppConfig';

// Create AuthService instance
const authService = new AuthService(AppConfig.api.baseURL);

// Initial state
interface AuthSliceState {
  user: User | null;
  authState: AuthState;
  isLoading: boolean;
  error: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  biometricEnabled: boolean;
  twoFactorEnabled: boolean;
}

const initialState: AuthSliceState = {
  user: null,
  authState: AuthState.UNAUTHENTICATED,
  isLoading: false,
  error: null,
  accessToken: null,
  refreshToken: null,
  biometricEnabled: false,
  twoFactorEnabled: false,
};

// Async thunks for auth operations
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const loginCredentials: LoginCredentials = {
        email: credentials.email,
        password: credentials.password
      };

      const result = await authService.login(loginCredentials);
      
      if (result.success && result.user && result.tokens) {
        return {
          user: result.user,
          tokens: result.tokens
        };
      } else {
        return rejectWithValue(result.message);
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      const result = await authService.logout();
      if (result.success) {
        return {};
      } else {
        return rejectWithValue(result.message);
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);

export const refreshTokens = createAsyncThunk(
  'auth/refreshTokens',
  async (_, { rejectWithValue }) => {
    try {
      // The AuthService refreshTokens method is private and handles token storage internally
      // We'll need to implement a public method or handle this differently
      // For now, we'll return an error since the method is not accessible
      return rejectWithValue('Token refresh not implemented - private method in AuthService');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Token refresh failed');
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthState: (state, action: PayloadAction<AuthState>) => {
      state.authState = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setBiometricEnabled: (state, action: PayloadAction<boolean>) => {
      state.biometricEnabled = action.payload;
      if (state.user) {
        state.user.security.biometricEnabled = action.payload;
      }
    },
    setTwoFactorEnabled: (state, action: PayloadAction<boolean>) => {
      state.twoFactorEnabled = action.payload;
      if (state.user) {
        state.user.security.twoFactorEnabled = action.payload;
      }
    },
    updatePreferences: (state, action: PayloadAction<Partial<User['preferences']>>) => {
      if (state.user) {
        state.user.preferences = { ...state.user.preferences, ...action.payload };
      }
    },
    updateSecuritySettings: (state, action: PayloadAction<Partial<User['security']>>) => {
      if (state.user) {
        state.user.security = { ...state.user.security, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    // Login user
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.tokens.accessToken;
        state.refreshToken = action.payload.tokens.refreshToken;
        state.authState = AuthState.AUTHENTICATED;
        state.biometricEnabled = action.payload.user.security.biometricEnabled;
        state.twoFactorEnabled = action.payload.user.security.twoFactorEnabled;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.authState = AuthState.UNAUTHENTICATED;
      });

    // Logout user
    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        return initialState; // Reset to initial state
      })
      .addCase(logoutUser.rejected, (state) => {
        return initialState; // Reset to initial state even on error
      });

    // Refresh tokens
    builder
      .addCase(refreshTokens.fulfilled, (state, action) => {
        if (action.payload && typeof action.payload === 'object' && 'accessToken' in action.payload && 'refreshToken' in action.payload) {
          state.accessToken = action.payload.accessToken as string;
          state.refreshToken = action.payload.refreshToken as string;
        }
      })
      .addCase(refreshTokens.rejected, (state) => {
        // If refresh fails, logout user
        return initialState;
      });
  },
});

export const {
  setAuthState,
  clearError,
  updateUser,
  setBiometricEnabled,
  setTwoFactorEnabled,
  updatePreferences,
  updateSecuritySettings,
} = authSlice.actions;

export default authSlice.reducer;