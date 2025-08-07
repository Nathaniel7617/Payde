
import React, { useState } from 'react';
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
  useColorModeValue,
  KeyboardAvoidingView,
  ScrollView,
  FormControl,
  WarningOutlineIcon,
  Select,
  CheckIcon,
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';

// Config
import { AppConfig } from '../../config/AppConfig';

interface RegisterScreenProps {
  navigation: any;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  // State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    country: 'NG',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Theme
  const bgColor = useColorModeValue('white', 'gray.900');
  const textColor = useColorModeValue('gray.800', 'white');
  const subtextColor = useColorModeValue('gray.600', 'gray.300');

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (formData.phone.length < 10) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!acceptTerms) {
      newErrors.terms = 'You must accept the terms and conditions';
    }

    if (!acceptPrivacy) {
      newErrors.privacy = 'You must accept the privacy policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle registration
  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    Keyboard.dismiss();
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Navigate to OTP verification
      navigation.navigate('OTPVerification', {
        userId: 'mock_user_id',
        type: 'phone'
      });
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getCountryPrefix = (countryCode: string): string => {
    const country = AppConfig.regional.supportedCountries.find(c => c.code === countryCode);
    return country?.phonePrefix || '+234';
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
          <VStack flex={1} px={6} py={6} space={6}>
            {/* Header */}
            <VStack alignItems="center" space={4}>
              <Box
                w={16}
                h={16}
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
                <Ionicons name="person-add" size={32} color="white" />
              </Box>
              
              <VStack alignItems="center" space={1}>
                <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                  Create Account
                </Text>
                <Text fontSize="sm" color={subtextColor} textAlign="center">
                  Join millions of users who trust Payde
                </Text>
              </VStack>
            </VStack>

            {/* Registration Form */}
            <VStack space={4}>
              {/* Country Selection */}
              <FormControl>
                <FormControl.Label>Country</FormControl.Label>
                <Select
                  selectedValue={formData.country}
                  minWidth="200"
                  accessibilityLabel="Choose country"
                  placeholder="Choose country"
                  _selectedItem={{
                    bg: "primary.600",
                    endIcon: <CheckIcon size="5" />
                  }}
                  onValueChange={(value) => updateFormData('country', value)}
                >
                  {AppConfig.regional.supportedCountries.map(country => (
                    <Select.Item
                      key={country.code}
                      label={`${country.name} (${country.currency})`}
                      value={country.code}
                    />
                  ))}
                </Select>
              </FormControl>

              {/* Name Fields */}
              <HStack space={3}>
                <FormControl flex={1} isInvalid={!!errors.firstName}>
                  <FormControl.Label>First Name</FormControl.Label>
                  <Input
                    value={formData.firstName}
                    onChangeText={(value) => updateFormData('firstName', value)}
                    placeholder="First name"
                    autoCapitalize="words"
                  />
                  <FormControl.ErrorMessage leftIcon={<WarningOutlineIcon size="xs" />}>
                    {errors.firstName}
                  </FormControl.ErrorMessage>
                </FormControl>

                <FormControl flex={1} isInvalid={!!errors.lastName}>
                  <FormControl.Label>Last Name</FormControl.Label>
                  <Input
                    value={formData.lastName}
                    onChangeText={(value) => updateFormData('lastName', value)}
                    placeholder="Last name"
                    autoCapitalize="words"
                  />
                  <FormControl.ErrorMessage leftIcon={<WarningOutlineIcon size="xs" />}>
                    {errors.lastName}
                  </FormControl.ErrorMessage>
                </FormControl>
              </HStack>

              {/* Email */}
              <FormControl isInvalid={!!errors.email}>
                <FormControl.Label>Email Address</FormControl.Label>
                <Input
                  value={formData.email}
                  onChangeText={(value) => updateFormData('email', value)}
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

              {/* Phone */}
              <FormControl isInvalid={!!errors.phone}>
                <FormControl.Label>Phone Number</FormControl.Label>
                <Input
                  value={formData.phone}
                  onChangeText={(value) => updateFormData('phone', value)}
                  placeholder="Phone number"
                  keyboardType="phone-pad"
                  InputLeftElement={
                    <HStack alignItems="center" ml={3} space={2}>
                      <Text fontSize="sm" color="gray.500">
                        {getCountryPrefix(formData.country)}
                      </Text>
                      <Box w="1px" h="4" bg="gray.300" />
                    </HStack>
                  }
                />
                <FormControl.ErrorMessage leftIcon={<WarningOutlineIcon size="xs" />}>
                  {errors.phone}
                </FormControl.ErrorMessage>
              </FormControl>

              {/* Password */}
              <FormControl isInvalid={!!errors.password}>
                <FormControl.Label>Password</FormControl.Label>
                <Input
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
                  placeholder="Create a password"
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

              {/* Confirm Password */}
              <FormControl isInvalid={!!errors.confirmPassword}>
                <FormControl.Label>Confirm Password</FormControl.Label>
                <Input
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateFormData('confirmPassword', value)}
                  placeholder="Confirm your password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoCapitalize="none"
                  autoCorrect={false}
                  InputLeftElement={
                    <Box ml={3}>
                      <Ionicons name="lock-closed" size={20} color="#9CA3AF" />
                    </Box>
                  }
                  InputRightElement={
                    <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} mr={3}>
                      <Ionicons
                        name={showConfirmPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color="#9CA3AF"
                      />
                    </Pressable>
                  }
                />
                <FormControl.ErrorMessage leftIcon={<WarningOutlineIcon size="xs" />}>
                  {errors.confirmPassword}
                </FormControl.ErrorMessage>
              </FormControl>

              {/* Terms and Privacy */}
              <VStack space={2}>
                <HStack alignItems="flex-start" space={3}>
                  <Checkbox
                    value="terms"
                    isChecked={acceptTerms}
                    onChange={setAcceptTerms}
                    accessibilityLabel="Accept terms"
                    mt={0.5}
                  />
                  <VStack flex={1}>
                    <HStack flexWrap="wrap" alignItems="center">
                      <Text fontSize="sm" color={subtextColor}>
                        I agree to the{' '}
                      </Text>
                      <Pressable>
                        <Text fontSize="sm" color="primary.500" fontWeight="medium">
                          Terms & Conditions
                        </Text>
                      </Pressable>
                    </HStack>
                    {errors.terms && (
                      <Text fontSize="xs" color="error.500" mt={1}>
                        {errors.terms}
                      </Text>
                    )}
                  </VStack>
                </HStack>

                <HStack alignItems="flex-start" space={3}>
                  <Checkbox
                    value="privacy"
                    isChecked={acceptPrivacy}
                    onChange={setAcceptPrivacy}
                    accessibilityLabel="Accept privacy policy"
                    mt={0.5}
                  />
                  <VStack flex={1}>
                    <HStack flexWrap="wrap" alignItems="center">
                      <Text fontSize="sm" color={subtextColor}>
                        I agree to the{' '}
                      </Text>
                      <Pressable>
                        <Text fontSize="sm" color="primary.500" fontWeight="medium">
                          Privacy Policy
                        </Text>
                      </Pressable>
                    </HStack>
                    {errors.privacy && (
                      <Text fontSize="xs" color="error.500" mt={1}>
                        {errors.privacy}
                      </Text>
                    )}
                  </VStack>
                </HStack>
              </VStack>
            </VStack>

            {/* Register Button */}
            <VStack space={4}>
              <Button
                onPress={handleRegister}
                isLoading={isLoading}
                isLoadingText="Creating Account..."
                size="lg"
                borderRadius="lg"
              >
                Create Account
              </Button>

              {/* Sign In Link */}
              <HStack justifyContent="center" alignItems="center" space={1}>
                <Text fontSize="sm" color={subtextColor}>
                  Already have an account?
                </Text>
                <Pressable onPress={() => navigation.navigate('Login')}>
                  <Text fontSize="sm" color="primary.500" fontWeight="medium">
                    Sign In
                  </Text>
                </Pressable>
              </HStack>
            </VStack>
          </VStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </Box>
  );
};

export default RegisterScreen;