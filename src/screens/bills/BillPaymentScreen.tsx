
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
  SimpleGrid,
  Pressable,
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';

interface BillPaymentScreenProps {
  navigation: any;
}

const BillPaymentScreen: React.FC<BillPaymentScreenProps> = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');

  const billCategories = [
    { id: 'electricity', name: 'Electricity', icon: 'flash', color: '#F59E0B' },
    { id: 'water', name: 'Water', icon: 'water', color: '#3B82F6' },
    { id: 'internet', name: 'Internet', icon: 'wifi', color: '#10B981' },
    { id: 'tv', name: 'Cable TV', icon: 'tv', color: '#8B5CF6' },
    { id: 'insurance', name: 'Insurance', icon: 'shield', color: '#EF4444' },
    { id: 'education', name: 'Education', icon: 'school', color: '#F97316' },
  ];

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
          Pay Bills
        </Text>
      </HStack>

      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <VStack space={6} p={4}>
          {/* Categories */}
          <Box bg={cardBg} p={4} borderRadius="lg" shadow={1}>
            <VStack space={4}>
              <Text fontSize="md" fontWeight="semibold" color={textColor}>
                Select Category
              </Text>
              <SimpleGrid columns={3} space={3}>
                {billCategories.map((category) => (
                  <Pressable
                    key={category.id}
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    <Box
                      p={3}
                      borderRadius="lg"
                      alignItems="center"
                      bg={selectedCategory === category.id ? 'primary.100' : 'gray.50'}
                      borderWidth={selectedCategory === category.id ? 2 : 1}
                      borderColor={selectedCategory === category.id ? 'primary.500' : 'gray.200'}
                    >
                      <Box
                        w={10}
                        h={10}
                        borderRadius="full"
                        bg={category.color}
                        alignItems="center"
                        justifyContent="center"
                        mb={2}
                      >
                        <Ionicons name={category.icon as any} size={20} color="white" />
                      </Box>
                      <Text fontSize="xs" textAlign="center" numberOfLines={2}>
                        {category.name}
                      </Text>
                    </Box>
                  </Pressable>
                ))}
              </SimpleGrid>
            </VStack>
          </Box>

          {/* Provider Selection */}
          {selectedCategory && (
            <Box bg={cardBg} p={4} borderRadius="lg" shadow={1}>
              <VStack space={4}>
                <Text fontSize="md" fontWeight="semibold" color={textColor}>
                  Select Provider
                </Text>
                <Select
                  selectedValue={selectedProvider}
                  onValueChange={setSelectedProvider}
                  placeholder="Choose provider"
                  _selectedItem={{
                    bg: "primary.600",
                    endIcon: <CheckIcon size="5" />
                  }}
                >
                  <Select.Item label="EKEDC" value="ekedc" />
                  <Select.Item label="AEDC" value="aedc" />
                  <Select.Item label="PHCN" value="phcn" />
                </Select>
              </VStack>
            </Box>
          )}

          {/* Account Details */}
          {selectedProvider && (
            <Box bg={cardBg} p={4} borderRadius="lg" shadow={1}>
              <VStack space={4}>
                <Text fontSize="md" fontWeight="semibold" color={textColor}>
                  Account Details
                </Text>
                
                <Input
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  placeholder="Account/Meter number"
                />
                
                <Input
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="Amount"
                  keyboardType="numeric"
                  InputLeftElement={
                    <Text ml={3} color="gray.400">₦</Text>
                  }
                />
              </VStack>
            </Box>
          )}

          {selectedProvider && accountNumber && amount && (
            <Button
              onPress={() => navigation.navigate('Dashboard')}
              size="lg"
              borderRadius="lg"
            >
              Pay Bill
            </Button>
          )}
        </VStack>
      </ScrollView>
    </Box>
  );
};

export default BillPaymentScreen;