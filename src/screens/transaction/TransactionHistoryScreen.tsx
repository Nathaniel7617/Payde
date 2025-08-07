
import React, { useState, useEffect } from 'react';
import { RefreshControl } from 'react-native';
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  ScrollView,
  useColorModeValue,
  Select,
  CheckIcon,
  FlatList,
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';

// Components
import TransactionListItem from '../../components/list/TransactionListItem';

// Redux
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchTransactions, setFilters, clearFilters } from '../../store/slices/transactionSlice';
import { setRefreshing } from '../../store/slices/uiSlice';

// Services
import { TransactionStatus } from '../../services/TransactionService';

interface TransactionHistoryScreenProps {
  navigation: any;
}

const TransactionHistoryScreen: React.FC<TransactionHistoryScreenProps> = ({ navigation }) => {
  const [loadingMore, setLoadingMore] = useState(false);

  // Redux
  const dispatch = useAppDispatch();
  const { transactions, isLoading, filters, pagination } = useAppSelector(state => state.transactions);
  const { refreshing } = useAppSelector(state => state.ui);

  // Theme
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const subtextColor = useColorModeValue('gray.600', 'gray.300');

  useEffect(() => {
    loadTransactions(true);
  }, [filters]);

  const loadTransactions = async (refresh = false) => {
    try {
      await dispatch(fetchTransactions({
        page: refresh ? 1 : pagination.page + 1,
        limit: pagination.limit,
        refresh,
      }));
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleRefresh = async () => {
    dispatch(setRefreshing({ key: 'transactions', isRefreshing: true }));
    try {
      await loadTransactions(true);
    } finally {
      dispatch(setRefreshing({ key: 'transactions', isRefreshing: false }));
    }
  };

  const handleLoadMore = async () => {
    if (!pagination.hasMore || loadingMore) return;
    
    setLoadingMore(true);
    try {
      await loadTransactions(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const renderTransactionItem = ({ item, index }: { item: any; index: number }) => (
    <TransactionListItem
      transaction={item}
      onPress={() => navigation.navigate('TransactionDetails', { transactionId: item.id })}
      showDivider={index < transactions.length - 1}
    />
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <Box p={4} alignItems="center">
        <Text color={subtextColor}>Loading more transactions...</Text>
      </Box>
    );
  };

  const renderEmpty = () => (
    <Box p={6} alignItems="center">
      <Ionicons name="receipt-outline" size={64} color="#9CA3AF" />
      <Text fontSize="lg" fontWeight="medium" color={textColor} mt={4}>
        No Transactions Found
      </Text>
      <Text fontSize="sm" color={subtextColor} textAlign="center" mt={2}>
        {filters.status !== 'all' || filters.type !== 'all' 
          ? 'Try adjusting your filters to see more results'
          : 'Your transactions will appear here once you start using Payde'
        }
      </Text>
      {(filters.status !== 'all' || filters.type !== 'all') && (
        <Button
          variant="outline"
          size="sm"
          mt={4}
          onPress={() => dispatch(clearFilters())}
        >
          Clear Filters
        </Button>
      )}
    </Box>
  );

  return (
    <Box flex={1} bg={bgColor} safeArea>
      {/* Header */}
      <HStack alignItems="center" px={4} py={3} bg={cardBg}>
        <Button
          variant="ghost"
          leftIcon={<Ionicons name="arrow-back" size={20} />}
          onPress={() => navigation.goBack()}
          p={2}
        />
        <Text fontSize="lg" fontWeight="bold" color={textColor} ml={2}>
          Transaction History
        </Text>
      </HStack>

      {/* Filters */}
      <Box bg={cardBg} px={4} py={3} shadow={1}>
        <HStack space={3}>
          <Select
            flex={1}
            selectedValue={filters.status}
            onValueChange={(value) => dispatch(setFilters({ status: value as any }))}
            placeholder="All Status"
            _selectedItem={{
              bg: "primary.600",
              endIcon: <CheckIcon size="5" />
            }}
          >
            <Select.Item label="All Status" value="all" />
            <Select.Item label="Successful" value={TransactionStatus.SUCCESSFUL} />
            <Select.Item label="Pending" value={TransactionStatus.PENDING} />
            <Select.Item label="Failed" value={TransactionStatus.FAILED} />
          </Select>

          <Select
            flex={1}
            selectedValue={filters.type}
            onValueChange={(value) => dispatch(setFilters({ type: value }))}
            placeholder="All Types"
            _selectedItem={{
              bg: "primary.600",
              endIcon: <CheckIcon size="5" />
            }}
          >
            <Select.Item label="All Types" value="all" />
            <Select.Item label="Transfers" value="transfer" />
            <Select.Item label="Bill Payments" value="bill_payment" />
            <Select.Item label="Airtime" value="airtime_purchase" />
          </Select>
        </HStack>
      </Box>

      {/* Transaction List */}
      <Box flex={1} bg={cardBg} mt={2}>
        {isLoading && transactions.length === 0 ? (
          <Box flex={1} justifyContent="center" alignItems="center">
            <Text color={subtextColor}>Loading transactions...</Text>
          </Box>
        ) : (
          <FlatList
            data={transactions}
            renderItem={renderTransactionItem}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            refreshControl={
              <RefreshControl
                refreshing={refreshing.transactions}
                onRefresh={handleRefresh}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.1}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Box>
    </Box>
  );
};

export default TransactionHistoryScreen;