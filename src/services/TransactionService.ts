
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { EncryptionService } from './EncryptionService';
import { PINService } from './PINService';
import { BiometricService } from './BiometricService';
import { CurrencyService } from './CurrencyService';
import { APIClient } from './APIClient';

export interface TransactionRequest {
  type: TransactionType;
  amount: number;
  currency: string;
  recipient?: RecipientDetails;
  description?: string;
  metadata?: Record<string, any>;
}

export interface RecipientDetails {
  accountNumber?: string;
  bankCode?: string;
  email?: string;
  phoneNumber?: string;
  name: string;
  country: string;
}

export enum TransactionType {
  DOMESTIC_TRANSFER = 'domestic_transfer',
  INTERNATIONAL_TRANSFER = 'international_transfer',
  BILL_PAYMENT = 'bill_payment',
  AIRTIME_PURCHASE = 'airtime_purchase',
  DATA_PURCHASE = 'data_purchase',
  CARD_FUNDING = 'card_funding',
  CARD_TRANSACTION = 'card_transaction',
  WALLET_FUNDING = 'wallet_funding',
  WITHDRAWAL = 'withdrawal'
}

export interface TransactionResult {
  success: boolean;
  transactionId?: string;
  reference?: string;
  receipt?: TransactionReceipt;
  error?: string;
  requiresAdditionalAuth?: boolean;
}

export interface TransactionReceipt {
  id: string;
  reference: string;
  type: TransactionType;
  amount: number;
  currency: string;
  fees: FeeBreakdown;
  recipient: RecipientDetails;
  sender: UserDetails;
  status: TransactionStatus;
  timestamp: number;
  exchangeRate?: number;
  convertedAmount?: number;
  targetCurrency?: string;
  processingTime?: number;
  confirmationCode?: string;
}

export interface FeeBreakdown {
  transactionFee: number;
  exchangeFee?: number;
  processingFee?: number;
  total: number;
  currency: string;
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  SUCCESSFUL = 'successful',
  FAILED = 'failed',
  REVERSED = 'reversed',
  CANCELLED = 'cancelled',
  REQUIRES_VERIFICATION = 'requires_verification'
}

export interface Transaction {
  id: string;
  type: TransactionType | string;
  status: TransactionStatus | string;
  amount: number;
  currency: string;
  description: string;
  reference: string;
  senderId: string;
  senderName: string;
  senderAccount: string;
  senderPhone?: string;
  senderEmail?: string;
  recipientName: string;
  recipientAccount: string;
  recipientPhone?: string;
  recipientEmail?: string;
  fees?: {
    transactionFee: number;
    total: number;
  };
  balanceSnapshot?: {
    before: number;
    after: number;
    currency: string;
  };
  createdAt: string;
  completedAt?: string;
}

export class TransactionService {
  private encryptionService: EncryptionService;
  private pinService: PINService;
  private biometricService: BiometricService;
  private currencyService: CurrencyService;
  private apiClient: APIClient;
  
  private readonly TRANSACTION_LIMITS = {
    DAILY_LIMIT: 1000000, // Base currency
    SINGLE_TRANSACTION_LIMIT: 500000,
    MONTHLY_LIMIT: 10000000,
    INTERNATIONAL_DAILY_LIMIT: 50000
  };

  private readonly HIGH_VALUE_THRESHOLD = 100000; // Requires additional verification

  constructor(
    encryptionService: EncryptionService,
    pinService: PINService,
    biometricService: BiometricService,
    currencyService: CurrencyService,
    apiClient: APIClient
  ) {
    this.encryptionService = encryptionService;
    this.pinService = pinService;
    this.biometricService = biometricService;
    this.currencyService = currencyService;
    this.apiClient = apiClient;
  }

  async initiateTransaction(request: TransactionRequest): Promise<TransactionResult> {
    try {
      // Step 1: Validate transaction request
      const validation = await this.validateTransactionRequest(request);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }

      // Step 2: Check transaction limits
      const limitsCheck = await this.checkTransactionLimits(request);
      if (!limitsCheck.allowed) {
        return { success: false, error: limitsCheck.reason };
      }

      // Step 3: Calculate fees and exchange rates
      const feeCalculation = await this.calculateTransactionFees(request);
      
      // Step 4: Create transaction session
      const session = await this.createTransactionSession(request, feeCalculation);

      // Step 5: Determine authentication requirements
      const authRequirements = this.determineAuthRequirements(request, feeCalculation.total);

      return {
        success: true,
        transactionId: session.id,
        requiresAdditionalAuth: authRequirements.requiresAdditionalAuth,
        ...session
      };

    } catch (error) {
      await this.logTransactionError(request, error);
      return { success: false, error: 'Transaction initiation failed' };
    }
  }

  async executeTransaction(
    transactionId: string, 
    pin: string, 
    biometricAuth?: boolean
  ): Promise<TransactionResult> {
    try {
      // Step 1: Retrieve transaction session
      const session = await this.getTransactionSession(transactionId);
      if (!session) {
        return { success: false, error: 'Invalid transaction session' };
      }

      // Step 2: Verify authentication
      const authResult = await this.verifyTransactionAuth(session, pin, biometricAuth);
      if (!authResult.success) {
        return { success: false, error: authResult.error };
      }

      // Step 3: Perform final balance check
      const balanceCheck = await this.performFinalBalanceCheck(session);
      if (!balanceCheck.sufficient) {
        return { success: false, error: 'Insufficient balance' };
      }

      // Step 4: Execute transaction based on type
      const executionResult = await this.executeTransactionByType(session);
      
      // Step 5: Generate receipt
      if (executionResult.success) {
        const receipt = await this.generateTransactionReceipt(session, executionResult);
        
        // Step 6: Send notifications
        await this.sendTransactionNotifications(receipt);
        
        // Step 7: Update transaction history
        await this.updateTransactionHistory(receipt);

        return {
          success: true,
          transactionId: session.id,
          reference: executionResult.reference,
          receipt
        };
      }

      return executionResult;

    } catch (error) {
      await this.logTransactionError({ transactionId }, error);
      return { success: false, error: 'Transaction execution failed' };
    }
  }

  private async validateTransactionRequest(request: TransactionRequest): Promise<ValidationResult> {
    // Validate amount
    if (request.amount <= 0) {
      return { isValid: false, error: 'Invalid transaction amount' };
    }

    // Validate currency
    const supportedCurrencies = await this.currencyService.getSupportedCurrencies();
    if (!supportedCurrencies.includes(request.currency)) {
      return { isValid: false, error: 'Unsupported currency' };
    }

    // Validate recipient details based on transaction type
    if (this.requiresRecipient(request.type) && !request.recipient) {
      return { isValid: false, error: 'Recipient details required' };
    }

    // Validate account numbers and routing information
    if (request.recipient?.accountNumber) {
      const accountValidation = await this.validateAccountNumber(
        request.recipient.accountNumber, 
        request.recipient.bankCode,
        request.recipient.country
      );
      
      if (!accountValidation.isValid) {
        return { isValid: false, error: accountValidation.error };
      }
    }

    return { isValid: true };
  }

  private async checkTransactionLimits(request: TransactionRequest): Promise<LimitCheckResult> {
    const userId = await this.getCurrentUserId();
    const userLimits = await this.getUserTransactionLimits(userId);
    const todaySpent = await this.getTodaySpentAmount(userId);
    const monthlySpent = await this.getMonthlySpentAmount(userId);

    // Convert amount to base currency for limit checking
    const baseAmount = await this.currencyService.convertToBaseCurrency(
      request.amount, 
      request.currency
    );

    // Check single transaction limit
    if (baseAmount > userLimits.singleTransactionLimit) {
      return { 
        allowed: false, 
        reason: `Transaction exceeds single transaction limit of ${userLimits.singleTransactionLimit}` 
      };
    }

    // Check daily limit
    if (todaySpent + baseAmount > userLimits.dailyLimit) {
      return { 
        allowed: false, 
        reason: `Transaction would exceed daily limit of ${userLimits.dailyLimit}` 
      };
    }

    // Check monthly limit
    if (monthlySpent + baseAmount > userLimits.monthlyLimit) {
      return { 
        allowed: false, 
        reason: `Transaction would exceed monthly limit of ${userLimits.monthlyLimit}` 
      };
    }

    // Check international transfer limits
    if (request.type === TransactionType.INTERNATIONAL_TRANSFER) {
      const todayInternationalSpent = await this.getTodayInternationalSpent(userId);
      if (todayInternationalSpent + baseAmount > userLimits.internationalDailyLimit) {
        return { 
          allowed: false, 
          reason: `Transaction would exceed international daily limit of ${userLimits.internationalDailyLimit}` 
        };
      }
    }

    return { allowed: true };
  }

  private async calculateTransactionFees(request: TransactionRequest): Promise<FeeCalculation> {
    const feeStructure = await this.getFeeStructure(request.type, request.currency);
    let fees: FeeBreakdown = {
      transactionFee: 0,
      exchangeFee: 0,
      processingFee: 0,
      total: 0,
      currency: request.currency
    };

    // Calculate base transaction fee
    fees.transactionFee = this.calculateBaseFee(request.amount, feeStructure.baseRate);

    // Calculate exchange fee for international transfers
    if (request.type === TransactionType.INTERNATIONAL_TRANSFER && request.recipient?.country) {
      const exchangeRate = await this.currencyService.getExchangeRate(
        request.currency, 
        await this.getDestinationCurrency(request.recipient.country)
      );
      
      fees.exchangeFee = request.amount * feeStructure.exchangeRate;
    }

    // Calculate processing fee for high-value transactions
    if (request.amount > this.HIGH_VALUE_THRESHOLD) {
      fees.processingFee = feeStructure.processingFee || 0;
    }

    fees.total = fees.transactionFee + (fees.exchangeFee || 0) + (fees.processingFee || 0);

    return {
      fees,
      totalAmount: request.amount + fees.total,
      exchangeRate: await this.getApplicableExchangeRate(request),
      estimatedProcessingTime: this.estimateProcessingTime(request.type)
    };
  }

  private async executeTransactionByType(session: TransactionSession): Promise<ExecutionResult> {
    switch (session.request.type) {
      case TransactionType.DOMESTIC_TRANSFER:
        return await this.executeDomesticTransfer(session);
      
      case TransactionType.INTERNATIONAL_TRANSFER:
        return await this.executeInternationalTransfer(session);
      
      case TransactionType.BILL_PAYMENT:
        return await this.executeBillPayment(session);
      
      case TransactionType.AIRTIME_PURCHASE:
        return await this.executeAirtimePurchase(session);
      
      case TransactionType.DATA_PURCHASE:
        return await this.executeDataPurchase(session);
      
      case TransactionType.CARD_FUNDING:
        return await this.executeCardFunding(session);
      
      default:
        throw new Error(`Unsupported transaction type: ${session.request.type}`);
    }
  }

  private async executeDomesticTransfer(session: TransactionSession): Promise<ExecutionResult> {
    const transferData = {
      amount: session.request.amount,
      currency: session.request.currency,
      recipient: session.request.recipient,
      reference: session.reference,
      narration: session.request.description || 'Payde Transfer',
      sessionId: session.id
    };

    // Encrypt sensitive data
    const encryptedTransferData = await this.encryptionService.encrypt(JSON.stringify(transferData));

    // Call banking API
    const response = await this.apiClient.post('/transactions/domestic-transfer', {
      data: encryptedTransferData.data,
      iv: encryptedTransferData.iv,
      checksum: await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        JSON.stringify(transferData)
      )
    });

    if (response.success) {
      return {
        success: true,
        reference: response.transactionReference,
        status: TransactionStatus.PROCESSING,
        estimatedCompletion: Date.now() + (5 * 60 * 1000) // 5 minutes
      };
    }

    return {
      success: false,
      error: response.error || 'Transfer failed'
    };
  }

  private async executeInternationalTransfer(session: TransactionSession): Promise<ExecutionResult> {
    // International transfers require additional verification and compliance checks
    const complianceCheck = await this.performComplianceCheck(session);
    if (!complianceCheck.passed) {
      return {
        success: false,
        error: complianceCheck.reason,
        status: TransactionStatus.REQUIRES_VERIFICATION
      };
    }

    const transferData = {
      amount: session.request.amount,
      currency: session.request.currency,
      recipient: session.request.recipient,
      reference: session.reference,
      purpose: session.request.description || 'International Transfer',
      exchangeRate: session.feeCalculation.exchangeRate,
      sessionId: session.id,
      complianceReference: complianceCheck.reference
    };

    const encryptedTransferData = await this.encryptionService.encrypt(JSON.stringify(transferData));

    const response = await this.apiClient.post('/transactions/international-transfer', {
      data: encryptedTransferData.data,
      iv: encryptedTransferData.iv,
      checksum: await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        JSON.stringify(transferData)
      )
    });

    if (response.success) {
      return {
        success: true,
        reference: response.transactionReference,
        status: TransactionStatus.PROCESSING,
        estimatedCompletion: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      };
    }

    return {
      success: false,
      error: response.error || 'International transfer failed'
    };
  }

  private async executeBillPayment(session: TransactionSession): Promise<ExecutionResult> {
    const billData = {
      amount: session.request.amount,
      currency: session.request.currency,
      billerId: session.request.metadata?.billerId,
      customerReference: session.request.metadata?.customerReference,
      reference: session.reference,
      sessionId: session.id
    };

    // Verify bill details with provider
    const billVerification = await this.verifyBillDetails(billData);
    if (!billVerification.valid) {
      return {
        success: false,
        error: billVerification.error
      };
    }

    const encryptedBillData = await this.encryptionService.encrypt(JSON.stringify(billData));

    const response = await this.apiClient.post('/transactions/bill-payment', {
      data: encryptedBillData.data,
      iv: encryptedBillData.iv,
      checksum: await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        JSON.stringify(billData)
      )
    });

    if (response.success) {
      return {
        success: true,
        reference: response.transactionReference,
        status: TransactionStatus.COMPLETED, // Bill payments are usually instant
        confirmationCode: response.confirmationCode
      };
    }

    return {
      success: false,
      error: response.error || 'Bill payment failed'
    };
  }

  private async generateTransactionReceipt(
    session: TransactionSession, 
    executionResult: ExecutionResult
  ): Promise<TransactionReceipt> {
    const userId = await this.getCurrentUserId();
    const userDetails = await this.getUserDetails(userId);

    const receipt: TransactionReceipt = {
      id: await this.generateReceiptId(),
      reference: executionResult.reference || session.reference,
      type: session.request.type,
      amount: session.request.amount,
      currency: session.request.currency,
      fees: session.feeCalculation.fees,
      recipient: session.request.recipient || {} as RecipientDetails,
      sender: userDetails,
      status: executionResult.status || TransactionStatus.COMPLETED,
      timestamp: Date.now(),
      exchangeRate: session.feeCalculation.exchangeRate,
      processingTime: session.feeCalculation.estimatedProcessingTime,
      confirmationCode: executionResult.confirmationCode
    };

    // Store encrypted receipt
    const encryptedReceipt = await this.encryptionService.encrypt(JSON.stringify(receipt));
    await SecureStore.setItemAsync(
      `receipt_${receipt.id}`,
      JSON.stringify(encryptedReceipt)
    );

    return receipt;
  }

  private async verifyTransactionAuth(
    session: TransactionSession, 
    pin: string, 
    biometricAuth?: boolean
  ): Promise<AuthVerificationResult> {
    // Verify transaction PIN
    const pinResult = await this.pinService.verifyTransactionPIN(pin);
    if (!pinResult.success) {
      return { success: false, error: pinResult.error };
    }

    // For high-value transactions, require biometric authentication
    if (session.request.amount > this.HIGH_VALUE_THRESHOLD && biometricAuth) {
      const biometricResult = await this.biometricService.authenticateWithBiometric(
        'Confirm high-value transaction'
      );
      
      if (!biometricResult.success) {
        return { success: false, error: 'Biometric authentication required for high-value transactions' };
      }
    }

    return { success: true };
  }

  async getTransactionHistory(
    userId: string, 
    filters?: TransactionFilters
  ): Promise<TransactionReceipt[]> {
    try {
      // Get encrypted transaction history from secure storage
      const historyData = await SecureStore.getItemAsync(`transaction_history_${userId}`);
      if (!historyData) return [];

      const decryptedHistory = await this.encryptionService.decrypt(JSON.parse(historyData));
      let transactions: TransactionReceipt[] = JSON.parse(decryptedHistory);

      // Apply filters if provided
      if (filters) {
        transactions = this.applyTransactionFilters(transactions, filters);
      }

      // Sort by timestamp (most recent first)
      return transactions.sort((a, b) => b.timestamp - a.timestamp);

    } catch (error) {
      console.error('Error retrieving transaction history:', error);
      return [];
    }
  }

  async cancelTransaction(transactionId: string, reason: string): Promise<CancellationResult> {
    try {
      const session = await this.getTransactionSession(transactionId);
      if (!session) {
        return { success: false, error: 'Transaction not found' };
      }

      // Check if transaction can be cancelled
      if (session.status === TransactionStatus.COMPLETED) {
        return { success: false, error: 'Cannot cancel completed transaction' };
      }

      // Call API to cancel transaction
      const response = await this.apiClient.post('/transactions/cancel', {
        transactionId,
        reason,
        timestamp: Date.now()
      });

      if (response.success) {
        // Update session status
        session.status = TransactionStatus.CANCELLED;
        await this.updateTransactionSession(session);

        return { success: true, cancellationReference: response.cancellationReference };
      }

      return { success: false, error: response.error || 'Cancellation failed' };

    } catch (error) {
      return { success: false, error: 'Cancellation request failed' };
    }
  }

  // Real-time transaction status updates
  async subscribeToTransactionUpdates(transactionId: string, callback: (status: TransactionStatus) => void): Promise<void> {
    // This would typically use WebSocket connection for real-time updates
    const ws = new WebSocket(`${process.env.WS_URL}/transactions/${transactionId}/status`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      callback(data.status);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private determineAuthRequirements(request: TransactionRequest, totalAmount: number): AuthRequirements {
    let requiresAdditionalAuth = false;
    let authMethods: string[] = ['pin'];

    // High-value transactions require biometric
    if (totalAmount > this.HIGH_VALUE_THRESHOLD) {
      requiresAdditionalAuth = true;
      authMethods.push('biometric');
    }

    // International transfers require additional verification
    if (request.type === TransactionType.INTERNATIONAL_TRANSFER) {
      requiresAdditionalAuth = true;
      authMethods.push('otp');
    }

    return {
      requiresAdditionalAuth,
      authMethods,
      reason: this.getAuthRequirementReason(request, totalAmount)
    };
  }

  private async createTransactionSession(
    request: TransactionRequest, 
    feeCalculation: FeeCalculation
  ): Promise<TransactionSession> {
    const sessionId = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${Date.now()}-${Math.random()}-${request.amount}`
    );

    const reference = await this.generateTransactionReference();

    const session: TransactionSession = {
      id: sessionId,
      reference,
      request,
      feeCalculation,
      status: TransactionStatus.PENDING,
      createdAt: Date.now(),
      expiresAt: Date.now() + (15 * 60 * 1000), // 15 minutes expiry
      userId: await this.getCurrentUserId()
    };

    // Store encrypted session
    const encryptedSession = await this.encryptionService.encrypt(JSON.stringify(session));
    await SecureStore.setItemAsync(`transaction_session_${sessionId}`, JSON.stringify(encryptedSession));

    return session;
  }

  private async generateTransactionReference(): Promise<string> {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PAY${timestamp.slice(-6)}${random}`;
  }

  private async generateReceiptId(): Promise<string> {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `RCP${timestamp.slice(-8)}${random}`;
  }

  private requiresRecipient(type: TransactionType): boolean {
    return [
      TransactionType.DOMESTIC_TRANSFER,
      TransactionType.INTERNATIONAL_TRANSFER
    ].includes(type);
  }

  private calculateBaseFee(amount: number, baseRate: number): number {
    return Math.max(amount * baseRate, 100); // Minimum fee of 100 (in minor currency units)
  }

  private estimateProcessingTime(type: TransactionType): number {
    const processingTimes = {
      [TransactionType.DOMESTIC_TRANSFER]: 5 * 60 * 1000, // 5 minutes
      [TransactionType.INTERNATIONAL_TRANSFER]: 24 * 60 * 60 * 1000, // 24 hours
      [TransactionType.BILL_PAYMENT]: 1 * 60 * 1000, // 1 minute
      [TransactionType.AIRTIME_PURCHASE]: 30 * 1000, // 30 seconds
      [TransactionType.DATA_PURCHASE]: 30 * 1000, // 30 seconds
      [TransactionType.CARD_FUNDING]: 10 * 60 * 1000 // 10 minutes
    };

    return processingTimes[type] || 5 * 60 * 1000;
  }
}

// Type definitions for transaction-related interfaces
interface ValidationResult {
  isValid: boolean;
  error?: string;
}

interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
}

interface FeeCalculation {
  fees: FeeBreakdown;
  totalAmount: number;
  exchangeRate?: number;
  estimatedProcessingTime: number;
}

interface TransactionSession {
  id: string;
  reference: string;
  request: TransactionRequest;
  feeCalculation: FeeCalculation;
  status: TransactionStatus;
  createdAt: number;
  expiresAt: number;
  userId: string;
}

interface ExecutionResult {
  success: boolean;
  reference?: string;
  status?: TransactionStatus;
  error?: string;
  estimatedCompletion?: number;
  confirmationCode?: string;
}

interface AuthVerificationResult {
  success: boolean;
  error?: string;
}

interface AuthRequirements {
  requiresAdditionalAuth: boolean;
  authMethods: string[];
  reason: string;
}

interface TransactionFilters {
  type?: TransactionType;
  status?: TransactionStatus;
  dateFrom?: number;
  dateTo?: number;
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
}

interface CancellationResult {
  success: boolean;
  error?: string;
  cancellationReference?: string;
}

interface UserDetails {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  accountNumber: string;
}