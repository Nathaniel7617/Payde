
import React, { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import {
  Box,
  Text,
  VStack,
  HStack,
  Input,
  Button,
  Pressable,
  useColorModeValue,
  KeyboardAvoidingView,
  Center,
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';

import { StackScreenProps } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';

type OTPVerificationScreenProps = StackScreenProps<AuthStackParamList, 'OTPVerification'>;

function OTPVerificationScreen({ navigation, route }: StackScreenProps<AuthStackParamList, 'OTPVerification'>) {
  const { userId, type } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<any[]>([]);

  // Theme
  const bgColor = useColorModeValue('white', 'gray.900');
  const textColor = useColorModeValue('gray.800', 'white');
  const subtextColor = useColorModeValue('gray.600', 'gray.300');

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (type === 'phone') {
        navigation.navigate('OTPVerification', { userId, type: 'email' });
      } else {
        navigation.navigate('SetupSecurity', { userId });
      }
    } catch (error) {
      console.error('OTP verification error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setCanResend(false);
    setCountdown(60);
    // Simulate resend API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  return (
    <Box flex={1} bg={bgColor} safeArea>
      <KeyboardAvoidingView
        flex={1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <VStack flex={1} px={6} py={6} space={8}>
          {/* Header */}
          <VStack alignItems="center" space={4}>
            <Box
              w={16}
              h={16}
              borderRadius="full"
              bg="primary.100"
              alignItems="center"
              justifyContent="center"
            >
              <Ionicons 
                name={type === 'phone' ? 'phone-portrait' : 'mail'} 
                size={32} 
                color="#0066CC" 
              />
            </Box>
            
            <VStack alignItems="center" space={2}>
              <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                Verify {type === 'phone' ? 'Phone' : 'Email'}
              </Text>
              <Text fontSize="sm" color={subtextColor} textAlign="center">
                We've sent a 6-digit code to your {type === 'phone' ? 'phone number' : 'email address'}
              </Text>
            </VStack>
          </VStack>

          {/* OTP Input */}
          <VStack space={6}>
            <HStack justifyContent="space-between" px={4}>
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  maxLength={1}
                  keyboardType="numeric"
                  textAlign="center"
                  fontSize="xl"
                  fontWeight="bold"
                  w={12}
                  h={12}
                  borderRadius="lg"
                  borderWidth={2}
                  borderColor={digit ? 'primary.500' : 'gray.200'}
                  _focus={{
                    borderColor: 'primary.500',
                    backgroundColor: 'white'
                  }}
                />
              ))}
            </HStack>

            <Button
              onPress={handleVerify}
              isLoading={isLoading}
              isLoadingText="Verifying..."
              isDisabled={otp.join('').length !== 6}
              size="lg"
              borderRadius="lg"
            >
              Verify Code
            </Button>
          </VStack>

          {/* Resend */}
          <Center>
            <VStack alignItems="center" space={2}>
              <Text fontSize="sm" color={subtextColor}>
                Didn't receive the code?
              </Text>
              
              {canResend ? (
                <Pressable onPress={handleResend}>
                  <Text fontSize="sm" color="primary.500" fontWeight="medium">
                    Resend Code
                  </Text>
                </Pressable>
              ) : (
                <Text fontSize="sm" color={subtextColor}>
                  Resend in {countdown}s
                </Text>
              )}
            </VStack>
          </Center>
        </VStack>
      </KeyboardAvoidingView>
    </Box>
  );
};

export default OTPVerificationScreen;