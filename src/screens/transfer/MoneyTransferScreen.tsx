
import React, { useState } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Input,
  Button,
  Select,
  CheckIcon,
  useColorModeValue,
  ScrollView,
  FormControl,
  WarningOutlineIcon,
  Divider,
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { AppConfig } from '../../config/AppConfig';

import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../../navigation/types';

type MoneyTransferScreenProps = BottomTabScreenProps<TabParamList, 'Transfer'>;

function MoneyTransferScreen({ navigation, route }: BottomTabScreenProps<TabParamList, 'Transfer'>) {
  const params = route?.params;
  
  const [formData, setFormData] = useState({
    amount: params?.amount?.toString() || '',
    recipient: params?.recipient || '',
    recipientName: '',
    recipientBank: '',
    description: '',
    currency: 'NGN',
    transferType: params?.type || 'domestic',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const subtextColor = useColorModeValue('gray.600', 'gray.300');

  const handleTransfer = async () => {
    // Validation logic here
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      navigation.navigate('Home' as never);
    } catch (error) {
      console.error('Transfer error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box flex={1} bg={bgColor} safeArea>
      <HStack alignItems="center" px={4} py={3} bg={cardBg}>
        <Button
          variant="ghost"
          leftIcon={<Ionicons name="arrow-back" size={20} />}
          onPress={() => navigation.goBack()}
          p={2}
        />
        <Text fontSize="lg" fontWeight="bold" color={textColor} ml={2}>
          Send Money
        </Text>
      </HStack>

      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <VStack space={6} p={4}>
          {/* Transfer Type */}
          <Box bg={cardBg} p={4} borderRadius="lg" shadow={1}>
            <VStack space={4}>
              <Text fontSize="md" fontWeight="semibold" color={textColor}>
                Transfer Type
              </Text>
              <Select
                selectedValue={formData.transferType}
                onValueChange={(value) => setFormData({...formData, transferType: value as 'domestic' | 'international'})}
                _selectedItem={{
                  bg: "primary.600",
                  endIcon: <CheckIcon size="5" />
                }}
              >
                <Select.Item label="Domestic Transfer" value="domestic" />
                <Select.Item label="International Transfer" value="international" />
              </Select>
            </VStack>
          </Box>

          {/* Amount */}
          <Box bg={cardBg} p={4} borderRadius="lg" shadow={1}>
            <VStack space={4}>
              <Text fontSize="md" fontWeight="semibold" color={textColor}>
                Amount
              </Text>
              <HStack space={3}>
                <Select
                  selectedValue={formData.currency}
                  onValueChange={(value) => setFormData({...formData, currency: value})}
                  w="30%"
                  _selectedItem={{
                    bg: "primary.600",
                    endIcon: <CheckIcon size="5" />
                  }}
                >
                  {AppConfig.currency.supported.map(currency => (
                    <Select.Item
                      key={currency.code}
                      label={currency.code}
                      value={currency.code}
                    />
                  ))}
                </Select>
                <Input
                  flex={1}
                  value={formData.amount}
                  onChangeText={(value) => setFormData({...formData, amount: value})}
                  placeholder="0.00"
                  keyboardType="numeric"
                  fontSize="lg"
                />
              </HStack>
            </VStack>
          </Box>

          {/* Recipient Details */}
          <Box bg={cardBg} p={4} borderRadius="lg" shadow={1}>
            <VStack space={4}>
              <Text fontSize="md" fontWeight="semibold" color={textColor}>
                Recipient Details
              </Text>
              
              <Input
                value={formData.recipient}
                onChangeText={(value) => setFormData({...formData, recipient: value})}
                placeholder="Account number or email"
              />
              
              <Input
                value={formData.recipientName}
                onChangeText={(value) => setFormData({...formData, recipientName: value})}
                placeholder="Recipient name"
              />
              
              {formData.transferType === 'domestic' && (
                <Select
                  selectedValue={formData.recipientBank}
                  onValueChange={(value) => setFormData({...formData, recipientBank: value})}
                  placeholder="Select bank"
                  _selectedItem={{
                    bg: "primary.600",
                    endIcon: <CheckIcon size="5" />
                  }}
                >
                  <Select.Item label="First Bank" value="first_bank" />
                  <Select.Item label="GTBank" value="gtbank" />
                  <Select.Item label="Access Bank" value="access_bank" />
                  <Select.Item label="Zenith Bank" value="zenith_bank" />
                </Select>
              )}
              
              <Input
                value={formData.description}
                onChangeText={(value) => setFormData({...formData, description: value})}
                placeholder="Description (optional)"
              />
            </VStack>
          </Box>

          {/* Fee Information */}
          <Box bg={cardBg} p={4} borderRadius="lg" shadow={1}>
            <VStack space={3}>
              <Text fontSize="md" fontWeight="semibold" color={textColor}>
                Transaction Summary
              </Text>
              
              <HStack justifyContent="space-between">
                <Text color={subtextColor}>Amount</Text>
                <Text color={textColor}>₦ {formData.amount || '0.00'}</Text>
              </HStack>
              
              <HStack justifyContent="space-between">
                <Text color={subtextColor}>Fee</Text>
                <Text color={textColor}>₦ 100.00</Text>
              </HStack>
              
              <Divider />
              
              <HStack justifyContent="space-between">
                <Text fontWeight="semibold" color={textColor}>Total</Text>
                <Text fontWeight="semibold" color={textColor}>
                  ₦ {(parseFloat(formData.amount || '0') + 100).toFixed(2)}
                </Text>
              </HStack>
            </VStack>
          </Box>

          <Button
            onPress={handleTransfer}
            isLoading={isLoading}
            isLoadingText="Processing..."
            size="lg"
            borderRadius="lg"
          >
            Send Money
          </Button>
        </VStack>
      </ScrollView>
    </Box>
  );
};

export default MoneyTransferScreen;