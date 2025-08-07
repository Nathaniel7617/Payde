
import React, { useState, useEffect } from 'react';
import { Keyboard, Platform } from 'react-native';
import {
  Box,
  Text,
  VStack,
  HStack,
  Input,
  Button,
  Checkbox,
  Pressable,
  Image,
  useColorModeValue,
  KeyboardAvoidingView,
  ScrollView,
  Toast,
  FormControl,
  WarningOutlineIcon,
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';

// Redux
import { useAppDispatch, useAppSelector } from '../../store';
import { loginUser } from '../../store/slices/authSlice';
import { showToast } from '../../store/slices/uiSlice';

// Services
import AuthService from '../../services/AuthService';
import { AppConfig } from '../../config/AppConfig';

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  // State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Redux
  const dispatch = useAppDispatch();
  const { isLoading, error, biometricEnabled } = useAppSelector(state => state.auth);

  // Theme
  const bgColor = useColorModeValue('white', 'gray.900');
  const textColor = useColorModeValue('gray.800', 'white');
  const subtextColor = useColorModeValue('gray.600', 'gray.300');

  // Services
  const [authService] = useState(() => new AuthService(AppConfig.api.baseURL));

  // Check biometric availability
  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasHardware && isEnrolled);
    } catch (error) {
      console.warn('Biometric check failed:', error);
    }
  };

  // Validation
  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle email/password login
  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    Keyboard.dismiss();

    try {
      const result = await dispatch(loginUser({ email, password })).unwrap();
      
      dispatch(showToast({
        type: 'success',
        title: 'Welcome back!',
        description: `Logged in successfully as ${result.user.firstName}`,
      }));

      // Navigation will be handled by the navigator based on auth state
    } catch (error: any) {
      dispatch(showToast({
        type: 'error',
        title: 'Login Failed',
        description: error.message || 'Please check your credentials and try again',
      }));
    }
  };

  // Handle biometric login
  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login to Payde',
        fallbackLabel: 'Use password instead',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // In a real app, you'd validate the biometric authentication with your backend
        // For demo purposes, we'll use mock credentials
        await dispatch(loginUser({ 
          email: 'demo@payde.com', 
          password: 'demo123' 
        })).unwrap();
        
        dispatch(showToast({
          type: 'success',
          title: 'Welcome back!',
          description: 'Biometric login successful',
        }));
      }
    } catch (error: any) {
      dispatch(showToast({
        type: 'error',
        title: 'Biometric Login Failed',
        description: error.message || 'Please try again',
      }));
    }
  };

  // Demo login
  const handleDemoLogin = async () => {
    setEmail('demo@payde.com');
    setPassword('demo123');
    
    setTimeout(() => {
      handleLogin();
    }, 100);
  };

  return (
    <Box flex={1} bg={bgColor} safeArea>
      <KeyboardAvoidingView
        flex={1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          flex={1}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <VStack flex={1} px={6} justifyContent="center" space={6}>
            {/* Logo and Title */}
            <VStack alignItems="center" space={4} mb={8}>
              <Box
                w={20}
                h={20}
                borderRadius="full"
                bg={{
                  linearGradient: {
                    colors: [AppConfig.ui.theme.primary, '#4F46E5'],
                    start: [0, 0],
                    end: [1, 1],
                  }
                }}
                alignItems="center"
                justifyContent="center"
              >
                <Ionicons name="card" size={40} color="white" />
              </Box>
              
              <VStack alignItems="center" space={1}>
                <Text fontSize="3xl" fontWeight="bold" color={textColor}>
                  Welcome Back
                </Text>
                <Text fontSize="md" color={subtextColor} textAlign="center">
                  Sign in to your Payde account
                </Text>
              </VStack>
            </VStack>

            {/* Demo Mode Banner */}
            {AppConfig.features.demoMode && (
              <Box
                bg="blue.50"
                borderWidth={1}
                borderColor="blue.200"
                borderRadius="lg"
                p={3}
                mb={4}
              >
                <HStack alignItems="center" space={2}>
                  <Ionicons name="information-circle" size={20} color="#3B82F6" />
                  <VStack flex={1}>
                    <Text fontSize="sm" fontWeight="medium" color="blue.700">
                      Demo Mode Active
                    </Text>
                    <Text fontSize="xs" color="blue.600">
                      Tap "Demo Login" for instant access
                    </Text>
                  </VStack>
                </HStack>
              </Box>
            )}

            {/* Login Form */}
            <VStack space={4}>
              <FormControl isInvalid={!!errors.email}>
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
                  {errors.email}
                </FormControl.ErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.password}>
                <FormControl.Label>Password</FormControl.Label>
                <Input
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  type={showPassword ? 'text' : 'password'}
                  autoCapitalize="none"
                  autoCorrect={false}
                  InputLeftElement={
                    <Box ml={3}>
                      <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
                    </Box>
                  }
                  InputRightElement={
                    <Pressable onPress={() => setShowPassword(!showPassword)} mr={3}>
                      <Ionicons
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color="#9CA3AF"
                      />
                    </Pressable>
                  }
                />
                <FormControl.ErrorMessage leftIcon={<WarningOutlineIcon size="xs" />}>
                  {errors.password}
                </FormControl.ErrorMessage>
              </FormControl>

              <HStack justifyContent="space-between" alignItems="center">
                <Checkbox
                  value="remember"
                  isChecked={rememberMe}
                  onChange={setRememberMe}
                  accessibilityLabel="Remember me"
                >
                  <Text fontSize="sm" color={subtextColor}>
                    Remember me
                  </Text>
                </Checkbox>

                <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text fontSize="sm" color="primary.500" fontWeight="medium">
                    Forgot Password?
                  </Text>
                </Pressable>
              </HStack>
            </VStack>

            {/* Login Buttons */}
            <VStack space={3}>
              <Button
                onPress={handleLogin}
                isLoading={isLoading}
                isLoadingText="Signing In..."
                size="lg"
                borderRadius="lg"
              >
                Sign In
              </Button>

              {AppConfig.features.demoMode && (
                <Button
                  onPress={handleDemoLogin}
                  variant="outline"
                  size="lg"
                  borderRadius="lg"
                  borderColor="orange.400"
                  _text={{ color: 'orange.500' }}
                >
                  Demo Login
                </Button>
              )}

              {biometricAvailable && biometricEnabled && (
                <Button
                  onPress={handleBiometricLogin}
                  variant="ghost"
                  size="lg"
                  borderRadius="lg"
                  leftIcon={<Ionicons name="finger-print" size={20} />}
                >
                  Use Biometric Login
                </Button>
              )}
            </VStack>

            {/* Alternative Login Methods */}
            <VStack space={3} alignItems="center">
              <Text fontSize="sm" color={subtextColor}>
                Or continue with
              </Text>
              
              <HStack space={4}>
                <Pressable>
                  {({ isPressed }) => (
                    <Box
                      bg={isPressed ? 'gray.100' : 'gray.50'}
                      borderRadius="lg"
                      p={3}
                      borderWidth={1}
                      borderColor="gray.200"
                    >
                      <Ionicons name="logo-google" size={24} color="#DB4437" />
                    </Box>
                  )}
                </Pressable>
                
                <Pressable>
                  {({ isPressed }) => (
                    <Box
                      bg={isPressed ? 'gray.100' : 'gray.50'}
                      borderRadius="lg"
                      p={3}
                      borderWidth={1}
                      borderColor="gray.200"
                    >
                      <Ionicons name="logo-apple" size={24} color="#000000" />
                    </Box>
                  )}
                </Pressable>
              </HStack>
            </VStack>

            {/* Sign Up Link */}
            <HStack justifyContent="center" alignItems="center" space={1}>
              <Text fontSize="sm" color={subtextColor}>
                Don't have an account?
              </Text>
              <Pressable onPress={() => navigation.navigate('Register')}>
                <Text fontSize="sm" color="primary.500" fontWeight="medium">
                  Sign Up
                </Text>
              </Pressable>
            </HStack>
          </VStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </Box>
  );
};

export default LoginScreen;