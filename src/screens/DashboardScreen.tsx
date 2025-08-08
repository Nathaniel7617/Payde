
import React, { useEffect, useState, useCallback } from 'react';
import { useRealTimeData } from '../hooks/useRealTimeData';
import { RefreshControl } from 'react-native';
import {
  Box,
  Text,
  VStack,
  HStack,
  ScrollView,
  useColorModeValue,
  Pressable,
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';

// Components
import BalanceCard from '../components/cards/BalanceCard';
import QuickActionButton from '../components/buttons/QuickActionButton';
import TransactionListItem from '../components/list/TransactionListItem';
import SecurityIndicator from '../components/indicators/SecurityIndicator';
import NotificationBanner from '../components/banners/NotificationBanner';

// Redux
import { useAppDispatch, useAppSelector } from '../store';
import { fetchAccountBalance, refreshBalance } from '../store/slices/accountSlice';
import { fetchTransactions } from '../store/slices/transactionSlice';
import { setRefreshing } from '../store/slices/uiSlice';

// Services
import { KYCLevel } from '../services/AuthService';
import { AppConfig } from '../config/AppConfig';

interface DashboardScreenProps {
  navigation: any;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const [balanceVisible, setBalanceVisible] = useState(true);
  
  // Redux
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { primaryBalance, isLoading: balanceLoading, accountNumber, lastBalanceChange } = useAppSelector(state => state.account);
  const { transactions, isLoading: transactionLoading } = useAppSelector(state => state.transactions);
  const { refreshing } = useAppSelector(state => state.ui);
  const { unreadCount } = useAppSelector(state => state.notifications);
  
  // Real-time data hook
  const { isConnected, requestBalanceUpdate } = useRealTimeData({
    enableBalanceUpdates: true,
    enableTransactionUpdates: true,
    enableNotifications: true,
    autoConnect: true
  });

  // Theme
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const subtextColor = useColorModeValue('gray.600', 'gray.300');

  // Mock data for demo
  const mockNotifications = [
    {
      id: '1',
      type: 'info' as const,
      title: 'KYC Verification Pending',
      message: 'Complete your verification to unlock all features and increase your transaction limits.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      id: '2',
      type: 'success' as const,
      title: 'Transfer Successful',
      message: 'Your transfer of ₦50,000 to John Doe has been completed successfully.',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      read: true,
    },
  ];

  const quickActions = [
    {
      title: 'Send Money',
      icon: 'send',
      color: '#0066CC',
      onPress: () => navigation.navigate('Transfer'),
    },
    {
      title: 'Pay Bills',
      icon: 'receipt',
      color: '#10B981',
      onPress: () => navigation.navigate('Bills'),
    },
    {
      title: 'Buy Airtime',
      icon: 'phone-portrait',
      color: '#F59E0B',
      onPress: () => navigation.navigate('AirtimePurchase'),
    },
    {
      title: 'Cards',
      icon: 'card',
      color: '#8B5CF6',
      onPress: () => navigation.navigate('Cards'),
    },
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      await Promise.all([
        dispatch(fetchAccountBalance({})),
        dispatch(fetchTransactions({ page: 1, limit: 5 })),
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }, [dispatch]);

  const handleRefresh = async () => {
    dispatch(setRefreshing({ key: 'dashboard', isRefreshing: true }));
    
    try {
      await Promise.all([
        dispatch(refreshBalance()),
        dispatch(fetchTransactions({ page: 1, limit: 5, refresh: true })),
      ]);
      
      // Also request real-time balance update
      if (accountNumber) {
        requestBalanceUpdate(accountNumber);
      }
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      dispatch(setRefreshing({ key: 'dashboard', isRefreshing: false }));
    }
  };

  const calculateMonthlySpending = (): number => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return transactions
      .filter(transaction => {
        const transactionDate = new Date(transaction.createdAt);
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
      })
      .reduce((total, transaction) => {
        // Only count debit transactions
        if (['domestic_transfer', 'international_transfer', 'bill_payment', 'airtime_purchase', 'withdrawal'].includes(transaction.type)) {
          return total + transaction.amount;
        }
        return total;
      }, 0);
  };

  return (
    <Box flex={1} bg={bgColor} safeArea>
      <ScrollView
        flex={1}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing.dashboard}
            onRefresh={handleRefresh}
            tintColor={AppConfig.ui.theme.primary}
          />
        }
      >
        <VStack space={6} p={4}>
          {/* Header with Real-time Status */}
          <HStack justifyContent="space-between" alignItems="center">
            <VStack>
              <HStack alignItems="center" space={2}>
                <Text fontSize="sm" color={subtextColor}>
                  Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}
                </Text>
                {/* Real-time connection indicator */}
                <HStack alignItems="center" space={1}>
                  <Box 
                    size="2" 
                    borderRadius="full" 
                    bg={isConnected ? "green.400" : "red.400"} 
                  />
                  <Text fontSize="xs" color={isConnected ? "green.600" : "red.600"}>
                    {isConnected ? 'Live' : 'Offline'}
                  </Text>
                </HStack>
              </HStack>
              <Text fontSize="xl" fontWeight="bold" color={textColor}>
                {user?.firstName} {user?.lastName}
              </Text>
            </VStack>
            
            <HStack alignItems="center" space={3}>
              <SecurityIndicator
                level={user?.kycLevel || KYCLevel.LEVEL_0}
                onPress={() => navigation.navigate('Settings')}
              />
              <Pressable onPress={() => navigation.navigate('Notifications')}>
                <Box position="relative">
                  <Ionicons name="notifications" size={24} color={textColor} />
                  {unreadCount > 0 && (
                    <Box
                      position="absolute"
                      top={-2}
                      right={-2}
                      bg="red.500"
                      borderRadius="full"
                      minW={4}
                      h={4}
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Text fontSize="xs" color="white" fontWeight="bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Text>
                    </Box>
                  )}
                </Box>
              </Pressable>
            </HStack>
          </HStack>

          {/* Notifications */}
          {mockNotifications.slice(0, 1).map(notification => (
            <Box key={notification.id}>
              <NotificationBanner
                notification={notification}
                onPress={() => navigation.navigate('Notifications')}
                onDismiss={() => {}}
              />
            </Box>
          ))}

          {/* Balance Card */}
          <VStack space={2}>
            <BalanceCard
              balance={primaryBalance?.amount || 0}
              currency={primaryBalance?.currency || 'NGN'}
              monthlySpending={calculateMonthlySpending()}
              balanceVisible={balanceVisible}
              onToggleVisibility={() => setBalanceVisible(!balanceVisible)}
              onCardPress={() => navigation.navigate('AccountDetails')}
            />
            
            {/* Real-time Balance Change Indicator */}
            {lastBalanceChange && (
              <Box
                bg={lastBalanceChange.type === 'credit' ? 'green.50' : 'red.50'}
                borderColor={lastBalanceChange.type === 'credit' ? 'green.200' : 'red.200'}
                borderWidth={1}
                borderRadius="md"
                p={3}
              >
                <HStack alignItems="center" space={2}>
                  <Ionicons 
                    name={lastBalanceChange.type === 'credit' ? 'arrow-up-circle' : 'arrow-down-circle'}
                    size={16}
                    color={lastBalanceChange.type === 'credit' ? '#10B981' : '#EF4444'}
                  />
                  <Text fontSize="sm" color={lastBalanceChange.type === 'credit' ? 'green.700' : 'red.700'}>
                    Balance {lastBalanceChange.type === 'credit' ? 'increased' : 'decreased'} by{' '}
                    ₦{lastBalanceChange.amount.toLocaleString()} • {' '}
                    {new Date(lastBalanceChange.timestamp).toLocaleTimeString()}
                  </Text>
                  <Text fontSize="xs" color="green.600" fontWeight="bold">
                    LIVE
                  </Text>
                </HStack>
              </Box>
            )}
          </VStack>

          {/* Quick Actions */}
          <Box bg={cardBg} p={4} borderRadius="lg" shadow={1}>
            <VStack space={4}>
              <Text fontSize="md" fontWeight="semibold" color={textColor}>
                Quick Actions
              </Text>
              
              <HStack space={3}>
                {quickActions.map((action, index) => (
                  <Box key={action.title} flex={1}>
                    <QuickActionButton
                      title={action.title}
                      icon={action.icon}
                      color={action.color}
                      onPress={action.onPress}
                      flex={1}
                    />
                  </Box>
                ))}
              </HStack>
            </VStack>
          </Box>

          {/* Recent Transactions */}
          <Box bg={cardBg} borderRadius="lg" shadow={1} overflow="hidden">
            <VStack space={0}>
              <HStack justifyContent="space-between" alignItems="center" p={4}>
                <Text fontSize="md" fontWeight="semibold" color={textColor}>
                  Recent Transactions
                </Text>
                <Pressable onPress={() => navigation.navigate('TransactionHistory')}>
                  <Text fontSize="sm" color="primary.500" fontWeight="medium">
                    See All
                  </Text>
                </Pressable>
              </HStack>
              
              {transactionLoading ? (
                <Box p={4}>
                  <Text color={subtextColor} textAlign="center">
                    Loading transactions...
                  </Text>
                </Box>
              ) : transactions.length === 0 ? (
                <Box p={6} alignItems="center">
                  <Ionicons name="wallet-outline" size={48} color="#9CA3AF" />
                  <Text color={subtextColor} textAlign="center" mt={2}>
                    No transactions yet
                  </Text>
                  <Text fontSize="sm" color={subtextColor} textAlign="center" mt={1}>
                    Start sending money or paying bills
                  </Text>
                </Box>
              ) : (
                transactions.slice(0, 5).map((transaction, index) => (
                  <Box key={transaction.id}>
                    <TransactionListItem
                      transaction={transaction}
                      onPress={() => navigation.navigate('TransactionDetails', { transactionId: transaction.id })}
                      showDivider={index < Math.min(transactions.length, 5) - 1}
                    />
                  </Box>
                ))
              )}
            </VStack>
          </Box>

          {/* App Version */}
          <Text fontSize="xs" color={subtextColor} textAlign="center">
            Payde v1.0 - {AppConfig.environment.toUpperCase()}
          </Text>
        </VStack>
      </ScrollView>
    </Box>
  );
};

export default DashboardScreen;