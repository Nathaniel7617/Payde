
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import { setupListeners } from '@reduxjs/toolkit/query';
import * as SecureStore from 'expo-secure-store';
import { EncryptionService } from '../services/EncryptionService';

// Import all slice reducers
import authSlice from './slices/authSlice';
import accountSlice from './slices/accountSlice';
import transactionSlice from './slices/transactionSlice';
import cardSlice from './slices/cardSlice';
import currencySlice from './slices/currencySlice';
import securitySlice from './slices/securitySlice';
import uiSlice from './slices/uiSlice';
import { apiSlice } from './api/apiSlice';

// Secure storage implementation for Redux Persist
class SecureStorage {
  private encryptionService = new EncryptionService();

  async getItem(key: string): Promise<string | null> {
    try {
      const encryptedData = await SecureStore.getItemAsync(`redux_${key}`);
      if (!encryptedData) return null;
      
      const decryptedData = await this.encryptionService.decrypt(JSON.parse(encryptedData));
      return decryptedData;
    } catch (error) {
      console.error('Error retrieving from secure storage:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      const encryptedData = await this.encryptionService.encrypt(value);
      await SecureStore.setItemAsync(`redux_${key}`, JSON.stringify(encryptedData));
    } catch (error) {
      console.error('Error storing to secure storage:', error);
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(`redux_${key}`);
    } catch (error) {
      console.error('Error removing from secure storage:', error);
      throw error;
    }
  }
}

const secureStorage = new SecureStorage();

// Configure which parts of the state to persist
const persistConfig = {
  key: 'payde_root',
  storage: secureStorage,
  whitelist: ['auth', 'account', 'currency', 'ui'], // Only persist necessary data
  blacklist: ['transaction', 'security'], // Don't persist sensitive transaction data
  version: 1,
  migrate: async (state: any) => {
    // Handle state migrations for app updates
    if (state && state._persist && state._persist.version < 1) {
      // Perform migration logic here
      return {
        ...state,
        _persist: { ...state._persist, version: 1 }
      };
    }
    return state;
  }
};

// Separate persist config for sensitive data with shorter expiration
const sensitiveDataPersistConfig = {
  key: 'payde_sensitive',
  storage: secureStorage,
  whitelist: ['cards', 'beneficiaries'],
  transforms: [
    // Add timestamp transform for expiration
    {
      in: (inboundState: any) => ({
        ...inboundState,
        _timestamp: Date.now()
      }),
      out: (outboundState: any) => {
        // Check if data is older than 24 hours
        const twentyFourHours = 24 * 60 * 60 * 1000;
        if (outboundState._timestamp && (Date.now() - outboundState._timestamp) > twentyFourHours) {
          return undefined; // Clear expired data
        }
        return outboundState;
      }
    }
  ]
};

// Combine all reducers
const rootReducer = combineReducers({
  auth: authSlice,
  account: accountSlice,
  transaction: transactionSlice,
  card: cardSlice,
  currency: currencySlice,
  security: securitySlice,
  ui: uiSlice,
  api: apiSlice.reducer
});

// Apply persistence to root reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Security middleware to prevent unauthorized state modifications
const securityMiddleware = (store: any) => (next: any) => (action: any) => {
  // Log all actions for security audit
  if (__DEV__) {
    console.log('Action dispatched:', action.type);
  }

  // Prevent certain actions if user is not authenticated
  const protectedActions = [
    'transaction/initiateTransfer',
    'card/generateVirtualCard',
    'account/updateProfile'
  ];

  if (protectedActions.includes(action.type)) {
    const state = store.getState();
    if (!state.auth.isAuthenticated) {
      console.warn('Unauthorized action blocked:', action.type);
      return;
    }
  }

  return next(action);
};

// Configure store with security middleware
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
      thunk: {
        extraArgument: {
          // Inject services into thunks
          encryptionService: new EncryptionService(),
        }
      }
    }).concat(
      apiSlice.middleware,
      securityMiddleware
    ),
  devTools: __DEV__ && {
    // Sanitize sensitive data in Redux DevTools
    actionSanitizer: (action: any) => ({
      ...action,
      payload: action.type.includes('auth') || action.type.includes('pin') 
        ? '***SANITIZED***' 
        : action.payload
    }),
    stateSanitizer: (state: any) => ({
      ...state,
      auth: {
        ...state.auth,
        token: state.auth.token ? '***TOKEN***' : null,
        refreshToken: state.auth.refreshToken ? '***REFRESH_TOKEN***' : null
      }
    })
  }
});

// Setup RTK Query listeners for automatic refetching
setupListeners(store.dispatch);

// Create persistor
export const persistor = persistStore(store, {
  // Enhanced security check before rehydration
  manualPersist: true
}, () => {
  // Callback after rehydration
  console.log('Store rehydrated successfully');
});

// Type definitions
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Security helper to clear sensitive data
export const clearSensitiveData = async () => {
  try {
    await secureStorage.removeItem('payde_root');
    await secureStorage.removeItem('payde_sensitive');
    await persistor.purge();
  } catch (error) {
    console.error('Error clearing sensitive data:', error);
  }
};

// Auto-logout after inactivity
let inactivityTimer: NodeJS.Timeout;
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes

export const resetInactivityTimer = () => {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }
  
  inactivityTimer = setTimeout(() => {
    store.dispatch({ type: 'auth/autoLogout' });
    clearSensitiveData();
  }, INACTIVITY_TIMEOUT);
};

// Initialize inactivity timer
resetInactivityTimer();