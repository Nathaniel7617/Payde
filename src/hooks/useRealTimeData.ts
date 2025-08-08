import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import realTimeService, { BalanceUpdate, TransactionUpdate, NotificationUpdate } from '../services/RealTimeService';
import { updateBalanceRealTime } from '../store/slices/accountSlice';
import { updateTransactionStatus, addTransaction } from '../store/slices/transactionSlice';
import { addNotification } from '../store/slices/notificationSlice';

export interface UseRealTimeDataOptions {
  enableBalanceUpdates?: boolean;
  enableTransactionUpdates?: boolean;
  enableNotifications?: boolean;
  enableExchangeRates?: boolean;
  autoConnect?: boolean;
}

export const useRealTimeData = (options: UseRealTimeDataOptions = {}) => {
  const {
    enableBalanceUpdates = true,
    enableTransactionUpdates = true,
    enableNotifications = true,
    enableExchangeRates = true,
    autoConnect = true
  } = options;

  const dispatch = useAppDispatch();
  const { accessToken } = useAppSelector(state => state.auth);
  const isInitialized = useRef(false);

  // Handle balance updates
  const handleBalanceUpdate = useCallback((balanceUpdate: BalanceUpdate) => {
    console.log('Real-time balance update:', balanceUpdate);
    dispatch(updateBalanceRealTime({
      currency: balanceUpdate.currency,
      balance: balanceUpdate.balance,
      change: balanceUpdate.change,
      changeType: balanceUpdate.changeType
    }));
  }, [dispatch]);

  // Handle transaction updates
  const handleTransactionUpdate = useCallback((transactionUpdate: TransactionUpdate) => {
    console.log('Real-time transaction update:', transactionUpdate);
    
    if (transactionUpdate.status === 'completed') {
      dispatch(addTransaction({
        id: transactionUpdate.transactionId,
        amount: transactionUpdate.amount,
        currency: transactionUpdate.currency,
        type: transactionUpdate.type as any,
        description: transactionUpdate.description,
        status: 'successful' as any,
        createdAt: transactionUpdate.timestamp,
        completedAt: transactionUpdate.timestamp,
        reference: `REF-${transactionUpdate.transactionId}`,
        senderId: 'user_current',
        senderName: 'Current User',
        senderAccount: '0000000000',
        recipientName: 'Unknown',
        recipientAccount: '0000000001'
      }));
    } else {
      dispatch(updateTransactionStatus({
        id: transactionUpdate.transactionId,
        status: transactionUpdate.status === 'completed' ? 'successful' : 'pending' as any
      }));
    }
  }, [dispatch]);

  // Handle notifications
  const handleNotification = useCallback((notification: NotificationUpdate) => {
    console.log('Real-time notification:', notification);
    dispatch(addNotification({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      timestamp: notification.timestamp,
      read: notification.read
    }));
  }, [dispatch]);

  // Handle exchange rate updates
  const handleExchangeRateUpdate = useCallback((exchangeRates: Record<string, number>) => {
    console.log('Real-time exchange rates update:', exchangeRates);
    // You can dispatch to an exchange rate slice if you have one
    // dispatch(updateExchangeRates(exchangeRates));
  }, []);

  // Initialize real-time connection
  const initializeRealTime = useCallback(async () => {
    if (!accessToken || isInitialized.current) return;

    try {
      await realTimeService.initialize(accessToken);
      isInitialized.current = true;

      // Subscribe to events based on options
      if (enableBalanceUpdates) {
        realTimeService.subscribe('balance_update');
        realTimeService.on('balance_update', handleBalanceUpdate);
      }

      if (enableTransactionUpdates) {
        realTimeService.subscribe('transaction_update');
        realTimeService.on('transaction_update', handleTransactionUpdate);
      }

      if (enableNotifications) {
        realTimeService.subscribe('notification');
        realTimeService.on('notification', handleNotification);
      }

      if (enableExchangeRates) {
        realTimeService.subscribe('exchange_rate_update');
        realTimeService.on('exchange_rate_update', handleExchangeRateUpdate);
      }

    } catch (error) {
      console.error('Error initializing real-time data:', error);
    }
  }, [accessToken, enableBalanceUpdates, enableTransactionUpdates, enableNotifications, enableExchangeRates, handleBalanceUpdate, handleTransactionUpdate, handleNotification, handleExchangeRateUpdate]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (enableBalanceUpdates) {
      realTimeService.off('balance_update', handleBalanceUpdate);
      realTimeService.unsubscribe('balance_update');
    }

    if (enableTransactionUpdates) {
      realTimeService.off('transaction_update', handleTransactionUpdate);
      realTimeService.unsubscribe('transaction_update');
    }

    if (enableNotifications) {
      realTimeService.off('notification', handleNotification);
      realTimeService.unsubscribe('notification');
    }

    if (enableExchangeRates) {
      realTimeService.off('exchange_rate_update', handleExchangeRateUpdate);
      realTimeService.unsubscribe('exchange_rate_update');
    }

    isInitialized.current = false;
  }, [enableBalanceUpdates, enableTransactionUpdates, enableNotifications, enableExchangeRates, handleBalanceUpdate, handleTransactionUpdate, handleNotification, handleExchangeRateUpdate]);

  // Auto-initialize when component mounts
  useEffect(() => {
    if (autoConnect && accessToken) {
      initializeRealTime();
    }

    return cleanup;
  }, [autoConnect, accessToken, initializeRealTime, cleanup]);

  // Manually connect/disconnect functions
  const connect = useCallback(async () => {
    await initializeRealTime();
  }, [initializeRealTime]);

  const disconnect = useCallback(() => {
    cleanup();
    realTimeService.disconnect();
  }, [cleanup]);

  // Request specific updates
  const requestBalanceUpdate = useCallback((accountId?: string) => {
    const account = useAppSelector(state => state.account);
    realTimeService.requestBalanceUpdate(accountId || account.accountNumber || '');
  }, []);

  const requestTransactionStatus = useCallback((transactionId: string) => {
    realTimeService.requestTransactionStatus(transactionId);
  }, []);

  return {
    isConnected: realTimeService.isConnectedToRealTime(),
    connect,
    disconnect,
    requestBalanceUpdate,
    requestTransactionStatus,
    realTimeService
  };
};

export default useRealTimeData;