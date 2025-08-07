
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

interface AirtimePurchaseScreenProps {
  navigation: any;
}

const AirtimePurchaseScreen: React.FC<AirtimePurchaseScreenProps> = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [selectedAmount, setSelectedAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');

  const networks = [
    { id: 'mtn', name: 'MTN', color: '#FFCC00' },
    { id: 'airtel', name: 'Airtel', color: '#FF0000' },
    { id: 'glo', name: 'Glo', color: '#00B04F' },
    { id: '9mobile', name: '9mobile', color: '#00A651' },
  ];

  const amounts = ['100', '200', '500', '1000', '2000', '5000'];

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
          Buy Airtime
        </Text>
      </HStack>

      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <VStack space={6} p={4}>
          {/* Phone Number */}
          <Box bg={cardBg} p={4} borderRadius="lg" shadow={1}>
            <VStack space={4}>
              <Text fontSize="md" fontWeight="semibold" color={textColor}>
                Phone Number
              </Text>
              <Input
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                InputLeftElement={
                  <Text ml={3} color="gray.400">+234</Text>
                }
              />
            </VStack>
          </Box>

          {/* Network Selection */}
          <Box bg={cardBg} p={4} borderRadius="lg" shadow={1}>
            <VStack space={4}>
              <Text fontSize="md" fontWeight="semibold" color={textColor}>
                Select Network
              </Text>
              <SimpleGrid columns={4} space={3}>
                {networks.map((network) => (
                  <Pressable
                    key={network.id}
                    onPress={() => setSelectedNetwork(network.id)}
                  >
                    <Box
                      p={3}
                      borderRadius="lg"
                      alignItems="center"
                      bg={selectedNetwork === network.id ? 'primary.100' : 'gray.50'}
                      borderWidth={selectedNetwork === network.id ? 2 : 1}
                      borderColor={selectedNetwork === network.id ? 'primary.500' : 'gray.200'}
                    >
                      <Box
                        w={10}
                        h={10}
                        borderRadius="full"
                        bg={network.color}
                        alignItems="center"
                        justifyContent="center"
                        mb={2}
                      >
                        <Text fontSize="xs" fontWeight="bold" color="white">
                          {network.name.charAt(0)}
                        </Text>
                      </Box>
                      <Text fontSize="xs" textAlign="center">
                        {network.name}
                      </Text>
                    </Box>
                  </Pressable>
                ))}
              </SimpleGrid>
            </VStack>
          </Box>

          {/* Amount Selection */}
          <Box bg={cardBg} p={4} borderRadius="lg" shadow={1}>
            <VStack space={4}>
              <Text fontSize="md" fontWeight="semibold" color={textColor}>
                Select Amount
              </Text>
              <SimpleGrid columns={3} space={3}>
                {amounts.map((amount) => (
                  <Pressable
                    key={amount}
                    onPress={() => setSelectedAmount(amount)}
                  >
                    <Box
                      p={3}
                      borderRadius="lg"
                      alignItems="center"
                      bg={selectedAmount === amount ? 'primary.500' : 'gray.100'}
                      borderWidth={1}
                      borderColor={selectedAmount === amount ? 'primary.500' : 'gray.200'}
                    >
                      <Text
                        fontSize="md"
                        fontWeight="semibold"
                        color={selectedAmount === amount ? 'white' : textColor}
                      >
                        ₦{amount}
                      </Text>
                    </Box>
                  </Pressable>
                ))}
              </SimpleGrid>
              
              <Input
                value={customAmount}
                onChangeText={setCustomAmount}
                placeholder="Enter custom amount"
                keyboardType="numeric"
                InputLeftElement={
                  <Text ml={3} color="gray.400">₦</Text>
                }
              />
            </VStack>
          </Box>

          {(selectedAmount || customAmount) && selectedNetwork && phoneNumber && (
            <Button
              onPress={() => navigation.navigate('Dashboard')}
              size="lg"
              borderRadius="lg"
            >
              Buy Airtime
            </Button>
          )}
        </VStack>
      </ScrollView>
    </Box>
  );
};

export default AirtimePurchaseScreen;