
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { TransactionService, TransactionType, TransactionStatus, TransactionReceipt } from '../../services/TransactionService';
import { CurrencyService } from '../../services/CurrencyService';

// Types
export interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  convertedAmount?: number;
  targetCurrency?: string;
  exchangeRate?: number;
  fees: {
    transactionFee: number;
    exchangeFee?: number;
    processingFee?: number;
    total: number;
  };
  recipient?: {
    name: string;
    accountNumber?: string;
    email?: string;
    phoneNumber?: string;
    bankCode?: string;
    country?: string;
  };
  sender: {
    name: string;
    accountNumber: string;
    email: string;
  };
  description?: string;
  reference: string;
  timestamp: number;
  completedAt?: number;
  failedAt?: number;
  cancelledAt?: number;
  receipt?: TransactionReceipt;
  confirmationCode?: string;
  estimatedCompletion?: number;
}

export interface TransactionSession {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  recipient?: any;
  fees: any;
  exchangeRate?: number;
  status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'failed';
  expiresAt: number;
  requiresAuth: boolean;
  authMethods: string[];
}

export interface TransactionFilter {
  type?: TransactionType;
  status?: TransactionStatus;
  dateFrom?: number;
  dateTo?: number;
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
  search?: string;
}

export interface TransactionState {
  transactions: Transaction[];
  currentSession: TransactionSession | null;
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  filters: TransactionFilter;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  realTimeUpdates: {
    [transactionId: string]: {
      status: TransactionStatus;
      timestamp: number;
    };
  };
  statistics: {
    totalTransactions: number;
    totalAmount: number;
    successRate: number;
    averageAmount: number;
    topCategories: Array<{
      type: TransactionType;
      count: number;
      amount: number;
    }>;
    monthlyTrend: Array<{
      month: string;
      count: number;
      amount: number;
    }>;
  };
  pendingTransactions: Transaction[];
  recentTransactions: Transaction[];
  favoriteRecipients: Array<{
    id: string;
    name: string;
    accountNumber?: string;
    email?: string;
    phoneNumber?: string;
    lastUsed: number;
    frequency: number;
  }>;
}

// Initial state
const initialState: TransactionState = {
  transactions: [],
  currentSession: null,
  isLoading: false,
  isProcessing: false,
  error: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: true
  },
  realTimeUpdates: {},
  statistics: {
    totalTransactions: 0,
    totalAmount: 0,
    successRate: 0,
    averageAmount: 0,
    topCategories: [],
    monthlyTrend: []
  },
  pendingTransactions: [],
  recentTransactions: [],
  favoriteRecipients: []
};

// Services
const transactionService = new TransactionService(
  null as any, // Will be injected via thunk extra argument
  null as any,
  null as any,
  null as any,
  null as any
);
const currencyService = new CurrencyService(null as any, null as any);

// Async thunks
export const initiateTransaction = createAsyncThunk(
  'transaction/initiate',
  async (
    request: {
      type: TransactionType;
      amount: number;
      currency: string;
      recipient?: any;
      description?: string;
      metadata?: Record<string, any>;
    },
    { rejectWithValue }
  ) => {
    try {
      const result = await transactionService.initiateTransaction(request);
      
      if (result.success) {
        return {
          sessionId: result.transactionId,
          requiresAdditionalAuth: result.requiresAdditionalAuth,
          session: result
        };
      } else {
        throw new Error(result.error || 'Transaction initiation failed');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to initiate transaction');
    }
  }
);

export const executeTransaction = createAsyncThunk(
  'transaction/execute',
  async (
    {
      transactionId,
      pin,
      biometricAuth = false
    }: {
      transactionId: string;
      pin: string;
      biometricAuth?: boolean;
    },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const result = await transactionService.executeTransaction(
        transactionId,
        pin,
        biometricAuth
      );

      if (result.success) {
        // Start real-time status monitoring
        dispatch(subscribeToTransactionUpdates(result.transactionId!));
        
        return {
          transaction: {
            id: result.transactionId!,
            reference: result.reference!,
            receipt: result.receipt,
            status: result.receipt?.status || TransactionStatus.PROCESSING
          }
        };
      } else {
        throw new Error(result.error || 'Transaction execution failed');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to execute transaction');
    }
  }
);

export const fetchTransactionHistory = createAsyncThunk(
  'transaction/fetchHistory',
  async (
    {
      userId,
      filters,
      page = 1,
      limit = 20
    }: {
      userId: string;
      filters?: TransactionFilter;
      page?: number;
      limit?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const transactions = await transactionService.getTransactionHistory(
        userId,
        filters
      );

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedTransactions = transactions.slice(startIndex, endIndex);

      return {
        transactions: paginatedTransactions,
        pagination: {
          page,
          limit,
          total: transactions.length,
          hasMore: endIndex < transactions.length
        }
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch transaction history');
    }
  }
);

export const cancelTransaction = createAsyncThunk(
  'transaction/cancel',
  async (
    {
      transactionId,
      reason
    }: {
      transactionId: string;
      reason: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const result = await transactionService.cancelTransaction(transactionId, reason);
      
      if (result.success) {
        return {
          transactionId,
          cancellationReference: result.cancellationReference,
          cancelledAt: Date.now()
        };
      } else {
        throw new Error(result.error || 'Transaction cancellation failed');
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to cancel transaction');
    }
  }
);

export const subscribeToTransactionUpdates = createAsyncThunk(
  'transaction/subscribeUpdates',
  async (transactionId: string, { dispatch }) => {
    try {
      await transactionService.subscribeToTransactionUpdates(
        transactionId,
        (status: TransactionStatus) => {
          dispatch(updateTransactionStatus({
            transactionId,
            status,
            timestamp: Date.now()
          }));
        }
      );
      
      return { transactionId };
    } catch (error) {
      console.error('Failed to subscribe to transaction updates:', error);
      return { transactionId, error: error.message };
    }
  }
);

export const calculateTransactionFees = createAsyncThunk(
  'transaction/calculateFees',
  async (
    {
      type,
      amount,
      currency,
      targetCurrency
    }: {
      type: TransactionType;
      amount: number;
      currency: string;
      targetCurrency?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      // This would call the fee calculation service
      const fees = {
        transactionFee: amount * 0.01, // 1% transaction fee
        exchangeFee: targetCurrency ? amount * 0.005 : 0, // 0.5% exchange fee
        processingFee: amount > 100000 ? 50 : 0, // Fixed processing fee for high amounts
        total: 0
      };
      
      fees.total = fees.transactionFee + fees.exchangeFee + fees.processingFee;

      let exchangeRate = 1;
      if (targetCurrency && currency !== targetCurrency) {
        const rate = await currencyService.getExchangeRate(currency, targetCurrency);
        exchangeRate = rate?.rate || 1;
      }

      return {
        fees,
        exchangeRate,
        convertedAmount: targetCurrency ? amount * exchangeRate : amount
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to calculate fees');
    }
  }
);

export const generateTransactionStatistics = createAsyncThunk(
  'transaction/generateStatistics',
  async (userId: string, { rejectWithValue }) => {
    try {
      const transactions = await transactionService.getTransactionHistory(userId);
      
      const statistics = {
        totalTransactions: transactions.length,
        totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
        successRate: transactions.length > 0 
          ? (transactions.filter(t => t.status === TransactionStatus.COMPLETED).length / transactions.length) * 100 
          : 0,
        averageAmount: transactions.length > 0 
          ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length 
          : 0,
        topCategories: generateCategoryStats(transactions),
        monthlyTrend: generateMonthlyTrend(transactions)
      };

      return statistics;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to generate statistics');
    }
  }
);

// Helper functions
function generateCategoryStats(transactions: Transaction[]) {
  const categoryMap = new Map<TransactionType, { count: number; amount: number }>();
  
  transactions.forEach(transaction => {
    const existing = categoryMap.get(transaction.type) || { count: 0, amount: 0 };
    categoryMap.set(transaction.type, {
      count: existing.count + 1,
      amount: existing.amount + transaction.amount
    });
  });

  return Array.from(categoryMap.entries())
    .map(([type, stats]) => ({ type, ...stats }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function generateMonthlyTrend(transactions: Transaction[]) {
  const monthMap = new Map<string, { count: number; amount: number }>();
  
  transactions.forEach(transaction => {
    const date = new Date(transaction.timestamp);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    const existing = monthMap.get(monthKey) || { count: 0, amount: 0 };
    monthMap.set(monthKey, {
      count: existing.count + 1,
      amount: existing.amount + transaction.amount
    });
  });

  return Array.from(monthMap.entries())
    .map(([month, stats]) => ({ month, ...stats }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12); // Last 12 months
}

// Slice
const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },

    setFilters: (state, action: PayloadAction<TransactionFilter>) => {
      state.filters = action.payload;
    },

    clearFilters: (state) => {
      state.filters = {};
    },

    updateTransactionStatus: (
      state,
      action: PayloadAction<{
        transactionId: string;
        status: TransactionStatus;
        timestamp: number;
      }>
    ) => {
      const { transactionId, status, timestamp } = action.payload;
      
      // Update real-time updates
      state.realTimeUpdates[transactionId] = { status, timestamp };
      
      // Update transaction in list if it exists
      const transaction = state.transactions.find(t => t.id === transactionId);
      if (transaction) {
        transaction.status = status;
        if (status === TransactionStatus.COMPLETED) {
          transaction.completedAt = timestamp;
        } else if (status === TransactionStatus.FAILED) {
          transaction.failedAt = timestamp;
        }
      }

      // Update pending transactions
      if (status === TransactionStatus.COMPLETED || status === TransactionStatus.FAILED) {
        state.pendingTransactions = state.pendingTransactions.filter(t => t.id !== transactionId);
      }
    },

    addTransaction: (state, action: PayloadAction<Transaction>) => {
      const transaction = action.payload;
      
      // Add to main list
      state.transactions.unshift(transaction);
      
      // Add to recent transactions (keep only last 10)
      state.recentTransactions.unshift(transaction);
      if (state.recentTransactions.length > 10) {
        state.recentTransactions = state.recentTransactions.slice(0, 10);
      }
      
      // Add to pending if not completed
      if (transaction.status === TransactionStatus.PENDING || transaction.status === TransactionStatus.PROCESSING) {
        state.pendingTransactions.push(transaction);
      }
    },

    updateFavoriteRecipients: (
      state,
      action: PayloadAction<{
        name: string;
        accountNumber?: string;
        email?: string;
        phoneNumber?: string;
      }>
    ) => {
      const recipient = action.payload;
      const existingIndex = state.favoriteRecipients.findIndex(
        r => r.accountNumber === recipient.accountNumber || r.email === recipient.email
      );

      if (existingIndex >= 0) {
        // Update existing recipient
        state.favoriteRecipients[existingIndex].frequency += 1;
        state.favoriteRecipients[existingIndex].lastUsed = Date.now();
      } else {
        // Add new recipient
        state.favoriteRecipients.push({
          id: `recipient_${Date.now()}`,
          name: recipient.name,
          accountNumber: recipient.accountNumber,
          email: recipient.email,
          phoneNumber: recipient.phoneNumber,
          lastUsed: Date.now(),
          frequency: 1
        });
      }

      // Sort by frequency and last used
      state.favoriteRecipients.sort((a, b) => {
        if (a.frequency !== b.frequency) {
          return b.frequency - a.frequency;
        }
        return b.lastUsed - a.lastUsed;
      });

      // Keep only top 20 recipients
      if (state.favoriteRecipients.length > 20) {
        state.favoriteRecipients = state.favoriteRecipients.slice(0, 20);
      }
    },

    clearCurrentSession: (state) => {
      state.currentSession = null;
    },

    resetPagination: (state) => {
      state.pagination = {
        page: 1,
        limit: 20,
        total: 0,
        hasMore: true
      };
    }
  },

  extraReducers: (builder) => {
    builder
      // Initiate transaction
      .addCase(initiateTransaction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initiateTransaction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSession = {
          id: action.payload.sessionId,
          ...action.payload.session
        } as TransactionSession;
      })
      .addCase(initiateTransaction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Execute transaction
      .addCase(executeTransaction.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(executeTransaction.fulfilled, (state, action) => {
        state.isProcessing = false;
        
        const newTransaction: Transaction = {
          id: action.payload.transaction.id,
          type: state.currentSession?.type || TransactionType.DOMESTIC_TRANSFER,
          status: action.payload.transaction.status,
          amount: state.currentSession?.amount || 0,
          currency: state.currentSession?.currency || 'USD',
          fees: state.currentSession?.fees || { transactionFee: 0, total: 0 },
          sender: {
            name: 'Current User', // This should come from auth state
            accountNumber: 'USER_ACCOUNT',
            email: 'user@email.com'
          },
          recipient: state.currentSession?.recipient,
          reference: action.payload.transaction.reference,
          timestamp: Date.now(),
          receipt: action.payload.transaction.receipt
        };

        // Add transaction to state
        transactionSlice.caseReducers.addTransaction(state, {
          type: 'transaction/addTransaction',
          payload: newTransaction
        });

        // Clear current session
        state.currentSession = null;
      })
      .addCase(executeTransaction.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload as string;
      })

      // Fetch transaction history
      .addCase(fetchTransactionHistory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTransactionHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        
        if (action.payload.pagination.page === 1) {
          // Reset transactions for first page
          state.transactions = action.payload.transactions;
        } else {
          // Append for subsequent pages
          state.transactions.push(...action.payload.transactions);
        }
        
        state.pagination = action.payload.pagination;
        
        // Update recent transactions
        state.recentTransactions = action.payload.transactions
          .slice(0, 10)
          .filter(t => Date.now() - t.timestamp < 7 * 24 * 60 * 60 * 1000); // Last 7 days
      })
      .addCase(fetchTransactionHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Cancel transaction
      .addCase(cancelTransaction.fulfilled, (state, action) => {
        const transaction = state.transactions.find(t => t.id === action.payload.transactionId);
        if (transaction) {
          transaction.status = TransactionStatus.CANCELLED;
          transaction.cancelledAt = action.payload.cancelledAt;
        }
        
        // Remove from pending transactions
        state.pendingTransactions = state.pendingTransactions.filter(
          t => t.id !== action.payload.transactionId
        );
      })

      // Calculate fees
      .addCase(calculateTransactionFees.fulfilled, (state, action) => {
        if (state.currentSession) {
          state.currentSession.fees = action.payload.fees;
          state.currentSession.exchangeRate = action.payload.exchangeRate;
        }
      })

      // Generate statistics
      .addCase(generateTransactionStatistics.fulfilled, (state, action) => {
        state.statistics = action.payload;
      });
  }
});

export const {
  clearError,
  setFilters,
  clearFilters,
  updateTransactionStatus,
  addTransaction,
  updateFavoriteRecipients,
  clearCurrentSession,
  resetPagination
} = transactionSlice.actions;

export default transactionSlice.reducer;