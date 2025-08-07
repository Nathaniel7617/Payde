
import React, { useState } from 'react';
import {
  Box,
  Text,
  VStack,
  Button,
  Switch,
  HStack,
  useColorModeValue,
  Divider,
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';

import { StackScreenProps } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';
import { CommonActions } from '@react-navigation/native';

type SetupSecurityScreenProps = StackScreenProps<AuthStackParamList, 'SetupSecurity'>;

function SetupSecurityScreen({ navigation, route }: StackScreenProps<AuthStackParamList, 'SetupSecurity'>) {
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const bgColor = useColorModeValue('white', 'gray.900');
  const textColor = useColorModeValue('gray.800', 'white');
  const subtextColor = useColorModeValue('gray.600', 'gray.300');

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Navigate to main app
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' as never }],
        })
      );
    } catch (error) {
      console.error('Setup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box flex={1} bg={bgColor} safeArea>
      <VStack flex={1} px={6} py={6} space={6}>
        <VStack alignItems="center" space={4}>
          <Box
            w={16}
            h={16}
            borderRadius="full"
            bg="green.100"
            alignItems="center"
            justifyContent="center"
          >
            <Ionicons name="shield-checkmark" size={32} color="#10B981" />
          </Box>
          
          <VStack alignItems="center" space={2}>
            <Text fontSize="2xl" fontWeight="bold" color={textColor}>
              Setup Security
            </Text>
            <Text fontSize="sm" color={subtextColor} textAlign="center">
              Configure your security preferences
            </Text>
          </VStack>
        </VStack>

        <VStack space={4}>
          <HStack justifyContent="space-between" alignItems="center" py={3}>
            <VStack flex={1}>
              <Text fontSize="md" fontWeight="medium" color={textColor}>
                Biometric Authentication
              </Text>
              <Text fontSize="sm" color={subtextColor}>
                Use fingerprint or face recognition
              </Text>
            </VStack>
            <Switch
              isChecked={biometricEnabled}
              onToggle={setBiometricEnabled}
              accessibilityLabel="Biometric authentication"
            />
          </HStack>

          <Divider />

          <HStack justifyContent="space-between" alignItems="center" py={3}>
            <VStack flex={1}>
              <Text fontSize="md" fontWeight="medium" color={textColor}>
                Push Notifications
              </Text>
              <Text fontSize="sm" color={subtextColor}>
                Transaction alerts and updates
              </Text>
            </VStack>
            <Switch
              isChecked={pushNotifications}
              onToggle={setPushNotifications}
              accessibilityLabel="Push notifications"
            />
          </HStack>

          <Divider />

          <HStack justifyContent="space-between" alignItems="center" py={3}>
            <VStack flex={1}>
              <Text fontSize="md" fontWeight="medium" color={textColor}>
                Email Notifications
              </Text>
              <Text fontSize="sm" color={subtextColor}>
                Receipts and security alerts
              </Text>
            </VStack>
            <Switch
              isChecked={emailNotifications}
              onToggle={setEmailNotifications}
              accessibilityLabel="Email notifications"
            />
          </HStack>
        </VStack>

        <VStack space={4} mt="auto">
          <Button
            onPress={handleComplete}
            isLoading={isLoading}
            isLoadingText="Setting up..."
            size="lg"
            borderRadius="lg"
          >
            Complete Setup
          </Button>
        </VStack>
      </VStack>
    </Box>
  );
};

export default SetupSecurityScreen;