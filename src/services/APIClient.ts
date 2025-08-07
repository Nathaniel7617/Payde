// src/services/APIClient.ts
import * as SecureStore from 'expo-secure-store';
import * as Network from 'expo-network';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import { EncryptionService } from './EncryptionService';
import { DeviceSecurityService } from './DeviceSecurityService';

// Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
  message?: string;
  requestId?: string;
  timestamp: number;
}

export interface APIConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableEncryption: boolean;
  enableCertificatePinning: boolean;
  enableRequestSigning: boolean;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  skipAuth?: boolean;
  skipEncryption?: boolean;
  skipSigning?: boolean;
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

export interface BankingEndpoints {
  // Authentication
  login: '/auth/login';
  logout: '/auth/logout';
  refreshToken: '/auth/refresh';
  register: '/auth/register';
  verifyOTP: '/auth/verify-otp';
  
  // Account Management
  getProfile: '/account/profile';
  updateProfile: '/account/profile';
  getBalance: '/account/balance';
  getAccountDetails: '/account/details';
  
  // Transactions
  initiateTransfer: '/transactions/transfer/initiate';
  executeTransfer: '/transactions/transfer/execute';
  getTransactionHistory: '/transactions/history';
  getTransactionDetails: '/transactions/:id';
  cancelTransaction: '/transactions/:id/cancel';
  
  // Cards
  generateVirtualCard: '/cards/virtual/generate';
  getCardDetails: '/cards/:id';
  updateCardSettings: '/cards/:id/settings';
  freezeCard: '/cards/:id/freeze';
  unfreezeCard: '/cards/:id/unfreeze';
  
  // Bills & Payments
  getBillProviders: '/bills/providers';
  validateBillAccount: '/bills/validate';
  payBill: '/bills/pay';
  purchaseAirtime: '/bills/airtime';
  purchaseData: '/bills/data';
  
  // Currency & Exchange
  getExchangeRates: '/currency/rates';
  getCurrencyHistory: '/currency/history';
  calculateFees: '/currency/fees';
  
  // Beneficiaries
  getBeneficiaries: '/beneficiaries';
  addBeneficiary: '/beneficiaries';
  updateBeneficiary: '/beneficiaries/:id';
  deleteBeneficiary: '/beneficiaries/:id';
  
  // Security
  deviceBinding: '/security/device/bind';
  reportSuspiciousActivity: '/security/report';
  updateSecuritySettings: '/security/settings';
  
  // Compliance
  kycUpload: '/compliance/kyc/upload';
  kycStatus: '/compliance/kyc/status';
  amlCheck: '/compliance/aml/check';
}

export class APIClient {
  private config: APIConfig;
  private encryptionService: EncryptionService;
  private deviceSecurityService: DeviceSecurityService;
  private requestQueue: Map<string, Promise<any>> = new Map();
  private rateLimitCounters: Map<string, { count: number; resetTime: number }> = new Map();
  private deviceFingerprint: string = '';

  // Banking-specific endpoints
  public endpoints: BankingEndpoints = {
    // Authentication
    login: '/auth/login',
    logout: '/auth/logout',
    refreshToken: '/auth/refresh',
    register: '/auth/register',
    verifyOTP: '/auth/verify-otp',
    
    // Account Management
    getProfile: '/account/profile',
    updateProfile: '/account/profile',
    getBalance: '/account/balance',
    getAccountDetails: '/account/details',
    
    // Transactions
    initiateTransfer: '/transactions/transfer/initiate',
    executeTransfer: '/transactions/transfer/execute',
    getTransactionHistory: '/transactions/history',
    getTransactionDetails: '/transactions/:id',
    cancelTransaction: '/transactions/:id/cancel',
    
    // Cards
    generateVirtualCard: '/cards/virtual/generate',
    getCardDetails: '/cards/:id',
    updateCardSettings: '/cards/:id/settings',
    freezeCard: '/cards/:id/freeze',
    unfreezeCard: '/cards/:id/unfreeze',
    
    // Bills & Payments
    getBillProviders: '/bills/providers',
    validateBillAccount: '/bills/validate',
    payBill: '/bills/pay',
    purchaseAirtime: '/bills/airtime',
    purchaseData: '/bills/data',
    
    // Currency & Exchange
    getExchangeRates: '/currency/rates',
    getCurrencyHistory: '/currency/history',
    calculateFees: '/currency/fees',
    
    // Beneficiaries
    getBeneficiaries: '/beneficiaries',
    addBeneficiary: '/beneficiaries',
    updateBeneficiary: '/beneficiaries/:id',
    deleteBeneficiary: '/beneficiaries/:id',
    
    // Security
    deviceBinding: '/security/device/bind',
    reportSuspiciousActivity: '/security/report',
    updateSecuritySettings: '/security/settings',
    
    // Compliance
    kycUpload: '/compliance/kyc/upload',
    kycStatus: '/compliance/kyc/status',
    amlCheck: '/compliance/aml/check',
  };

  constructor(config: APIConfig) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      enableEncryption: true,
      enableCertificatePinning: true,
      enableRequestSigning: true,
      ...config,
    };
    
    this.encryptionService = new EncryptionService();
    this.deviceSecurityService = new DeviceSecurityService();
    
    this.initializeClient();
  }

  private async initializeClient(): Promise<void> {
    try {
      // Initialize encryption service
      await this.encryptionService.initialize();
      
      // Generate device fingerprint
      this.deviceFingerprint = await this.generateDeviceFingerprint();
      
      // Perform initial security checks
      const securityReport = await this.deviceSecurityService.performSecurityChecks();
      if (securityReport.riskLevel === 'critical') {
        throw new Error('Device security compromised');
      }
      
      // Setup certificate pinning if enabled
      if (this.config.enableCertificatePinning) {
        await this.setupCertificatePinning();
      }
      
    } catch (error) {
      console.error('Failed to initialize API client:', error);
      throw error;
    }
  }

  private async generateDeviceFingerprint(): Promise<string> {
    const deviceInfo = {
      deviceId: Device.osInternalBuildId || 'unknown',
      deviceName: Device.deviceName || 'unknown',
      osName: Device.osName || 'unknown',
      osVersion: Device.osVersion || 'unknown',
      platform: Platform.OS,
      appVersion: Application.nativeApplicationVersion || '1.0.0',
      buildNumber: Application.nativeBuildVersion || '1',
    };

    const fingerprintData = JSON.stringify(deviceInfo);
    return await this.encryptionService.hash(fingerprintData);
  }

  private async setupCertificatePinning(): Promise<void> {
    // Certificate pinning implementation would go here
    // This is a placeholder for the actual implementation
    console.log('Certificate pinning enabled');
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {};
    
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Failed to get auth token:', error);
    }
    
    return headers;
  }

  private async getSecurityHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'X-Device-ID': this.deviceFingerprint,
      'X-App-Version': Application.nativeApplicationVersion || '1.0.0',
      'X-Platform': Platform.OS,
      'X-Request-ID': this.generateRequestId(),
      'X-Timestamp': Date.now().toString(),
    };

    // Add network information
    try {
      const networkState = await Network.getNetworkStateAsync();
      headers['X-Network-Type'] = networkState.type.toString();
      headers['X-Is-Connected'] = networkState.isConnected.toString();
    } catch (error) {
      console.warn('Failed to get network state:', error);
    }

    return headers;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async signRequest(
    method: string,
    url: string,
    body?: any,
    timestamp?: string
  ): Promise<string> {
    if (!this.config.enableRequestSigning) {
      return '';
    }

    const requestData = {
      method: method.toUpperCase(),
      url,
      body: body ? JSON.stringify(body) : '',
      timestamp: timestamp || Date.now().toString(),
    };

    const signaturePayload = `${requestData.method}\n${requestData.url}\n${requestData.body}\n${requestData.timestamp}`;
    return await this.encryptionService.sign(signaturePayload);
  }

  private async encryptRequestBody(body: any): Promise<string> {
    if (!this.config.enableEncryption || !body) {
      return body;
    }

    const encryptedData = await this.encryptionService.encrypt(JSON.stringify(body));
    return JSON.stringify(encryptedData);
  }

  private async decryptResponseBody(encryptedBody: string): Promise<any> {
    if (!this.config.enableEncryption) {
      return encryptedBody;
    }

    try {
      const encryptedData = JSON.parse(encryptedBody);
      const decryptedData = await this.encryptionService.decrypt(encryptedData);
      return JSON.parse(decryptedData);
    } catch (error) {
      console.warn('Failed to decrypt response body:', error);
      return encryptedBody;
    }
  }

  private async checkRateLimit(endpoint: string): Promise<boolean> {
    const now = Date.now();
    const rateLimitKey = endpoint;
    const rateLimit = this.rateLimitCounters.get(rateLimitKey);

    if (!rateLimit) {
      this.rateLimitCounters.set(rateLimitKey, { count: 1, resetTime: now + 60000 });
      return true;
    }

    if (now > rateLimit.resetTime) {
      this.rateLimitCounters.set(rateLimitKey, { count: 1, resetTime: now + 60000 });
      return true;
    }

    if (rateLimit.count >= 100) { // 100 requests per minute
      return false;
    }

    rateLimit.count++;
    return true;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<APIResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.config.timeout,
      retries = this.config.retryAttempts,
      skipAuth = false,
      skipEncryption = false,
      skipSigning = false,
      priority = 'normal',
    } = options;

    // Check rate limiting
    if (!(await this.checkRateLimit(endpoint))) {
      return {
        success: false,
        error: 'Rate limit exceeded',
        statusCode: 429,
        timestamp: Date.now(),
      };
    }

    // Build full URL
    const url = `${this.config.baseURL}${endpoint}`;
    
    // Prepare headers
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...headers,
      ...(await this.getSecurityHeaders()),
    };

    // Add authentication headers
    if (!skipAuth) {
      const authHeaders = await this.getAuthHeaders();
      Object.assign(requestHeaders, authHeaders);
    }

    // Prepare body
    let requestBody = body;
    if (body && !skipEncryption) {
      requestBody = await this.encryptRequestBody(body);
      requestHeaders['X-Encrypted'] = 'true';
    }

    // Sign request
    if (!skipSigning) {
      const signature = await this.signRequest(
        method,
        endpoint,
        requestBody,
        requestHeaders['X-Timestamp']
      );
      if (signature) {
        requestHeaders['X-Signature'] = signature;
      }
    }

    // Create request configuration
    const requestConfig: RequestInit = {
      method,
      headers: requestHeaders,
      body: requestBody ? (typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody)) : undefined,
    };

    // Add request to queue for priority handling
    const requestId = this.generateRequestId();
    const requestPromise = this.executeRequest<T>(url, requestConfig, timeout, retries);
    
    if (priority === 'critical') {
      // Execute critical requests immediately
      return await requestPromise;
    } else {
      // Queue other requests
      this.requestQueue.set(requestId, requestPromise);
      const result = await requestPromise;
      this.requestQueue.delete(requestId);
      return result;
    }
  }

  private async executeRequest<T>(
    url: string,
    config: RequestInit,
    timeout: number,
    retries: number
  ): Promise<APIResponse<T>> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Create timeout controller
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        // Execute request
        const response = await fetch(url, {
          ...config,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Parse response
        const responseText = await response.text();
        let responseData: any;

        try {
          responseData = JSON.parse(responseText);
        } catch (parseError) {
          responseData = responseText;
        }

        // Decrypt response if needed
        if (response.headers.get('X-Encrypted') === 'true') {
          responseData = await this.decryptResponseBody(responseData);
        }

        // Handle successful response
        if (response.ok) {
          return {
            success: true,
            data: responseData,
            statusCode: response.status,
            requestId: response.headers.get('X-Request-ID') || undefined,
            timestamp: Date.now(),
          };
        }

        // Handle error response
        return {
          success: false,
          error: responseData?.error || responseData?.message || 'Request failed',
          statusCode: response.status,
          requestId: response.headers.get('X-Request-ID') || undefined,
          timestamp: Date.now(),
        };

      } catch (error: any) {
        lastError = error;
        
        // Don't retry on certain errors
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'Request timeout',
            statusCode: 408,
            timestamp: Date.now(),
          };
        }

        // Wait before retry
        if (attempt < retries) {
          await new Promise(resolve => 
            setTimeout(resolve, this.config.retryDelay * Math.pow(2, attempt))
          );
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Network request failed',
      statusCode: 0,
      timestamp: Date.now(),
    };
  }

  // Public API methods
  public async get<T>(endpoint: string, options?: RequestOptions): Promise<APIResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'GET' });
  }

  public async post<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<APIResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'POST', body });
  }

  public async put<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<APIResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'PUT', body });
  }

  public async patch<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<APIResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  public async delete<T>(endpoint: string, options?: RequestOptions): Promise<APIResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // Banking-specific convenience methods
  public async authenticateUser(credentials: { email: string; password: string }): Promise<APIResponse> {
    return this.post(this.endpoints.login, credentials, { priority: 'critical' });
  }

  public async refreshAuthToken(): Promise<APIResponse> {
    return this.post(this.endpoints.refreshToken, {}, { priority: 'high' });
  }

  public async getAccountBalance(): Promise<APIResponse> {
    return this.get(this.endpoints.getBalance, { priority: 'high' });
  }

  public async initiateTransfer(transferData: any): Promise<APIResponse> {
    return this.post(this.endpoints.initiateTransfer, transferData, { priority: 'critical' });
  }

  public async executeTransfer(transactionId: string, pin: string): Promise<APIResponse> {
    return this.post(this.endpoints.executeTransfer, { transactionId, pin }, { priority: 'critical' });
  }

  public async getTransactionHistory(filters?: any): Promise<APIResponse> {
    const queryString = filters ? `?${new URLSearchParams(filters).toString()}` : '';
    return this.get(`${this.endpoints.getTransactionHistory}${queryString}`);
  }

  public async generateVirtualCard(cardData: any): Promise<APIResponse> {
    return this.post(this.endpoints.generateVirtualCard, cardData, { priority: 'high' });
  }

  public async payBill(billData: any): Promise<APIResponse> {
    return this.post(this.endpoints.payBill, billData, { priority: 'high' });
  }

  public async getExchangeRates(currencies?: string[]): Promise<APIResponse> {
    const queryString = currencies ? `?currencies=${currencies.join(',')}` : '';
    return this.get(`${this.endpoints.getExchangeRates}${queryString}`);
  }

  public async uploadKYCDocument(documentData: FormData): Promise<APIResponse> {
    return this.makeRequest(this.endpoints.kycUpload, {
      method: 'POST',
      body: documentData,
      headers: { 'Content-Type': 'multipart/form-data' },
      skipEncryption: true,
      priority: 'high',
    });
  }

  // Utility methods
  public async checkNetworkStatus(): Promise<boolean> {
    try {
      const networkState = await Network.getNetworkStateAsync();
      return networkState.isConnected;
    } catch (error) {
      return false;
    }
  }

  public clearRequestQueue(): void {
    this.requestQueue.clear();
  }

  public getQueueSize(): number {
    return this.requestQueue.size;
  }

  public async logout(): Promise<void> {
    try {
      await this.post(this.endpoints.logout);
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      // Clear local auth data
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('refresh_token');
      this.clearRequestQueue();
    }
  }

  // Health check
  public async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health', { 
        timeout: 5000, 
        retries: 0, 
        skipAuth: true,
        skipEncryption: true,
        skipSigning: true 
      });
      return response.success;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const apiClient = new APIClient({
  baseURL: process.env.API_BASE_URL || 'https://api.payde.com',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  enableEncryption: true,
  enableCertificatePinning: true,
  enableRequestSigning: true,
});

export default apiClient;