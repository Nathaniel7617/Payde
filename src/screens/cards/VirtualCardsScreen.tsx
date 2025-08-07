
import React, { useState } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  useColorModeValue,
  ScrollView,
  Pressable,
  Badge,
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface VirtualCardsScreenProps {
  navigation: any;
}

const VirtualCardsScreen: React.FC<VirtualCardsScreenProps> = ({ navigation }) => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');

  const cards = [
    {
      id: '1',
      type: 'mastercard',
      last4: '4567',
      status: 'active',
      balance: 50000,
      currency: 'NGN'
    },
    {
      id: '2', 
      type: 'verve',
      last4: '8901',
      status: 'blocked',
      balance: 25000,
      currency: 'NGN'
    }
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
          Virtual Cards
        </Text>
      </HStack>

      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <VStack space={6} p={4}>
          {/* Add New Card */}
          <Button
            onPress={() => {}}
            leftIcon={<Ionicons name="add" size={20} />}
            size="lg"
            borderRadius="lg"
            variant="outline"
          >
            Create New Card
          </Button>

          {/* Cards List */}
          {cards.map((card) => (
            <Pressable key={card.id}>
              <Box borderRadius="xl" overflow="hidden" shadow={3}>
                <LinearGradient
                  colors={card.type === 'mastercard' ? ['#1565C0', '#0D47A1'] : ['#00897B', '#00695C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Box p={6}>
                    <HStack justifyContent="space-between" alignItems="flex-start" mb={4}>
                      <VStack>
                        <Text fontSize="sm" color="white" opacity={0.8}>
                          {card.type.toUpperCase()}
                        </Text>
                        <Badge
                          colorScheme={card.status === 'active' ? 'green' : 'red'}
                          variant="solid"
                          borderRadius="full"
                        >
                          {card.status}
                        </Badge>
                      </VStack>
                      <Ionicons name="card" size={32} color="white" />
                    </HStack>

                    <VStack space={2}>
                      <Text fontSize="xl" fontWeight="bold" color="white">
                        **** **** **** {card.last4}
                      </Text>
                      <HStack justifyContent="space-between">
                        <Text fontSize="sm" color="white" opacity={0.8}>
                          Balance
                        </Text>
                        <Text fontSize="lg" fontWeight="bold" color="white">
                          ₦{card.balance.toLocaleString()}
                        </Text>
                      </HStack>
                    </VStack>
                  </Box>
                </LinearGradient>
              </Box>
            </Pressable>
          ))}
        </VStack>
      </ScrollView>
    </Box>
  );
};

export default VirtualCardsScreen;