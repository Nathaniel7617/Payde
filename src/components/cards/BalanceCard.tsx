
import React from 'react';
import { Pressable } from 'react-native';
import {
  Box,
  Text,
  VStack,
  HStack,
  IconButton,
  useColorModeValue,
  Progress,
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppConfig } from '../../config/AppConfig';

interface BalanceCardProps {
  balance: number;
  currency: string;
  monthlySpending: number;
  balanceVisible: boolean;
  onToggleVisibility: () => void;
  onCardPress: () => void;
}

const BalanceCard: React.FC<BalanceCardProps> = ({
  balance,
  currency,
  monthlySpending,
  balanceVisible,
  onToggleVisibility,
  onCardPress
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('white', 'white');

  const formatCurrency = (amount: number) => {
    const currencyConfig = AppConfig.currency.supported.find(c => c.code === currency);
    const symbol = currencyConfig?.symbol || currency;
    
    if (!balanceVisible) {
      return `${symbol} ****`;
    }
    
    return `${symbol} ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const spendingLimit = 500000; // Monthly spending limit
  const spendingPercentage = (monthlySpending / spendingLimit) * 100;

  return (
    <Pressable onPress={onCardPress}>
      <Box
        borderRadius="xl"
        overflow="hidden"
        shadow={3}
        mb={4}
      >
        <LinearGradient
          colors={[AppConfig.ui.theme.primary, '#4F46E5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Box p={6}>
            <HStack justifyContent="space-between" alignItems="flex-start" mb={4}>
              <VStack>
                <Text fontSize="sm" color="white" opacity={0.8}>
                  Available Balance
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color="white">
                  {formatCurrency(balance)}
                </Text>
              </VStack>
              
              <IconButton
                icon={
                  <Ionicons
                    name={balanceVisible ? 'eye' : 'eye-off'}
                    size={20}
                    color="white"
                  />
                }
                onPress={onToggleVisibility}
                variant="ghost"
                _pressed={{ bg: 'rgba(255,255,255,0.1)' }}
              />
            </HStack>

            <HStack justifyContent="space-between" alignItems="center">
              <VStack flex={1} mr={4}>
                <Text fontSize="xs" color="white" opacity={0.8} mb={1}>
                  Monthly Spending
                </Text>
                <Progress
                  value={spendingPercentage}
                  colorScheme="yellow"
                  bg="rgba(255,255,255,0.2)"
                  size="sm"
                  mb={1}
                />
                <Text fontSize="xs" color="white" opacity={0.9}>
                  {formatCurrency(monthlySpending)} of {formatCurrency(spendingLimit)}
                </Text>
              </VStack>
              
              <VStack alignItems="flex-end">
                <Text fontSize="xs" color="white" opacity={0.8}>
                  Account Type
                </Text>
                <Text fontSize="sm" color="white" fontWeight="medium">
                  Premium
                </Text>
              </VStack>
            </HStack>
          </Box>
        </LinearGradient>
      </Box>
    </Pressable>
  );
};

export default BalanceCard;