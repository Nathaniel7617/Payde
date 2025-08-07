
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types
interface Balance {
  currency: string;
  amount: number;
  lastUpdated: string;
}

interface AccountLimits {
  daily: number;
  monthly: number;
  perTransaction: number;
  remaining: {
    daily: number;
    monthly: number;
  };
}

interface AccountSliceState {
  balances: Balance[];
  primaryBalance: Balance | null;
  limits: Record<string, AccountLimits>;
  accountNumber: string | null;
  accountType: string;
  isLoading: boolean;
  error: string | null;
  lastRefresh: string | null;
  lastBalanceChange?: {
    currency: string;
    amount: number;
    type: 'debit' | 'credit';
    timestamp: string;
  };
}

const initialState: AccountSliceState = {
  balances: [],
  primaryBalance: null,
  limits: {},
  accountNumber: null,
  accountType: 'premium',
  isLoading: false,
  error: null,
  lastRefresh: null,
  lastBalanceChange: undefined,
};

// Mock data
const mockBalances: Balance[] = [
  {
    currency: 'NGN',
    amount: 125000.50,
    lastUpdated: new Date().toISOString(),
  },
  {
    currency: 'USD',
    amount: 250.75,
    lastUpdated: new Date().toISOString(),
  },
  {
    currency: 'GHS',
    amount: 1500.25,
    lastUpdated: new Date().toISOString(),
  },
];

const mockLimits: Record<string, AccountLimits> = {
  NGN: {
    daily: 5000000,
    monthly: 20000000,
    perTransaction: 1000000,
    remaining: {
      daily: 4500000,
      monthly: 19500000,
    },
  },
  USD: {
    daily: 10000,
    monthly: 50000,
    perTransaction: 5000,
    remaining: {
      daily: 9750,
      monthly: 49750,
    },
  },
};

// Async thunks
export const fetchAccountBalance = createAsyncThunk(
  'account/fetchAccountBalance',
  async ({ currency }: { currency?: string } = {}, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        balances: mockBalances,
        limits: mockLimits,
        accountNumber: '1234567890',
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch balance');
    }
  }
);

export const refreshBalance = createAsyncThunk(
  'account/refreshBalance',
  async (_, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate slight balance changes
      const updatedBalances = mockBalances.map(balance => ({
        ...balance,
        amount: balance.amount + (Math.random() - 0.5) * 1000,
        lastUpdated: new Date().toISOString(),
      }));
      
      return {
        balances: updatedBalances,
        limits: mockLimits,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to refresh balance');
    }
  }
);

export const updateBalance = createAsyncThunk(
  'account/updateBalance',
  async (params: { currency: string; amount: number; operation: 'add' | 'subtract' }, { getState, rejectWithValue }) => {
    try {
      const { currency, amount, operation } = params;
      const state = getState() as { account: AccountSliceState };
      
      const currentBalance = state.account.balances.find(b => b.currency === currency);
      if (!currentBalance) {
        throw new Error(`Balance not found for currency: ${currency}`);
      }
      
      const newAmount = operation === 'add' 
        ? currentBalance.amount + amount 
        : currentBalance.amount - amount;
      
      if (newAmount < 0) {
        throw new Error('Insufficient balance');
      }
      
      return {
        currency,
        amount: newAmount,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update balance');
    }
  }
);

// Account slice
const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setPrimaryBalance: (state, action: PayloadAction<string>) => {
      const currency = action.payload;
      const balance = state.balances.find(b => b.currency === currency);
      if (balance) {
        state.primaryBalance = balance;
      }
    },
    updateLocalBalance: (state, action: PayloadAction<{ currency: string; amount: number }>) => {
      const { currency, amount } = action.payload;
      const balanceIndex = state.balances.findIndex(b => b.currency === currency);
      
      if (balanceIndex !== -1) {
        state.balances[balanceIndex].amount = amount;
        state.balances[balanceIndex].lastUpdated = new Date().toISOString();
        
        if (state.primaryBalance?.currency === currency) {
          state.primaryBalance.amount = amount;
          state.primaryBalance.lastUpdated = new Date().toISOString();
        }
      }
    },
    updateLimits: (state, action: PayloadAction<{ currency: string; limits: Partial<AccountLimits> }>) => {
      const { currency, limits } = action.payload;
      if (state.limits[currency]) {
        state.limits[currency] = { ...state.limits[currency], ...limits };
      }
    },
    addBalance: (state, action: PayloadAction<Balance>) => {
      const existingIndex = state.balances.findIndex(b => b.currency === action.payload.currency);
      if (existingIndex !== -1) {
        state.balances[existingIndex] = action.payload;
      } else {
        state.balances.push(action.payload);
      }
    },
    updateBalanceRealTime: (state, action: PayloadAction<{
      currency: string;
      balance: number;
      change: number;
      changeType: 'debit' | 'credit';
    }>) => {
      const { currency, balance, change, changeType } = action.payload;
      
      // Update the specific currency balance
      const balanceIndex = state.balances.findIndex(b => b.currency === currency);
      if (balanceIndex !== -1) {
        state.balances[balanceIndex].amount = balance;
        state.balances[balanceIndex].lastUpdated = new Date().toISOString();
        
        // Update primary balance if this is the same currency
        if (state.primaryBalance?.currency === currency) {
          state.primaryBalance.amount = balance;
          state.primaryBalance.lastUpdated = new Date().toISOString();
        }
      }
      
      // Store the last balance change for UI feedback
      state.lastBalanceChange = {
        currency,
        amount: change,
        type: changeType,
        timestamp: new Date().toISOString()
      };
    },
    setLastRefresh: (state) => {
      state.lastRefresh = new Date().toISOString();
    },
  },
  extraReducers: (builder) => {
    // Fetch account balance
    builder
      .addCase(fetchAccountBalance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAccountBalance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.balances = action.payload.balances;
        state.limits = action.payload.limits;
        state.accountNumber = action.payload.accountNumber;
        state.primaryBalance = action.payload.balances.find(b => b.currency === 'NGN') || action.payload.balances[0];
        state.lastRefresh = new Date().toISOString();
      })
      .addCase(fetchAccountBalance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Refresh balance
    builder
      .addCase(refreshBalance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(refreshBalance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.balances = action.payload.balances;
        state.limits = action.payload.limits;
        state.primaryBalance = action.payload.balances.find(b => b.currency === state.primaryBalance?.currency) || action.payload.balances[0];
        state.lastRefresh = new Date().toISOString();
      })
      .addCase(refreshBalance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update balance
    builder
      .addCase(updateBalance.fulfilled, (state, action) => {
        const { currency, amount, lastUpdated } = action.payload;
        const balanceIndex = state.balances.findIndex(b => b.currency === currency);
        
        if (balanceIndex !== -1) {
          state.balances[balanceIndex].amount = amount;
          state.balances[balanceIndex].lastUpdated = lastUpdated;
          
          if (state.primaryBalance?.currency === currency) {
            state.primaryBalance.amount = amount;
            state.primaryBalance.lastUpdated = lastUpdated;
          }
        }
      })
      .addCase(updateBalance.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setPrimaryBalance,
  updateLocalBalance,
  updateLimits,
  addBalance,
  setLastRefresh,
  updateBalanceRealTime,
} = accountSlice.actions;

export default accountSlice.reducer;