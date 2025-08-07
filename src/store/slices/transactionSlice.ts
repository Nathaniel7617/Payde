
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Transaction, TransactionStatus } from '../../services/TransactionService';

// Initial state
interface TransactionSliceState {
  transactions: Transaction[];
  currentTransaction: Transaction | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    status: TransactionStatus | 'all';
    type: string | 'all';
    dateRange: {
      start: string | null;
      end: string | null;
    };
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

const initialState: TransactionSliceState = {
  transactions: [],
  currentTransaction: null,
  isLoading: false,
  error: null,
  filters: {
    status: 'all',
    type: 'all',
    dateRange: {
      start: null,
      end: null,
    },
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: true,
  },
};

// Mock transactions for demo
const mockTransactions: Transaction[] = [
  {
    id: 'txn_001',
    type: 'domestic_transfer' as any,
    status: TransactionStatus.SUCCESSFUL,
    amount: 50000,
    currency: 'NGN',
    description: 'Transfer to John Doe',
    reference: 'REF12345678',
    senderId: 'user_001',
    senderName: 'Jane Smith',
    senderAccount: '1234567890',
    senderPhone: '+234-800-123-4567',
    senderEmail: 'jane@example.com',
    recipientName: 'John Doe',
    recipientAccount: '0987654321',
    recipientPhone: '+234-800-987-6543',
    recipientEmail: 'john@example.com',
    fees: {
      transactionFee: 100,
      total: 100,
    },
    balanceSnapshot: {
      before: 125000.50,
      after: 74900.50,
      currency: 'NGN',
    },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'txn_002',
    type: 'bill_payment' as any,
    status: TransactionStatus.SUCCESSFUL,
    amount: 15000,
    currency: 'NGN',
    description: 'Electricity Bill Payment',
    reference: 'REF12345679',
    senderId: 'user_001',
    senderName: 'Jane Smith',
    senderAccount: '1234567890',
    senderPhone: '+234-800-123-4567',
    senderEmail: 'jane@example.com',
    recipientName: 'EKEDC',
    recipientAccount: '1122334455',
    fees: {
      transactionFee: 50,
      total: 50,
    },
    balanceSnapshot: {
      before: 74900.50,
      after: 59850.50,
      currency: 'NGN',
    },
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    additionalInfo: {
      provider: 'EKEDC',
      category: 'Electricity',
      meterNumber: '1122334455',
    },
  },
];

// Async thunks
export const fetchTransactions = createAsyncThunk(
  'transactions/fetchTransactions',
  async (params: { page?: number; limit?: number; refresh?: boolean } = {}, { getState, rejectWithValue }) => {
    try {
      const { page = 1, limit = 20, refresh = false } = params;
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        transactions: mockTransactions,
        pagination: {
          page,
          limit,
          total: mockTransactions.length,
          hasMore: false,
        },
        refresh,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch transactions');
    }
  }
);

export const fetchTransactionById = createAsyncThunk(
  'transactions/fetchTransactionById',
  async (transactionId: string, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const transaction = mockTransactions.find(t => t.id === transactionId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      return transaction;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch transaction');
    }
  }
);

export const processTransaction = createAsyncThunk(
  'transactions/processTransaction',
  async (transactionData: Partial<Transaction>, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newTransaction: Transaction = {
        id: `txn_${Date.now()}`,
        type: transactionData.type!,
        status: TransactionStatus.SUCCESSFUL,
        amount: transactionData.amount!,
        currency: transactionData.currency!,
        description: transactionData.description!,
        reference: `REF${Date.now()}`,
        senderId: 'user_001',
        senderName: 'Jane Smith',
        senderAccount: '1234567890',
        senderPhone: '+234-800-123-4567',
        senderEmail: 'jane@example.com',
        recipientName: transactionData.recipientName!,
        recipientAccount: transactionData.recipientAccount,
        fees: transactionData.fees || { transactionFee: 0, total: 0 },
        balanceSnapshot: transactionData.balanceSnapshot || { before: 0, after: 0, currency: 'NGN' },
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        ...transactionData,
      };
      
      return newTransaction;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Transaction failed');
    }
  }
);

// Transaction slice
const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<Partial<TransactionSliceState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    updateTransactionStatus: (state, action: PayloadAction<{ id: string; status: TransactionStatus }>) => {
      const transaction = state.transactions.find(t => t.id === action.payload.id);
      if (transaction) {
        transaction.status = action.payload.status;
      }
      if (state.currentTransaction?.id === action.payload.id) {
        state.currentTransaction.status = action.payload.status;
      }
    },
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.transactions.unshift(action.payload);
      state.pagination.total += 1;
    },
    setCurrentTransaction: (state, action: PayloadAction<Transaction | null>) => {
      state.currentTransaction = action.payload;
    },
    resetPagination: (state) => {
      state.pagination = initialState.pagination;
    },
  },
  extraReducers: (builder) => {
    // Fetch transactions
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        
        if (action.payload.refresh || action.payload.pagination.page === 1) {
          state.transactions = action.payload.transactions;
        } else {
          state.transactions = [...state.transactions, ...action.payload.transactions];
        }
        
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch transaction by ID
    builder
      .addCase(fetchTransactionById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTransactionById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentTransaction = action.payload;
      })
      .addCase(fetchTransactionById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Process transaction
    builder
      .addCase(processTransaction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(processTransaction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions.unshift(action.payload);
        state.pagination.total += 1;
      })
      .addCase(processTransaction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setFilters,
  clearFilters,
  updateTransactionStatus,
  addTransaction,
  setCurrentTransaction,
  resetPagination,
} = transactionSlice.actions;

export default transactionSlice.reducer;