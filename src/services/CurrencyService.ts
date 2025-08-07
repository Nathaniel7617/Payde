// src/services/CurrencyService.ts
import { APIClient, APIResponse } from './APIClient';
import { EncryptionService } from './EncryptionService';
import * as SecureStore from 'expo-secure-store';

// Types
export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  decimalPlaces: number;
  isActive: boolean;
  country: string;
  region: 'africa' | 'europe' | 'americas' | 'asia' | 'oceania';
}

export interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  inverseRate: number;
  timestamp: number;
  source: string;
  spread?: number;
  midRate?: number;
  buyRate?: number;
  sellRate?: number;
}

export interface CurrencyConversion {
  fromAmount: number;
  toAmount: number;
  fromCurrency: string;
  toCurrency: string;
  exchangeRate: number;
  fees: {
    exchangeFee: number;
    serviceFee: number;
    total: number;
  };
  timestamp: number;
  validUntil: number;
}

export interface CurrencyBalance {
  currency: string;
  balance: number;
  availableBalance: number;
  pendingBalance: number;
  lastUpdated: number;
}

export interface CurrencyPreferences {
  baseCurrency: string;
  displayCurrencies: string[];
  autoConvert: boolean;
  roundingMode: 'up' | 'down' | 'nearest';
  showSymbols: boolean;
  culturalFormatting: boolean;
}

export class CurrencyService {
  private apiClient: APIClient;
  private encryptionService: EncryptionService;
  private exchangeRateCache: Map<string, ExchangeRate> = new Map();
  private currencyCache: Map<string, Currency> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes

  // Supported currencies with cultural information
  private supportedCurrencies: Currency[] = [
    // African Currencies (Primary Markets)
    {
      code: 'NGN',
      name: 'Nigerian Naira',
      symbol: '₦',
      flag: '🇳🇬',
      decimalPlaces: 2,
      isActive: true,
      country: 'Nigeria',
      region: 'africa'
    },
    {
      code: 'GHS',
      name: 'Ghanaian Cedi',
      symbol: '₵',
      flag: '🇬🇭',
      decimalPlaces: 2,
      isActive: true,
      country: 'Ghana',
      region: 'africa'
    },
    {
      code: 'KES',
      name: 'Kenyan Shilling',
      symbol: 'KSh',
      flag: '🇰🇪',
      decimalPlaces: 2,
      isActive: true,
      country: 'Kenya',
      region: 'africa'
    },
    // Major International Currencies
    {
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      flag: '🇺🇸',
      decimalPlaces: 2,
      isActive: true,
      country: 'United States',
      region: 'americas'
    },
    {
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
      flag: '🇪🇺',
      decimalPlaces: 2,
      isActive: true,
      country: 'European Union',
      region: 'europe'
    },
    {
      code: 'GBP',
      name: 'British Pound',
      symbol: '£',
      flag: '🇬🇧',
      decimalPlaces: 2,
      isActive: true,
      country: 'United Kingdom',
      region: 'europe'
    },
    // Additional African Currencies
    {
      code: 'ZAR',
      name: 'South African Rand',
      symbol: 'R',
      flag: '🇿🇦',
      decimalPlaces: 2,
      isActive: true,
      country: 'South Africa',
      region: 'africa'
    },
    {
      code: 'EGP',
      name: 'Egyptian Pound',
      symbol: 'E£',
      flag: '🇪🇬',
      decimalPlaces: 2,
      isActive: true,
      country: 'Egypt',
      region: 'africa'
    },
    {
      code: 'MAD',
      name: 'Moroccan Dirham',
      symbol: 'DH',
      flag: '🇲🇦',
      decimalPlaces: 2,
      isActive: true,
      country: 'Morocco',
      region: 'africa'
    }
  ];

  constructor(apiClient: APIClient, encryptionService: EncryptionService) {
    this.apiClient = apiClient;
    this.encryptionService = encryptionService;
    this.initializeCurrencyCache();
  }

  private initializeCurrencyCache(): void {
    this.supportedCurrencies.forEach(currency => {
      this.currencyCache.set(currency.code, currency);
    });
  }

  // Get all supported currencies
  public getSupportedCurrencies(): Currency[] {
    return this.supportedCurrencies.filter(currency => currency.isActive);
  }

  // Get currencies by region
  public getCurrenciesByRegion(region: string): Currency[] {
    return this.supportedCurrencies.filter(
      currency => currency.region === region && currency.isActive
    );
  }

  // Get African currencies (primary markets)
  public getAfricanCurrencies(): Currency[] {
    return this.getCurrenciesByRegion('africa');
  }

  // Get currency information
  public getCurrency(code: string): Currency | null {
    return this.currencyCache.get(code.toUpperCase()) || null;
  }

  // Get real-time exchange rates
  public async getExchangeRate(
    fromCurrency: string,
    toCurrency: string,
    forceRefresh: boolean = false
  ): Promise<ExchangeRate | null> {
    const cacheKey = `${fromCurrency.toUpperCase()}-${toCurrency.toUpperCase()}`;
    
    // Check cache first
    if (!forceRefresh) {
      const cachedRate = this.exchangeRateCache.get(cacheKey);
      if (cachedRate && (Date.now() - cachedRate.timestamp) < this.cacheExpiry) {
        return cachedRate;
      }
    }

    try {
      const response: APIResponse<ExchangeRate> = await this.apiClient.get(
        `/currency/rates/${fromCurrency}/${toCurrency}`
      );

      if (response.success && response.data) {
        // Cache the exchange rate
        this.exchangeRateCache.set(cacheKey, response.data);
        
        // Also cache the inverse rate
        const inverseKey = `${toCurrency.toUpperCase()}-${fromCurrency.toUpperCase()}`;
        const inverseRate: ExchangeRate = {
          ...response.data,
          fromCurrency: toCurrency,
          toCurrency: fromCurrency,
          rate: response.data.inverseRate,
          inverseRate: response.data.rate,
        };
        this.exchangeRateCache.set(inverseKey, inverseRate);

        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Failed to get exchange rate:', error);
      return null;
    }
  }

  // Get multiple exchange rates
  public async getMultipleExchangeRates(
    baseCurrency: string,
    targetCurrencies: string[]
  ): Promise<Map<string, ExchangeRate>> {
    const rates = new Map<string, ExchangeRate>();
    
    try {
      const response: APIResponse<{ [key: string]: ExchangeRate }> = await this.apiClient.post(
        '/currency/rates/batch',
        {
          baseCurrency: baseCurrency.toUpperCase(),
          targetCurrencies: targetCurrencies.map(c => c.toUpperCase())
        }
      );

      if (response.success && response.data) {
        Object.entries(response.data).forEach(([key, rate]) => {
          rates.set(key, rate);
          // Cache each rate
          this.exchangeRateCache.set(key, rate);
        });
      }

      return rates;
    } catch (error) {
      console.error('Failed to get multiple exchange rates:', error);
      return rates;
    }
  }

  // Convert currency amounts
  public async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    includeFees: boolean = true
  ): Promise<CurrencyConversion | null> {
    if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
      return {
        fromAmount: amount,
        toAmount: amount,
        fromCurrency: fromCurrency.toUpperCase(),
        toCurrency: toCurrency.toUpperCase(),
        exchangeRate: 1,
        fees: { exchangeFee: 0, serviceFee: 0, total: 0 },
        timestamp: Date.now(),
        validUntil: Date.now() + (30 * 60 * 1000) // 30 minutes
      };
    }

    const exchangeRate = await this.getExchangeRate(fromCurrency, toCurrency);
    if (!exchangeRate) {
      return null;
    }

    // Calculate base conversion
    const baseConvertedAmount = amount * exchangeRate.rate;

    // Calculate fees
    let fees = { exchangeFee: 0, serviceFee: 0, total: 0 };
    if (includeFees) {
      fees = await this.calculateConversionFees(amount, fromCurrency, toCurrency);
    }

    const finalAmount = baseConvertedAmount - fees.total;

    return {
      fromAmount: amount,
      toAmount: finalAmount,
      fromCurrency: fromCurrency.toUpperCase(),
      toCurrency: toCurrency.toUpperCase(),
      exchangeRate: exchangeRate.rate,
      fees,
      timestamp: Date.now(),
      validUntil: Date.now() + (30 * 60 * 1000) // 30 minutes
    };
  }

  // Calculate conversion fees
  private async calculateConversionFees(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<{ exchangeFee: number; serviceFee: number; total: number }> {
    try {
      const response: APIResponse<any> = await this.apiClient.post(
        '/currency/fees/calculate',
        {
          amount,
          fromCurrency: fromCurrency.toUpperCase(),
          toCurrency: toCurrency.toUpperCase()
        }
      );

      if (response.success && response.data) {
        return response.data;
      }

      // Fallback fee calculation
      const exchangeFee = amount * 0.005; // 0.5% exchange fee
      const serviceFee = Math.min(amount * 0.001, 10); // 0.1% service fee, max $10
      return {
        exchangeFee,
        serviceFee,
        total: exchangeFee + serviceFee
      };
    } catch (error) {
      console.error('Failed to calculate conversion fees:', error);
      // Return default fees
      const exchangeFee = amount * 0.005;
      const serviceFee = Math.min(amount * 0.001, 10);
      return {
        exchangeFee,
        serviceFee,
        total: exchangeFee + serviceFee
      };
    }
  }

  // Format currency amount with cultural considerations
  public formatCurrency(
    amount: number,
    currencyCode: string,
    options: {
      locale?: string;
      showSymbol?: boolean;
      showCode?: boolean;
      decimalPlaces?: number;
      useGrouping?: boolean;
    } = {}
  ): string {
    const currency = this.getCurrency(currencyCode);
    if (!currency) {
      return amount.toString();
    }

    const {
      locale = this.getLocaleForCurrency(currencyCode),
      showSymbol = true,
      showCode = false,
      decimalPlaces = currency.decimalPlaces,
      useGrouping = true
    } = options;

    try {
      const formatter = new Intl.NumberFormat(locale, {
        style: showSymbol ? 'currency' : 'decimal',
        currency: currencyCode,
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
        useGrouping
      });

      let formatted = formatter.format(amount);

      // Handle custom symbols for African currencies
      if (showSymbol && currency.symbol !== this.getStandardSymbol(currencyCode)) {
        formatted = formatted.replace(this.getStandardSymbol(currencyCode), currency.symbol);
      }

      // Add currency code if requested
      if (showCode) {
        formatted += ` ${currencyCode}`;
      }

      return formatted;
    } catch (error) {
      console.error('Currency formatting error:', error);
      // Fallback formatting
      const symbol = showSymbol ? currency.symbol : '';
      const code = showCode ? ` ${currencyCode}` : '';
      return `${symbol}${amount.toLocaleString(locale, { 
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces 
      })}${code}`;
    }
  }

  // Get appropriate locale for currency
  private getLocaleForCurrency(currencyCode: string): string {
    const localeMap: { [key: string]: string } = {
      'NGN': 'en-NG',
      'GHS': 'en-GH',
      'KES': 'en-KE',
      'USD': 'en-US',
      'EUR': 'de-DE',
      'GBP': 'en-GB',
      'ZAR': 'en-ZA',
      'EGP': 'ar-EG',
      'MAD': 'ar-MA'
    };

    return localeMap[currencyCode.toUpperCase()] || 'en-US';
  }

  // Get standard currency symbol
  private getStandardSymbol(currencyCode: string): string {
    const symbolMap: { [key: string]: string } = {
      'NGN': '₦',
      'GHS': 'GH₵',
      'KES': 'KSh',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'ZAR': 'R',
      'EGP': 'E£',
      'MAD': 'DH'
    };

    return symbolMap[currencyCode.toUpperCase()] || currencyCode;
  }

  // Get user's currency balances
  public async getCurrencyBalances(userId: string): Promise<CurrencyBalance[]> {
    try {
      const response: APIResponse<CurrencyBalance[]> = await this.apiClient.get(
        `/account/${userId}/balances`
      );

      if (response.success && response.data) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('Failed to get currency balances:', error);
      return [];
    }
  }

  // Get user's currency preferences
  public async getCurrencyPreferences(userId: string): Promise<CurrencyPreferences | null> {
    try {
      const encryptedPrefs = await SecureStore.getItemAsync(`currency_prefs_${userId}`);
      if (encryptedPrefs) {
        const decryptedPrefs = await this.encryptionService.decrypt(JSON.parse(encryptedPrefs));
        return JSON.parse(decryptedPrefs);
      }

      // Return default preferences
      return {
        baseCurrency: 'USD',
        displayCurrencies: ['USD', 'NGN', 'GHS', 'KES'],
        autoConvert: false,
        roundingMode: 'nearest',
        showSymbols: true,
        culturalFormatting: true
      };
    } catch (error) {
      console.error('Failed to get currency preferences:', error);
      return null;
    }
  }

  // Save user's currency preferences
  public async saveCurrencyPreferences(
    userId: string,
    preferences: CurrencyPreferences
  ): Promise<boolean> {
    try {
      const encryptedPrefs = await this.encryptionService.encrypt(JSON.stringify(preferences));
      await SecureStore.setItemAsync(`currency_prefs_${userId}`, JSON.stringify(encryptedPrefs));

      // Also sync to server
      await this.apiClient.put(`/account/${userId}/currency-preferences`, preferences);

      return true;
    } catch (error) {
      console.error('Failed to save currency preferences:', error);
      return false;
    }
  }

  // Get historical exchange rates
  public async getExchangeRateHistory(
    fromCurrency: string,
    toCurrency: string,
    period: '1d' | '1w' | '1m' | '3m' | '1y' = '1m'
  ): Promise<{ timestamp: number; rate: number }[]> {
    try {
      const response: APIResponse<{ timestamp: number; rate: number }[]> = await this.apiClient.get(
        `/currency/history/${fromCurrency}/${toCurrency}?period=${period}`
      );

      if (response.success && response.data) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('Failed to get exchange rate history:', error);
      return [];
    }
  }

  // Round currency amount according to preferences
  public roundCurrencyAmount(
    amount: number,
    currencyCode: string,
    roundingMode: 'up' | 'down' | 'nearest' = 'nearest'
  ): number {
    const currency = this.getCurrency(currencyCode);
    if (!currency) {
      return amount;
    }

    const factor = Math.pow(10, currency.decimalPlaces);

    switch (roundingMode) {
      case 'up':
        return Math.ceil(amount * factor) / factor;
      case 'down':
        return Math.floor(amount * factor) / factor;
      case 'nearest':
      default:
        return Math.round(amount * factor) / factor;
    }
  }

  // Validate currency code
  public isValidCurrency(currencyCode: string): boolean {
    return this.currencyCache.has(currencyCode.toUpperCase());
  }

  // Get currency conversion rate for display
  public async getDisplayRate(
    fromCurrency: string,
    toCurrency: string
  ): Promise<string> {
    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    if (!rate) {
      return 'N/A';
    }

    const fromCurrencyInfo = this.getCurrency(fromCurrency);
    const toCurrencyInfo = this.getCurrency(toCurrency);

    if (!fromCurrencyInfo || !toCurrencyInfo) {
      return rate.rate.toFixed(4);
    }

    return `1 ${fromCurrencyInfo.symbol} = ${this.formatCurrency(rate.rate, toCurrency)}`;
  }

  // Clear exchange rate cache
  public clearCache(): void {
    this.exchangeRateCache.clear();
  }

  // Get cache statistics
  public getCacheStats(): { size: number; currencies: string[] } {
    return {
      size: this.exchangeRateCache.size,
      currencies: Array.from(this.exchangeRateCache.keys())
    };
  }

  // Subscribe to real-time rate updates (WebSocket)
  public subscribeToRateUpdates(
    currencyPairs: string[],
    callback: (rates: Map<string, ExchangeRate>) => void
  ): () => void {
    // This would implement WebSocket connection for real-time rates
    // For now, we'll use polling as a fallback
    const interval = setInterval(async () => {
      const updatedRates = new Map<string, ExchangeRate>();
      
      for (const pair of currencyPairs) {
        const [from, to] = pair.split('-');
        const rate = await this.getExchangeRate(from, to, true);
        if (rate) {
          updatedRates.set(pair, rate);
        }
      }
      
      if (updatedRates.size > 0) {
        callback(updatedRates);
      }
    }, 30000); // Update every 30 seconds

    // Return unsubscribe function
    return () => clearInterval(interval);
  }
}

export default CurrencyService;