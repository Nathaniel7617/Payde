
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Types
interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
  isClosable?: boolean;
}

interface Modal {
  id: string;
  type: string;
  isOpen: boolean;
  data?: any;
}

interface LoadingState {
  global: boolean;
  [key: string]: boolean;
}

interface UISliceState {
  theme: 'light' | 'dark' | 'auto';
  toasts: Toast[];
  modals: Modal[];
  loading: LoadingState;
  networkStatus: 'online' | 'offline' | 'unknown';
  orientation: 'portrait' | 'landscape';
  biometricPrompt: {
    isVisible: boolean;
    type: 'login' | 'transaction' | 'settings';
    callback?: string;
  };
  pinPrompt: {
    isVisible: boolean;
    type: 'login' | 'transaction' | 'setup';
    callback?: string;
  };
  bottomSheet: {
    isVisible: boolean;
    type: string;
    data?: any;
  };
  refreshing: {
    dashboard: boolean;
    transactions: boolean;
    balance: boolean;
  };
}

const initialState: UISliceState = {
  theme: 'auto',
  toasts: [],
  modals: [],
  loading: {
    global: false,
  },
  networkStatus: 'unknown',
  orientation: 'portrait',
  biometricPrompt: {
    isVisible: false,
    type: 'login',
  },
  pinPrompt: {
    isVisible: false,
    type: 'login',
  },
  bottomSheet: {
    isVisible: false,
    type: '',
  },
  refreshing: {
    dashboard: false,
    transactions: false,
    balance: false,
  },
};

// UI slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Theme
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.theme = action.payload;
    },

    // Toasts
    showToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const toast: Toast = {
        id: `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...action.payload,
      };
      state.toasts.push(toast);
    },
    hideToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
    },
    clearAllToasts: (state) => {
      state.toasts = [];
    },

    // Modals
    showModal: (state, action: PayloadAction<Omit<Modal, 'id' | 'isOpen'>>) => {
      const modal: Modal = {
        id: `modal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        isOpen: true,
        ...action.payload,
      };
      state.modals.push(modal);
    },
    hideModal: (state, action: PayloadAction<string>) => {
      const modalIndex = state.modals.findIndex(modal => modal.id === action.payload);
      if (modalIndex !== -1) {
        state.modals[modalIndex].isOpen = false;
      }
    },
    closeModal: (state, action: PayloadAction<string>) => {
      state.modals = state.modals.filter(modal => modal.id !== action.payload);
    },
    clearAllModals: (state) => {
      state.modals = [];
    },

    // Loading states
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.global = action.payload;
    },
    setLoading: (state, action: PayloadAction<{ key: string; isLoading: boolean }>) => {
      state.loading[action.payload.key] = action.payload.isLoading;
    },
    clearLoading: (state, action: PayloadAction<string>) => {
      delete state.loading[action.payload];
    },

    // Network status
    setNetworkStatus: (state, action: PayloadAction<'online' | 'offline' | 'unknown'>) => {
      state.networkStatus = action.payload;
    },

    // Device orientation
    setOrientation: (state, action: PayloadAction<'portrait' | 'landscape'>) => {
      state.orientation = action.payload;
    },

    // Biometric prompt
    showBiometricPrompt: (state, action: PayloadAction<{ type: 'login' | 'transaction' | 'settings'; callback?: string }>) => {
      state.biometricPrompt = {
        isVisible: true,
        ...action.payload,
      };
    },
    hideBiometricPrompt: (state) => {
      state.biometricPrompt = {
        isVisible: false,
        type: 'login',
      };
    },

    // PIN prompt
    showPinPrompt: (state, action: PayloadAction<{ type: 'login' | 'transaction' | 'setup'; callback?: string }>) => {
      state.pinPrompt = {
        isVisible: true,
        ...action.payload,
      };
    },
    hidePinPrompt: (state) => {
      state.pinPrompt = {
        isVisible: false,
        type: 'login',
      };
    },

    // Bottom sheet
    showBottomSheet: (state, action: PayloadAction<{ type: string; data?: any }>) => {
      state.bottomSheet = {
        isVisible: true,
        ...action.payload,
      };
    },
    hideBottomSheet: (state) => {
      state.bottomSheet = {
        isVisible: false,
        type: '',
        data: undefined,
      };
    },

    // Refreshing states
    setRefreshing: (state, action: PayloadAction<{ key: keyof UISliceState['refreshing']; isRefreshing: boolean }>) => {
      state.refreshing[action.payload.key] = action.payload.isRefreshing;
    },

    // Reset UI state
    resetUIState: () => initialState,
  },
});

export const {
  setTheme,
  showToast,
  hideToast,
  clearAllToasts,
  showModal,
  hideModal,
  closeModal,
  clearAllModals,
  setGlobalLoading,
  setLoading,
  clearLoading,
  setNetworkStatus,
  setOrientation,
  showBiometricPrompt,
  hideBiometricPrompt,
  showPinPrompt,
  hidePinPrompt,
  showBottomSheet,
  hideBottomSheet,
  setRefreshing,
  resetUIState,
} = uiSlice.actions;

export default uiSlice.reducer;