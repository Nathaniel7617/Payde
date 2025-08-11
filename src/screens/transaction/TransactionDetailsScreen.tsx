
import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  ScrollView,
  useColorModeValue,
  Badge,
  Divider,
  useToast,
  AlertDialog,
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { Share, Alert } from 'react-native';

// Redux
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchTransactionById, setCurrentTransaction } from '../../store/slices/transactionSlice';

// Services
import { TransactionStatus, TransactionType } from '../../services/TransactionService';
import ReceiptService from '../../services/ReceiptService';
import { AppConfig } from '../../config/AppConfig';

import { StackScreenProps } from '@react-navigation/stack';
import { MainStackParamList } from '../../navigation/types';

type TransactionDetailsScreenProps = StackScreenProps<MainStackParamList, 'TransactionDetails'>;

function TransactionDetailsScreen({ navigation, route }: StackScreenProps<MainStackParamList, 'TransactionDetails'>) {
  const { transactionId } = route.params;
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const cancelRef = useRef(null);

  // Redux
  const dispatch = useAppDispatch();
  const { currentTransaction: transaction, isLoading } = useAppSelector(state => state.transactions);
  const { user } = useAppSelector(state => state.auth);

  // Services
  const [receiptService] = useState(() => new ReceiptService({
    template: 'standard' as const,
    format: 'pdf' as const,
    delivery: ['download'] as const,
    branding: {
      ...AppConfig.receipt.branding,
      colors: {
        ...AppConfig.receipt.branding.colors,
        accent: '#0066CC'
      }
    }
  }));
  const toast = useToast();

  // Theme
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const subtextColor = useColorModeValue('gray.600', 'gray.300');

  useEffect(() => {
    loadTransactionDetails();
    return () => {
      dispatch(setCurrentTransaction(null));
    };
  }, [transactionId]);

  const loadTransactionDetails = async () => {
    try {
      await dispatch(fetchTransactionById(transactionId));
    } catch (error) {
      console.error('Error loading transaction details:', error);
    }
  };

  const getStatusColor = (status: TransactionStatus): string => {
    switch (status) {
      case TransactionStatus.SUCCESSFUL:
        return 'green';
      case TransactionStatus.FAILED:
        return 'red';
      case TransactionStatus.PENDING:
      case TransactionStatus.PROCESSING:
        return 'orange';
      case TransactionStatus.CANCELLED:
        return 'gray';
      case TransactionStatus.REVERSED:
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getStatusText = (status: TransactionStatus): string => {
    switch (status) {
      case TransactionStatus.SUCCESSFUL:
        return 'Successful';
      case TransactionStatus.FAILED:
        return 'Failed';
      case TransactionStatus.PENDING:
        return 'Pending';
      case TransactionStatus.PROCESSING:
        return 'Processing';
      case TransactionStatus.CANCELLED:
        return 'Cancelled';
      case TransactionStatus.REVERSED:
        return 'Reversed';
      default:
        return 'Unknown';
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

  const handleShareReceipt = async () => {
    if (!transaction) return;

    setIsGeneratingReceipt(true);
    try {
      const receiptData = await receiptService.generateReceipt({
        transactionId: transaction.id,
        format: 'pdf',
        delivery: ['share'],
      });

      await Share.share({
        message: `Transaction Receipt - ${transaction.reference}`,
        url: '', // Receipt service will generate the URL
        title: 'Transaction Receipt',
      });

      toast.show({
        description: 'Receipt shared successfully',
        bgColor: 'green.500',
      });
    } catch (error) {
      toast.show({
        description: 'Failed to share receipt',
        bgColor: 'red.500',
      });
    } finally {
      setIsGeneratingReceipt(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!transaction) return;

    setIsGeneratingReceipt(true);
    try {
      await receiptService.generateReceipt({
        transactionId: transaction.id,
        format: 'pdf',
        delivery: ['download'],
      });

      toast.show({
        description: 'Receipt downloaded to your device',
        bgColor: 'green.500',
      });
    } catch (error) {
      toast.show({
        description: 'Failed to download receipt',
        bgColor: 'red.500',
      });
    } finally {
      setIsGeneratingReceipt(false);
    }
  };

  const handleDispute = () => {
    setShowDisputeDialog(false);
    // Navigate to dispute screen or handle dispute logic
    toast.show({
      description: 'Dispute reported. Our team will review it shortly.',
      bgColor: 'blue.500',
    });
  };

  if (isLoading) {
    return (
      <Box flex={1} bg={bgColor} safeArea justifyContent="center" alignItems="center">
        <Text color={subtextColor}>Loading transaction details...</Text>
      </Box>
    );
  }

  if (!transaction) {
    return (
      <Box flex={1} bg={bgColor} safeArea justifyContent="center" alignItems="center">
        <Ionicons name="alert-circle" size={64} color="#EF4444" />
        <Text fontSize="lg" fontWeight="medium" color={textColor} mt={4}>
          Transaction Not Found
        </Text>
        <Text fontSize="sm" color={subtextColor} textAlign="center" mt={2}>
          The transaction you're looking for doesn't exist or has been removed.
        </Text>
        <Button mt={4} onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </Box>
    );
  }

  const isDebit = [
    TransactionType.DOMESTIC_TRANSFER,
    TransactionType.INTERNATIONAL_TRANSFER,
    TransactionType.BILL_PAYMENT,
    TransactionType.AIRTIME_PURCHASE,
    TransactionType.DATA_PURCHASE,
    TransactionType.WITHDRAWAL,
    TransactionType.CARD_TRANSACTION,
  ].includes(transaction.type as TransactionType);

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
          Transaction Details
        </Text>
      </HStack>

      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <VStack space={6} p={4}>
          {/* Transaction Status */}
          <Box bg={cardBg} p={6} borderRadius="lg" shadow={1} alignItems="center">
            <VStack alignItems="center" space={4}>
              <Box
                w={16}
                h={16}
                borderRadius="full"
                bg={`${getStatusColor(transaction.status)}.100`}
                alignItems="center"
                justifyContent="center"
              >
                <Ionicons
                  name={transaction.status === TransactionStatus.SUCCESSFUL ? 'checkmark' : 
                        transaction.status === TransactionStatus.FAILED ? 'close' : 'time'}
                  size={32}
                  color={getStatusColor(transaction.status) === 'green' ? '#10B981' :
                         getStatusColor(transaction.status) === 'red' ? '#EF4444' : '#F59E0B'}
                />
              </Box>

              <VStack alignItems="center" space={1}>
                <Badge
                  colorScheme={getStatusColor(transaction.status)}
                  variant="subtle"
                  borderRadius="full"
                  _text={{ fontSize: 'sm', fontWeight: 'medium' }}
                >
                  {getStatusText(transaction.status)}
                </Badge>
                
                <Text fontSize="2xl" fontWeight="bold" color={isDebit ? 'red.500' : 'green.500'}>
                  {isDebit ? '-' : '+'}{formatCurrency(transaction.amount, transaction.currency)}
                </Text>
                
                <Text fontSize="sm" color={subtextColor}>
                  {formatTransactionType(transaction.type as TransactionType)}
                </Text>
              </VStack>
            </VStack>
          </Box>

          {/* Transaction Details */}
          <Box bg={cardBg} p={4} borderRadius="lg" shadow={1}>
            <VStack space={4}>
              <Text fontSize="md" fontWeight="semibold" color={textColor}>
                Transaction Information
              </Text>

              <VStack space={3}>
                <HStack justifyContent="space-between">
                  <Text color={subtextColor}>Reference</Text>
                  <Text color={textColor} fontWeight="medium">
                    {transaction.reference}
                  </Text>
                </HStack>

                <HStack justifyContent="space-between">
                  <Text color={subtextColor}>Amount</Text>
                  <Text color={textColor} fontWeight="medium">
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </Text>
                </HStack>

                {transaction.fees && (
                  <HStack justifyContent="space-between">
                    <Text color={subtextColor}>Fee</Text>
                    <Text color={textColor} fontWeight="medium">
                      {formatCurrency(transaction.fees.total, transaction.currency)}
                    </Text>
                  </HStack>
                )}

                <HStack justifyContent="space-between">
                  <Text color={subtextColor}>Date</Text>
                  <Text color={textColor} fontWeight="medium">
                    {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </HStack>

                {transaction.description && (
                  <HStack justifyContent="space-between" alignItems="flex-start">
                    <Text color={subtextColor}>Description</Text>
                    <Text color={textColor} fontWeight="medium" flex={1} textAlign="right">
                      {transaction.description}
                    </Text>
                  </HStack>
                )}
              </VStack>
            </VStack>
          </Box>

          {/* Recipient Information */}
          {(transaction.recipientName || transaction.recipientAccount) && (
            <Box bg={cardBg} p={4} borderRadius="lg" shadow={1}>
              <VStack space={4}>
                <Text fontSize="md" fontWeight="semibold" color={textColor}>
                  Recipient Information
                </Text>

                <VStack space={3}>
                  {transaction.recipientName && (
                    <HStack justifyContent="space-between">
                      <Text color={subtextColor}>Name</Text>
                      <Text color={textColor} fontWeight="medium">
                        {transaction.recipientName}
                      </Text>
                    </HStack>
                  )}

                  {transaction.recipientAccount && (
                    <HStack justifyContent="space-between">
                      <Text color={subtextColor}>Account</Text>
                      <Text color={textColor} fontWeight="medium">
                        {transaction.recipientAccount}
                      </Text>
                    </HStack>
                  )}

                  {transaction.recipientPhone && (
                    <HStack justifyContent="space-between">
                      <Text color={subtextColor}>Phone</Text>
                      <Text color={textColor} fontWeight="medium">
                        {transaction.recipientPhone}
                      </Text>
                    </HStack>
                  )}
                </VStack>
              </VStack>
            </Box>
          )}

          {/* Actions */}
          <VStack space={3}>
            <HStack space={3}>
              <Button
                flex={1}
                variant="outline"
                leftIcon={<Ionicons name="share" size={16} />}
                onPress={handleShareReceipt}
                isLoading={isGeneratingReceipt}
              >
                Share Receipt
              </Button>
              
              <Button
                flex={1}
                variant="outline"
                leftIcon={<Ionicons name="download" size={16} />}
                onPress={handleDownloadReceipt}
                isLoading={isGeneratingReceipt}
              >
                Download
              </Button>
            </HStack>

            {transaction.status === TransactionStatus.SUCCESSFUL && (
              <Button
                variant="outline"
                colorScheme="red"
                leftIcon={<Ionicons name="flag" size={16} />}
                onPress={() => setShowDisputeDialog(true)}
              >
                Report Issue
              </Button>
            )}
          </VStack>
        </VStack>
      </ScrollView>

      {/* Dispute Dialog */}
      <AlertDialog isOpen={showDisputeDialog} leastDestructiveRef={cancelRef} onClose={() => setShowDisputeDialog(false)}>
        <AlertDialog.Content>
          <AlertDialog.CloseButton />
          <AlertDialog.Header>Report Transaction Issue</AlertDialog.Header>
          <AlertDialog.Body>
            Are you sure you want to report an issue with this transaction? Our team will review it and contact you within 24 hours.
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button.Group space={2}>
              <Button
                variant="ghost"
                colorScheme="gray"
                onPress={() => setShowDisputeDialog(false)}
              >
                Cancel
              </Button>
              <Button colorScheme="red" onPress={handleDispute}>
                Report Issue
              </Button>
            </Button.Group>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </Box>
  );
};

export default TransactionDetailsScreen;