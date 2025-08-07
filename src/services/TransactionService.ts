
import ReceiptService, { Receipt, ReceiptConfig } from './ReceiptService';
import AuthService from './AuthService';

// Types and Interfaces
export enum TransactionType {
  DOMESTIC_TRANSFER = 'domestic_transfer',
  INTERNATIONAL_TRANSFER = 'international_transfer',
  BILL_PAYMENT = 'bill_payment',
  AIRTIME_PURCHASE = 'airtime_purchase',
  DATA_PURCHASE = 'data_purchase',
  CARD_TRANSACTION = 'card_transaction',
  WALLET_FUNDING = 'wallet_funding',
  WITHDRAWAL = 'withdrawal'
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESSFUL = 'successful',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REVERSED = 'reversed'
}

export interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  description: string;
  reference: string;
  senderId: string;
  senderName: string;
  senderAccount: string;
  senderPhone: string;
  senderEmail: string;
  recipientId?: string;
  recipientName: string;
  recipientAccount?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  recipientBank?: string;
  fees: TransactionFees;
  balanceSnapshot: BalanceSnapshot;
  exchangeRate?: ExchangeRate;
  additionalInfo?: Record<string, any>;
  createdAt: string;
  processingAt?: string;
  completedAt?: string;
  failedAt?: string;
  failureReason?: string;
}

export interface TransactionFees {
  transactionFee: number;
  exchangeFee?: number;
  processingFee?: number;
  vatFee?: number;
  total: number;
}

export interface BalanceSnapshot {
  before: number;
  after: number;
  currency: string;
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  provider: string;
  timestamp: string;
}

export interface TransferRequest {
  type: TransactionType;
  amount: number;
  currency: string;
  recipientAccount: string;
  recipientName: string;
  recipientBank?: string;
  description: string;
  transactionPin: string;
  scheduleDate?: string;
  recurring?: RecurringConfig;
}

export interface BillPaymentRequest {
  provider: string;
  category: string;
  accountNumber: string;
  amount: number;
  currency: string;
  customerInfo: CustomerInfo;
  transactionPin: string;
  scheduleDate?: string;
  recurring?: RecurringConfig;
}

export interface AirtimeRequest {
  phoneNumber: string;
  amount: number;
  network: string;
  transactionPin: string;
  beneficiaryName?: string;
}

export interface DataPurchaseRequest {
  phoneNumber: string;
  planId: string;
  amount: number;
  network: string;
  transactionPin: string;
  beneficiaryName?: string;
}

export interface CustomerInfo {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface RecurringConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate?: string;
  maxOccurrences?: number;
}

export interface TransferCorridor {
  from: string;
  to: string;
  methods: string[];
  processingTime: string;
  limits: TransferLimits;
  fees: FeeStructure;
}

export interface TransferLimits {
  min: number;
  max: number;
  daily: number;
  monthly: number;
}

export interface FeeStructure {
  type: 'fixed' | 'percentage' | 'tiered';
  value: number;
  min?: number;
  max?: number;
  tiers?: FeeTier[];
}

export interface FeeTier {
  min: number;
  max: number;
  fee: number;
}

export interface TransactionResult {
  success: boolean;
  message: string;
  transaction?: Transaction;
  receipt?: Receipt;
  estimatedCompletion?: string;
}

// Currency configurations for different regions
const CURRENCY_CONFIGS = {
  NGN: {
    code: 'NGN',
    symbol: '₦',
    name: 'Nigerian Naira',
    decimals: 2,
    country: 'NG'
  },
  GHS: {
    code: 'GHS',
    symbol: '¢',
    name: 'Ghanaian Cedi',
    decimals: 2,
    country: 'GH'
  },
  KES: {
    code: 'KES',
    symbol: 'KSh',
    name: 'Kenyan Shilling',
    decimals: 2,
    country: 'KE'
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimals: 2,
    country: 'US'
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    decimals: 2,
    country: 'EU'
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    decimals: 2,
    country: 'GB'
  }
};

class TransactionService {
  private baseURL: string;
  private authService: AuthService;
  private receiptService: ReceiptService;
  private wsConnection: WebSocket | null = null;

  constructor(baseURL: string, authService: AuthService, receiptConfig: ReceiptConfig) {
    this.baseURL = baseURL;
    this.authService = authService;
    this.receiptService = new ReceiptService(receiptConfig);
    this.initializeWebSocket();
  }

  /**
   * Initialize WebSocket connection for real-time updates
   */
  private initializeWebSocket(): void {
    try {
      const wsURL = this.baseURL.replace('https://', 'wss://').replace('http://', 'ws://');
      this.wsConnection = new WebSocket(`${wsURL}/transactions/updates`);

      this.wsConnection.onopen = () => {
        console.log('Transaction WebSocket connected');
      };

      this.wsConnection.onmessage = (event) => {
        const update = JSON.parse(event.data);
        this.handleTransactionUpdate(update);
      };

      this.wsConnection.onerror = (error) => {
        console.error('Transaction WebSocket error:', error);
      };

      this.wsConnection.onclose = () => {
        console.log('Transaction WebSocket disconnected');
        // Attempt to reconnect after 5 seconds
        setTimeout(() => this.initializeWebSocket(), 5000);
      };
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
    }
  }

  /**
   * Process domestic money transfer
   */
  async processDomesticTransfer(request: TransferRequest): Promise<TransactionResult> {
    try {
      // Validate request
      const validation = await this.validateTransferRequest(request);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.message
        };
      }

      // Verify transaction PIN
      const pinValid = await this.authService.verifyTransactionPIN(request.transactionPin);
      if (!pinValid) {
        return {
          success: false,
          message: 'Invalid transaction PIN'
        };
      }

      // Calculate fees
      const fees = await this.calculateTransferFees(request.amount, request.currency, 'domestic');
      
      // Get current balance
      const currentBalance = await this.getCurrentBalance(request.currency);
      if (currentBalance < (request.amount + fees.total)) {
        return {
          success: false,
          message: 'Insufficient balance'
        };
      }

      // Create transaction
      const transaction = await this.createTransaction({
        type: TransactionType.DOMESTIC_TRANSFER,
        amount: request.amount,
        currency: request.currency,
        recipientName: request.recipientName,
        recipientAccount: request.recipientAccount,
        recipientBank: request.recipientBank,
        description: request.description,
        fees,
        balanceSnapshot: {
          before: currentBalance,
          after: currentBalance - request.amount - fees.total,
          currency: request.currency
        }
      });

      // Process the transfer
      const processResult = await this.processTransfer(transaction);
      
      if (processResult.success) {
        // Generate and deliver receipt
        const receipt = await this.receiptService.generateReceipt(transaction);
        
        return {
          success: true,
          message: 'Transfer successful',
          transaction,
          receipt,
          estimatedCompletion: this.calculateEstimatedCompletion('domestic')
        };
      }

      return processResult;
    } catch (error) {
      console.error('Domestic transfer error:', error);
      return {
        success: false,
        message: 'Transfer failed. Please try again.'
      };
    }
  }

  /**
   * Process international money transfer
   */
  async processInternationalTransfer(request: TransferRequest): Promise<TransactionResult> {
    try {
      // Validate request
      const validation = await this.validateTransferRequest(request);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.message
        };
      }

      // Check transfer corridor
      const corridor = await this.getTransferCorridor(request.currency, 'USD'); // Assuming USD as intermediary
      if (!corridor) {
        return {
          success: false,
          message: 'Transfer corridor not available'
        };
      }

      // Verify transaction PIN
      const pinValid = await this.authService.verifyTransactionPIN(request.transactionPin);
      if (!pinValid) {
        return {
          success: false,
          message: 'Invalid transaction PIN'
        };
      }

      // Get exchange rate
      const exchangeRate = await this.getExchangeRate(request.currency, 'USD');
      
      // Calculate fees
      const fees = await this.calculateTransferFees(request.amount, request.currency, 'international');
      
      // Get current balance
      const currentBalance = await this.getCurrentBalance(request.currency);
      if (currentBalance < (request.amount + fees.total)) {
        return {
          success: false,
          message: 'Insufficient balance'
        };
      }

      // Create transaction
      const transaction = await this.createTransaction({
        type: TransactionType.INTERNATIONAL_TRANSFER,
        amount: request.amount,
        currency: request.currency,
        recipientName: request.recipientName,
        recipientAccount: request.recipientAccount,
        recipientBank: request.recipientBank,
        description: request.description,
        fees,
        exchangeRate,
        balanceSnapshot: {
          before: currentBalance,
          after: currentBalance - request.amount - fees.total,
          currency: request.currency
        }
      });

      // Process the transfer
      const processResult = await this.processTransfer(transaction);
      
      if (processResult.success) {
        // Generate and deliver receipt
        const receipt = await this.receiptService.generateReceipt(transaction);
        
        return {
          success: true,
          message: 'International transfer initiated successfully',
          transaction,
          receipt,
          estimatedCompletion: this.calculateEstimatedCompletion('international')
        };
      }

      return processResult;
    } catch (error) {
      console.error('International transfer error:', error);
      return {
        success: false,
        message: 'Transfer failed. Please try again.'
      };
    }
  }

  /**
   * Process bill payment
   */
  async processBillPayment(request: BillPaymentRequest): Promise<TransactionResult> {
    try {
      // Validate account with biller
      const accountValidation = await this.validateBillerAccount(request.provider, request.accountNumber);
      if (!accountValidation.valid) {
        return {
          success: false,
          message: accountValidation.message
        };
      }

      // Verify transaction PIN
      const pinValid = await this.authService.verifyTransactionPIN(request.transactionPin);
      if (!pinValid) {
        return {
          success: false,
          message: 'Invalid transaction PIN'
        };
      }

      // Calculate fees
      const fees = await this.calculateBillPaymentFees(request.amount, request.provider);
      
      // Get current balance
      const currentBalance = await this.getCurrentBalance(request.currency);
      if (currentBalance < (request.amount + fees.total)) {
        return {
          success: false,
          message: 'Insufficient balance'
        };
      }

      // Create transaction
      const transaction = await this.createTransaction({
        type: TransactionType.BILL_PAYMENT,
        amount: request.amount,
        currency: request.currency,
        recipientName: request.provider,
        recipientAccount: request.accountNumber,
        description: `Bill payment to ${request.provider}`,
        fees,
        balanceSnapshot: {
          before: currentBalance,
          after: currentBalance - request.amount - fees.total,
          currency: request.currency
        },
        additionalInfo: {
          provider: request.provider,
          category: request.category,
          customerName: accountValidation.customerName,
          customerInfo: request.customerInfo
        }
      });

      // Process the bill payment
      const processResult = await this.executeBillPayment(transaction, request);
      
      if (processResult.success) {
        // Generate and deliver receipt
        const receipt = await this.receiptService.generateReceipt(transaction);
        
        return {
          success: true,
          message: 'Bill payment successful',
          transaction,
          receipt,
          estimatedCompletion: this.calculateEstimatedCompletion('bill_payment')
        };
      }

      return processResult;
    } catch (error) {
      console.error('Bill payment error:', error);
      return {
        success: false,
        message: 'Bill payment failed. Please try again.'
      };
    }
  }

  /**
   * Process airtime purchase
   */
  async processAirtimePurchase(request: AirtimeRequest): Promise<TransactionResult> {
    try {
      // Validate phone number and network
      const validation = await this.validatePhoneNetwork(request.phoneNumber, request.network);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.message
        };
      }

      // Verify transaction PIN
      const pinValid = await this.authService.verifyTransactionPIN(request.transactionPin);
      if (!pinValid) {
        return {
          success: false,
          message: 'Invalid transaction PIN'
        };
      }

      // Calculate fees
      const fees = await this.calculateAirtimeFees(request.amount, request.network);
      
      // Get current balance
      const currentBalance = await this.getCurrentBalance('NGN'); // Assuming local currency
      if (currentBalance < (request.amount + fees.total)) {
        return {
          success: false,
          message: 'Insufficient balance'
        };
      }

      // Create transaction
      const transaction = await this.createTransaction({
        type: TransactionType.AIRTIME_PURCHASE,
        amount: request.amount,
        currency: 'NGN',
        recipientName: request.beneficiaryName || request.phoneNumber,
        recipientPhone: request.phoneNumber,
        description: `Airtime purchase for ${request.phoneNumber}`,
        fees,
        balanceSnapshot: {
          before: currentBalance,
          after: currentBalance - request.amount - fees.total,
          currency: 'NGN'
        },
        additionalInfo: {
          network: request.network,
          phoneNumber: request.phoneNumber
        }
      });

      // Process the airtime purchase
      const processResult = await this.processAirtime(transaction, request);
      
      if (processResult.success) {
        // Generate and deliver receipt
        const receipt = await this.receiptService.generateReceipt(transaction);
        
        return {
          success: true,
          message: 'Airtime purchase successful',
          transaction,
          receipt,
          estimatedCompletion: this.calculateEstimatedCompletion('airtime')
        };
      }

      return processResult;
    } catch (error) {
      console.error('Airtime purchase error:', error);
      return {
        success: false,
        message: 'Airtime purchase failed. Please try again.'
      };
    }
  }

  /**
   * Process data purchase
   */
  async processDataPurchase(request: DataPurchaseRequest): Promise<TransactionResult> {
    try {
      // Validate phone number and network
      const validation = await this.validatePhoneNetwork(request.phoneNumber, request.network);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.message
        };
      }

      // Get data plan details
      const dataPlan = await this.getDataPlan(request.planId, request.network);
      if (!dataPlan) {
        return {
          success: false,
          message: 'Invalid data plan'
        };
      }

      // Verify transaction PIN
      const pinValid = await this.authService.verifyTransactionPIN(request.transactionPin);
      if (!pinValid) {
        return {
          success: false,
          message: 'Invalid transaction PIN'
        };
      }

      // Calculate fees
      const fees = await this.calculateDataFees(request.amount, request.network);
      
      // Get current balance
      const currentBalance = await this.getCurrentBalance('NGN'); // Assuming local currency
      if (currentBalance < (request.amount + fees.total)) {
        return {
          success: false,
          message: 'Insufficient balance'
        };
      }

      // Create transaction
      const transaction = await this.createTransaction({
        type: TransactionType.DATA_PURCHASE,
        amount: request.amount,
        currency: 'NGN',
        recipientName: request.beneficiaryName || request.phoneNumber,
        recipientPhone: request.phoneNumber,
        description: `Data purchase for ${request.phoneNumber}`,
        fees,
        balanceSnapshot: {
          before: currentBalance,
          after: currentBalance - request.amount - fees.total,
          currency: 'NGN'
        },
        additionalInfo: {
          network: request.network,
          phoneNumber: request.phoneNumber,
          dataPlan: dataPlan
        }
      });

      // Process the data purchase
      const processResult = await this.processData(transaction, request);
      
      if (processResult.success) {
        // Generate and deliver receipt
        const receipt = await this.receiptService.generateReceipt(transaction);
        
        return {
          success: true,
          message: 'Data purchase successful',
          transaction,
          receipt,
          estimatedCompletion: this.calculateEstimatedCompletion('data')
        };
      }

      return processResult;
    } catch (error) {
      console.error('Data purchase error:', error);
      return {
        success: false,
        message: 'Data purchase failed. Please try again.'
      };
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(limit: number = 50, offset: number = 0): Promise<Transaction[]> {
    try {
      const user = this.authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${this.baseURL}/transactions?limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        const result = await response.json();
        return result.transactions;
      }

      throw new Error('Failed to fetch transaction history');
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(transactionId: string): Promise<Transaction | null> {
    try {
      const response = await fetch(`${this.baseURL}/transactions/${transactionId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        const result = await response.json();
        return result.transaction;
      }

      return null;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      return null;
    }
  }

  /**
   * Private helper methods
   */
  private async createTransaction(data: Partial<Transaction>): Promise<Transaction> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const transaction: Transaction = {
      id: this.generateTransactionId(),
      type: data.type!,
      status: TransactionStatus.PENDING,
      amount: data.amount!,
      currency: data.currency!,
      description: data.description!,
      reference: this.generateReference(),
      senderId: user.id,
      senderName: `${user.firstName} ${user.lastName}`,
      senderAccount: 'USER_ACCOUNT', // This should come from user's account info
      senderPhone: user.phone,
      senderEmail: user.email,
      recipientName: data.recipientName!,
      recipientAccount: data.recipientAccount,
      recipientPhone: data.recipientPhone,
      recipientEmail: data.recipientEmail,
      recipientBank: data.recipientBank,
      fees: data.fees!,
      balanceSnapshot: data.balanceSnapshot!,
      exchangeRate: data.exchangeRate,
      additionalInfo: data.additionalInfo,
      createdAt: new Date().toISOString(),
    };

    return transaction;
  }

  private async processTransfer(transaction: Transaction): Promise<TransactionResult> {
    try {
      const response = await fetch(`${this.baseURL}/transfers/process`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(transaction),
      });

      const result = await response.json();

      if (response.ok) {
        transaction.status = TransactionStatus.SUCCESSFUL;
        transaction.completedAt = new Date().toISOString();
        return { success: true, message: 'Transfer completed successfully' };
      }

      transaction.status = TransactionStatus.FAILED;
      transaction.failedAt = new Date().toISOString();
      transaction.failureReason = result.message;
      
      return { success: false, message: result.message || 'Transfer failed' };
    } catch (error) {
      console.error('Error processing transfer:', error);
      transaction.status = TransactionStatus.FAILED;
      transaction.failedAt = new Date().toISOString();
      transaction.failureReason = 'Network error';
      
      return { success: false, message: 'Transfer failed due to network error' };
    }
  }

  private async validateTransferRequest(request: TransferRequest): Promise<{ valid: boolean; message: string }> {
    if (!request.amount || request.amount <= 0) {
      return { valid: false, message: 'Invalid amount' };
    }

    if (!request.recipientAccount || request.recipientAccount.length < 10) {
      return { valid: false, message: 'Invalid recipient account' };
    }

    if (!request.recipientName || request.recipientName.trim().length < 2) {
      return { valid: false, message: 'Recipient name is required' };
    }

    // Add more validation logic as needed
    return { valid: true, message: 'Valid' };
  }

  private async calculateTransferFees(amount: number, currency: string, type: 'domestic' | 'international'): Promise<TransactionFees> {
    // This should call your fee calculation API
    const baseFee = type === 'domestic' ? 50 : 100; // Example fixed fees
    const percentageFee = amount * 0.01; // 1% fee
    const total = baseFee + percentageFee;

    return {
      transactionFee: baseFee,
      processingFee: percentageFee,
      total
    };
  }

  private async getCurrentBalance(currency: string): Promise<number> {
    try {
      const response = await fetch(`${this.baseURL}/accounts/balance?currency=${currency}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        const result = await response.json();
        return result.balance;
      }

      return 0;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return 0;
    }
  }

  private generateTransactionId(): string {
    return `TXN${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  private generateReference(): string {
    return `REF${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }

  private getAuthHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer TOKEN', // This should come from AuthService
    };
  }

  private calculateEstimatedCompletion(type: string): string {
    const now = new Date();
    switch (type) {
      case 'domestic':
        return new Date(now.getTime() + 5 * 60 * 1000).toISOString(); // 5 minutes
      case 'international':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
      case 'bill_payment':
        return new Date(now.getTime() + 10 * 60 * 1000).toISOString(); // 10 minutes
      case 'airtime':
      case 'data':
        return new Date(now.getTime() + 2 * 60 * 1000).toISOString(); // 2 minutes
      default:
        return new Date(now.getTime() + 15 * 60 * 1000).toISOString(); // 15 minutes
    }
  }

  private handleTransactionUpdate(update: any): void {
    console.log('Transaction update received:', update);
    // Handle real-time transaction updates
    // This could trigger UI updates, notifications, etc.
  }

  // Additional methods for other transaction types would be implemented similarly
  private async validateBillerAccount(provider: string, accountNumber: string): Promise<{ valid: boolean; message: string; customerName?: string }> {
    // Implementation for biller account validation
    return { valid: true, message: 'Valid', customerName: 'John Doe' };
  }

  private async validatePhoneNetwork(phoneNumber: string, network: string): Promise<{ valid: boolean; message: string }> {
    // Implementation for phone/network validation
    return { valid: true, message: 'Valid' };
  }

  private async getExchangeRate(from: string, to: string): Promise<ExchangeRate> {
    // Implementation for exchange rate fetching
    return {
      from,
      to,
      rate: 1.5,
      provider: 'xe.com',
      timestamp: new Date().toISOString()
    };
  }

  private async getTransferCorridor(from: string, to: string): Promise<TransferCorridor | null> {
    // Implementation for transfer corridor lookup
    return null;
  }

  private async calculateBillPaymentFees(amount: number, provider: string): Promise<TransactionFees> {
    return { transactionFee: 25, total: 25 };
  }

  private async calculateAirtimeFees(amount: number, network: string): Promise<TransactionFees> {
    return { transactionFee: 0, total: 0 };
  }

  private async calculateDataFees(amount: number, network: string): Promise<TransactionFees> {
    return { transactionFee: 0, total: 0 };
  }

  private async getDataPlan(planId: string, network: string): Promise<any> {
    return { id: planId, name: '1GB Monthly', size: '1GB', validity: '30 days' };
  }

  private async executeBillPayment(transaction: Transaction, request: BillPaymentRequest): Promise<TransactionResult> {
    // Implementation for bill payment processing
    return { success: true, message: 'Bill payment successful' };
  }

  private async processAirtime(transaction: Transaction, request: AirtimeRequest): Promise<TransactionResult> {
    // Implementation for airtime processing
    return { success: true, message: 'Airtime purchase successful' };
  }

  private async processData(transaction: Transaction, request: DataPurchaseRequest): Promise<TransactionResult> {
    // Implementation for data purchase processing
    return { success: true, message: 'Data purchase successful' };
  }
}

export default TransactionService;