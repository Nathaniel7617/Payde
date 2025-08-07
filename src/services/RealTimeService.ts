import { EventEmitter } from 'events';
import { AppConfig } from '../config/AppConfig';

export interface RealTimeEvent {
  type: 'balance_update' | 'transaction_update' | 'notification' | 'exchange_rate_update' | 'account_status';
  data: any;
  timestamp: string;
}

export interface BalanceUpdate {
  accountId: string;
  currency: string;
  balance: number;
  previousBalance: number;
  change: number;
  changeType: 'debit' | 'credit';
}

export interface TransactionUpdate {
  transactionId: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  type: string;
  description: string;
  timestamp: string;
}

export interface NotificationUpdate {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  priority: 'low' | 'medium' | 'high';
  timestamp: string;
  read: boolean;
}

class RealTimeService extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectInterval: number = 5000;
  private maxReconnectAttempts: number = 10;
  private reconnectAttempts: number = 0;
  private isConnected: boolean = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private subscriptions: Set<string> = new Set();

  constructor() {
    super();
    this.setMaxListeners(50); // Increase max listeners for multiple components
  }

  /**
   * Initialize real-time connection
   */
  async initialize(authToken: string): Promise<void> {
    try {
      const wsUrl = `${AppConfig.api.websocketURL}?token=${authToken}`;
      
      // For development/demo purposes, simulate WebSocket with polling
      if (__DEV__ || !AppConfig.api.websocketURL.startsWith('wss://')) {
        this.simulateRealTimeUpdates();
        return;
      }

      this.ws = new WebSocket(wsUrl);
      this.setupWebSocketListeners();
      
    } catch (error) {
      console.error('Error initializing real-time service:', error);
      this.simulateRealTimeUpdates();
    }
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupWebSocketListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('Real-time connection established');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.emit('connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const realTimeEvent: RealTimeEvent = JSON.parse(event.data);
        this.handleRealTimeEvent(realTimeEvent);
      } catch (error) {
        console.error('Error parsing real-time message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('Real-time connection closed');
      this.isConnected = false;
      this.stopHeartbeat();
      this.emit('disconnected');
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('Real-time connection error:', error);
      this.emit('error', error);
    };
  }

  /**
   * Handle incoming real-time events
   */
  private handleRealTimeEvent(event: RealTimeEvent): void {
    switch (event.type) {
      case 'balance_update':
        this.emit('balance_update', event.data as BalanceUpdate);
        break;
      case 'transaction_update':
        this.emit('transaction_update', event.data as TransactionUpdate);
        break;
      case 'notification':
        this.emit('notification', event.data as NotificationUpdate);
        break;
      case 'exchange_rate_update':
        this.emit('exchange_rate_update', event.data);
        break;
      case 'account_status':
        this.emit('account_status', event.data);
        break;
      default:
        console.warn('Unknown real-time event type:', event.type);
    }
  }

  /**
   * Subscribe to specific event types
   */
  subscribe(eventType: string): void {
    this.subscriptions.add(eventType);
    
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify({
        action: 'subscribe',
        eventType
      }));
    }
  }

  /**
   * Unsubscribe from event types
   */
  unsubscribe(eventType: string): void {
    this.subscriptions.delete(eventType);
    
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify({
        action: 'unsubscribe',
        eventType
      }));
    }
  }

  /**
   * Send heartbeat to maintain connection
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.ws) {
        this.ws.send(JSON.stringify({ action: 'ping' }));
      }
    }, 30000); // 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (!this.isConnected) {
        this.initialize(''); // Will need to get token from auth service
      }
    }, this.reconnectInterval * this.reconnectAttempts);
  }

  /**
   * Simulate real-time updates for development
   */
  private simulateRealTimeUpdates(): void {
    console.log('Starting real-time simulation');
    this.isConnected = true;
    this.emit('connected');

    // Simulate balance updates
    setInterval(() => {
      const balanceUpdate: BalanceUpdate = {
        accountId: '1234567890',
        currency: 'NGN',
        balance: Math.random() * 1000000 + 500000,
        previousBalance: Math.random() * 1000000 + 400000,
        change: Math.random() * 50000,
        changeType: Math.random() > 0.5 ? 'credit' : 'debit'
      };
      this.emit('balance_update', balanceUpdate);
    }, 30000); // Every 30 seconds

    // Simulate transaction updates
    setInterval(() => {
      const transactionUpdate: TransactionUpdate = {
        transactionId: `TXN-${Date.now()}`,
        status: ['completed', 'pending', 'failed'][Math.floor(Math.random() * 3)] as any,
        amount: Math.random() * 100000 + 1000,
        currency: 'NGN',
        type: 'transfer',
        description: 'Real-time transaction update',
        timestamp: new Date().toISOString()
      };
      this.emit('transaction_update', transactionUpdate);
    }, 45000); // Every 45 seconds

    // Simulate notifications
    setInterval(() => {
      const notification: NotificationUpdate = {
        id: `NOTIF-${Date.now()}`,
        title: 'Real-time Update',
        message: 'Your account has been updated with live data',
        type: ['info', 'success'][Math.floor(Math.random() * 2)] as any,
        priority: 'medium',
        timestamp: new Date().toISOString(),
        read: false
      };
      this.emit('notification', notification);
    }, 60000); // Every minute

    // Simulate exchange rate updates
    setInterval(() => {
      const exchangeRates = {
        USD: 1500 + Math.random() * 100,
        EUR: 1600 + Math.random() * 100,
        GBP: 1800 + Math.random() * 100
      };
      this.emit('exchange_rate_update', exchangeRates);
    }, 120000); // Every 2 minutes
  }

  /**
   * Get connection status
   */
  isConnectedToRealTime(): boolean {
    return this.isConnected;
  }

  /**
   * Disconnect from real-time service
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
    }
    this.isConnected = false;
    this.stopHeartbeat();
    this.removeAllListeners();
  }

  /**
   * Request real-time balance update
   */
  requestBalanceUpdate(accountId: string): void {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify({
        action: 'request_balance_update',
        accountId
      }));
    }
  }

  /**
   * Request real-time transaction status
   */
  requestTransactionStatus(transactionId: string): void {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify({
        action: 'request_transaction_status',
        transactionId
      }));
    }
  }
}

// Singleton instance
const realTimeService = new RealTimeService();
export default realTimeService;