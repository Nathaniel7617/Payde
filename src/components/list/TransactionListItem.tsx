
import React from 'react';
import { Pressable } from 'react-native';
import {
  Box,
  Text,
  HStack,
  VStack,
  Badge,
  useColorModeValue,
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { Transaction, TransactionType, TransactionStatus } from '../../services/TransactionService';
import { AppConfig } from '../../config/AppConfig';

interface TransactionListItemProps {
  transaction: Transaction;
  onPress: () => void;
  showDivider?: boolean;
}

const TransactionListItem: React.FC<TransactionListItemProps> = ({
  transaction,
  onPress,
  showDivider = true
}) => {
  const textColor = useColorModeValue('gray.800', 'white');
  const subtextColor = useColorModeValue('gray.600', 'gray.300');
  const dividerColor = useColorModeValue('gray.200', 'gray.700');

  const getTransactionIcon = (type: TransactionType): string => {
    switch (type) {
      case TransactionType.DOMESTIC_TRANSFER:
      case TransactionType.INTERNATIONAL_TRANSFER:
        return 'send';
      case TransactionType.BILL_PAYMENT:
        return 'receipt';
      case TransactionType.AIRTIME_PURCHASE:
        return 'phone-portrait';
      case TransactionType.DATA_PURCHASE:
        return 'wifi';
      case TransactionType.CARD_TRANSACTION:
        return 'card';
      case TransactionType.WALLET_FUNDING:
        return 'add-circle';
      case TransactionType.WITHDRAWAL:
        return 'remove-circle';
      default:
        return 'swap-horizontal';
    }
  };

  const getTransactionColor = (type: TransactionType): string => {
    switch (type) {
      case TransactionType.DOMESTIC_TRANSFER:
      case TransactionType.INTERNATIONAL_TRANSFER:
        return '#0066CC';
      case TransactionType.BILL_PAYMENT:
        return '#10B981';
      case TransactionType.AIRTIME_PURCHASE:
      case TransactionType.DATA_PURCHASE:
        return '#F59E0B';
      case TransactionType.CARD_TRANSACTION:
        return '#8B5CF6';
      case TransactionType.WALLET_FUNDING:
        return '#10B981';
      case TransactionType.WITHDRAWAL:
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusColor = (status: TransactionStatus | string): string => {
    const statusValue = typeof status === 'string' ? status : status;
    switch (statusValue) {
      case TransactionStatus.SUCCESSFUL:
      case 'successful':
        return 'green';
      case TransactionStatus.FAILED:
      case 'failed':
        return 'red';
      case TransactionStatus.PENDING:
      case TransactionStatus.PROCESSING:
      case 'pending':
      case 'processing':
        return 'orange';
      case TransactionStatus.CANCELLED:
      case 'cancelled':
        return 'gray';
      case TransactionStatus.REVERSED:
      case 'reversed':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getStatusText = (status: TransactionStatus | string): string => {
    const statusValue = typeof status === 'string' ? status : status;
    switch (statusValue) {
      case TransactionStatus.SUCCESSFUL:
      case 'successful':
        return 'Success';
      case TransactionStatus.FAILED:
      case 'failed':
        return 'Failed';
      case TransactionStatus.PENDING:
      case 'pending':
        return 'Pending';
      case TransactionStatus.PROCESSING:
      case 'processing':
        return 'Processing';
      case TransactionStatus.CANCELLED:
      case 'cancelled':
        return 'Cancelled';
      case TransactionStatus.REVERSED:
      case 'reversed':
        return 'Reversed';
      default:
        return 'Unknown';
    }
  };

  const formatTransactionType = (type: TransactionType): string => {
    switch (type) {
      case TransactionType.DOMESTIC_TRANSFER:
        return 'Money Transfer';
      case TransactionType.INTERNATIONAL_TRANSFER:
        return 'International Transfer';
      case TransactionType.BILL_PAYMENT:
        return 'Bill Payment';
      case TransactionType.AIRTIME_PURCHASE:
        return 'Airtime Purchase';
      case TransactionType.DATA_PURCHASE:
        return 'Data Purchase';
      case TransactionType.CARD_TRANSACTION:
        return 'Card Transaction';
      case TransactionType.WALLET_FUNDING:
        return 'Wallet Funding';
      case TransactionType.WITHDRAWAL:
        return 'Withdrawal';
      default:
        return 'Transaction';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    const currencyConfig = AppConfig.currency.supported.find(c => c.code === currency);
    const symbol = currencyConfig?.symbol || currency;
    
    return `${symbol} ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const isDebit = [
    TransactionType.DOMESTIC_TRANSFER,
    TransactionType.INTERNATIONAL_TRANSFER,
    TransactionType.BILL_PAYMENT,
    TransactionType.AIRTIME_PURCHASE,
    TransactionType.DATA_PURCHASE,
    TransactionType.WITHDRAWAL
  ].includes(transaction.type);

  return (
    <Pressable onPress={onPress}>
      {state => (
        <Box
          px={4}
          py={3}
          opacity={state.pressed ? 0.8 : 1}
          borderBottomWidth={showDivider ? 1 : 0}
          borderBottomColor={dividerColor}
        >
          <HStack alignItems="center" space={3}>
            {/* Transaction Icon */}
            <Box
              bg={`${getTransactionColor(transaction.type)}20`}
              borderRadius="full"
              w={10}
              h={10}
              alignItems="center"
              justifyContent="center"
            >
              <Ionicons
                name={getTransactionIcon(transaction.type) as any}
                size={20}
                color={getTransactionColor(transaction.type)}
              />
            </Box>

            {/* Transaction Details */}
            <VStack flex={1} space={1}>
              <HStack justifyContent="space-between" alignItems="flex-start">
                <VStack flex={1}>
                  <Text
                    fontSize="md"
                    fontWeight="medium"
                    color={textColor}
                    numberOfLines={1}
                  >
                    {formatTransactionType(transaction.type)}
                  </Text>
                  <Text
                    fontSize="sm"
                    color={subtextColor}
                    numberOfLines={1}
                  >
                    {transaction.recipientName || transaction.description}
                  </Text>
                </VStack>

                <VStack alignItems="flex-end" space={1}>
                  <Text
                    fontSize="md"
                    fontWeight="semibold"
                    color={isDebit ? 'red.500' : 'green.500'}
                  >
                    {isDebit ? '-' : '+'}{formatCurrency(transaction.amount, transaction.currency)}
                  </Text>
                  <Badge
                    colorScheme={getStatusColor(transaction.status)}
                    variant="subtle"
                    borderRadius="full"
                    _text={{ fontSize: 'xs' }}
                  >
                    {getStatusText(transaction.status)}
                  </Badge>
                </VStack>
              </HStack>

              <HStack justifyContent="space-between" alignItems="center" mt={1}>
                <Text fontSize="xs" color={subtextColor}>
                  {formatDate(transaction.createdAt)}
                </Text>
                <Text fontSize="xs" color={subtextColor}>
                  {transaction.reference}
                </Text>
              </HStack>
            </VStack>
          </HStack>
        </Box>
      )}
    </Pressable>
  );
};

export default TransactionListItem;