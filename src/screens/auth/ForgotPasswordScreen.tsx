
import React, { useState } from 'react';
import {
  Box,
  Text,
  VStack,
  Input,
  Button,
  Pressable,
  useColorModeValue,
  KeyboardAvoidingView,
  FormControl,
  WarningOutlineIcon,
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

interface ForgotPasswordScreenProps {
  navigation: any;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const bgColor = useColorModeValue('white', 'gray.900');
  const textColor = useColorModeValue('gray.800', 'white');
  const subtextColor = useColorModeValue('gray.600', 'gray.300');

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate to OTP verification or success screen
      navigation.navigate('Login');
    } catch (error) {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box flex={1} bg={bgColor} safeArea>
      <KeyboardAvoidingView
        flex={1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <VStack flex={1} px={6} py={6} space={8}>
          <VStack alignItems="center" space={4}>
            <Box
              w={16}
              h={16}
              borderRadius="full"
              bg="orange.100"
              alignItems="center"
              justifyContent="center"
            >
              <Ionicons name="lock-closed" size={32} color="#F59E0B" />
            </Box>
            
            <VStack alignItems="center" space={2}>
              <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                Reset Password
              </Text>
              <Text fontSize="sm" color={subtextColor} textAlign="center">
                Enter your email and we'll send you a link to reset your password
              </Text>
            </VStack>
          </VStack>

          <VStack space={4}>
            <FormControl isInvalid={!!error}>
              <FormControl.Label>Email Address</FormControl.Label>
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                InputLeftElement={
                  <Box ml={3}>
                    <Ionicons name="mail" size={20} color="#9CA3AF" />
                  </Box>
                }
              />
              <FormControl.ErrorMessage leftIcon={<WarningOutlineIcon size="xs" />}>
                {error}
              </FormControl.ErrorMessage>
            </FormControl>

            <Button
              onPress={handleResetPassword}
              isLoading={isLoading}
              isLoadingText="Sending..."
              size="lg"
              borderRadius="lg"
            >
              Send Reset Link
            </Button>
          </VStack>

          <VStack alignItems="center" space={2}>
            <Text fontSize="sm" color={subtextColor}>
              Remember your password?
            </Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text fontSize="sm" color="primary.500" fontWeight="medium">
                Sign In
              </Text>
            </Pressable>
          </VStack>
        </VStack>
      </KeyboardAvoidingView>
    </Box>
  );
};

export default ForgotPasswordScreen;