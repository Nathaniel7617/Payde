
import React, { useState, useRef } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  ScrollView,
  useColorModeValue,
  Input,
  FormControl,
  Badge,
  Avatar,
  Pressable,
  AlertDialog,
  useToast,
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../../store';
import { KYCLevel } from '../../services/AuthService';

interface AccountDetailsScreenProps {
  navigation: any;
}

const AccountDetailsScreen: React.FC<AccountDetailsScreenProps> = ({ navigation }) => {
  const { user } = useAppSelector(state => state.auth);
  const { accountNumber, primaryBalance } = useAppSelector(state => state.account);
  
  const [isEditing, setIsEditing] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const cancelRef = useRef(null);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  
  const toast = useToast();
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const subtextColor = useColorModeValue('gray.600', 'gray.300');

  const getKYCInfo = (level: KYCLevel) => {
    switch (level) {
      case KYCLevel.LEVEL_0:
        return {
          label: 'Basic Account',
          color: 'red',
          description: 'Limited features. Complete verification to unlock more.',
          limits: {
            daily: '₦100,000',
            monthly: '₦500,000',
            balance: '₦1,000,000'
          }
        };
      case KYCLevel.LEVEL_1:
        return {
          label: 'Verified Account',
          color: 'orange',
          description: 'Phone and email verified. Upload documents for more limits.',
          limits: {
            daily: '₦500,000',
            monthly: '₦2,000,000',
            balance: '₦5,000,000'
          }
        };
      case KYCLevel.LEVEL_2:
        return {
          label: 'Enhanced Account',
          color: 'blue',
          description: 'Document verification complete. Full verification available.',
          limits: {
            daily: '₦2,000,000',
            monthly: '₦10,000,000',
            balance: '₦20,000,000'
          }
        };
      case KYCLevel.LEVEL_3:
        return {
          label: 'Premium Account',
          color: 'green',
          description: 'Full verification complete. Enjoy unlimited access.',
          limits: {
            daily: 'Unlimited',
            monthly: 'Unlimited',
            balance: 'Unlimited'
          }
        };
      default:
        return {
          label: 'Unknown',
          color: 'gray',
          description: 'Account status unknown',
          limits: {
            daily: 'N/A',
            monthly: 'N/A',
            balance: 'N/A'
          }
        };
    }
  };

  const kycInfo = getKYCInfo(user?.kycLevel || KYCLevel.LEVEL_0);

  const handleSave = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsEditing(false);
      toast.show({
        description: 'Account details updated successfully',
        bgColor: 'green.500',
      });
    } catch (error) {
      toast.show({
        description: 'Failed to update account details',
        bgColor: 'red.500',
      });
    }
  };

  const handleUpgradeAccount = () => {
    setShowUpgradeDialog(false);
    toast.show({
      description: 'Account upgrade process started. You will be contacted shortly.',
      bgColor: 'blue.500',
    });
  };

  return (
    <Box flex={1} bg={bgColor} safeArea>
      {/* Header */}
      <HStack alignItems="center" px={4} py={3} bg={cardBg}>
        <Button
          variant="ghost"
          leftIcon={<Ionicons name="arrow-back" size={20} />}
          onPress={() => navigation.goBack()}
          p={2}
        />
        <Text fontSize="lg" fontWeight="bold" color={textColor} ml={2}>
          Account Details
        </Text>
      </HStack>

      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <VStack space={6} p={4}>
          {/* Profile Header */}
          <Box bg={cardBg} p={6} borderRadius="lg" shadow={1} alignItems="center">
            <VStack alignItems="center" space={4}>
              <Avatar
                size="xl"
                source={{ uri: 'https://via.placeholder.com/150' }}
                bg="primary.500"
              >
                <Text fontSize="xl" fontWeight="bold" color="white">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </Text>
              </Avatar>
              
              <VStack alignItems="center" space={2}>
                <Text fontSize="xl" fontWeight="bold" color={textColor}>
                  {user?.firstName} {user?.lastName}
                </Text>
                
                <Badge
                  colorScheme={kycInfo.color}
                  variant="subtle"
                  borderRadius="full"
                  _text={{ fontSize: 'sm', fontWeight: 'medium' }}
                >
                  {kycInfo.label}
                </Badge>
                
                <Text fontSize="sm" color={subtextColor} textAlign="center">
                  Account Number: {accountNumber}
                </Text>
              </VStack>
            </VStack>
          </Box>

          {/* Account Status */}
          <Box bg={cardBg} p={4} borderRadius="lg" shadow={1}>
            <VStack space={4}>
              <HStack justifyContent="space-between" alignItems="center">
                <Text fontSize="md" fontWeight="semibold" color={textColor}>
                  Account Status
                </Text>
                {user?.kycLevel !== KYCLevel.LEVEL_3 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onPress={() => setShowUpgradeDialog(true)}
                  >
                    Upgrade Account
                  </Button>
                )}
              </HStack>
              
              <Text fontSize="sm" color={subtextColor}>
                {kycInfo.description}
              </Text>
              
              <VStack space={2}>
                <Text fontSize="sm" fontWeight="medium" color={textColor}>
                  Transaction Limits
                </Text>
                
                <HStack justifyContent="space-between">
                  <Text fontSize="sm" color={subtextColor}>Daily Limit</Text>
                  <Text fontSize="sm" color={textColor}>{kycInfo.limits.daily}</Text>
                </HStack>
                
                <HStack justifyContent="space-between">
                  <Text fontSize="sm" color={subtextColor}>Monthly Limit</Text>
                  <Text fontSize="sm" color={textColor}>{kycInfo.limits.monthly}</Text>
                </HStack>
                
                <HStack justifyContent="space-between">
                  <Text fontSize="sm" color={subtextColor}>Balance Limit</Text>
                  <Text fontSize="sm" color={textColor}>{kycInfo.limits.balance}</Text>
                </HStack>
              </VStack>
            </VStack>
          </Box>

          {/* Personal Information */}
          <Box bg={cardBg} p={4} borderRadius="lg" shadow={1}>
            <VStack space={4}>
              <HStack justifyContent="space-between" alignItems="center">
                <Text fontSize="md" fontWeight="semibold" color={textColor}>
                  Personal Information
                </Text>
                
                <Button
                  size="sm"
                  variant={isEditing ? 'solid' : 'outline'}
                  onPress={isEditing ? handleSave : () => setIsEditing(true)}
                >
                  {isEditing ? 'Save' : 'Edit'}
                </Button>
              </HStack>
              
              <VStack space={3}>
                <HStack space={3}>
                  <FormControl flex={1}>
                    <FormControl.Label>First Name</FormControl.Label>
                    <Input
                      value={formData.firstName}
                      onChangeText={(text) => setFormData({...formData, firstName: text})}
                      isReadOnly={!isEditing}
                      bg={isEditing ? 'white' : 'gray.100'}
                    />
                  </FormControl>
                  
                  <FormControl flex={1}>
                    <FormControl.Label>Last Name</FormControl.Label>
                    <Input
                      value={formData.lastName}
                      onChangeText={(text) => setFormData({...formData, lastName: text})}
                      isReadOnly={!isEditing}
                      bg={isEditing ? 'white' : 'gray.100'}
                    />
                  </FormControl>
                </HStack>
                
                <FormControl>
                  <FormControl.Label>Email Address</FormControl.Label>
                  <Input
                    value={formData.email}
                    onChangeText={(text) => setFormData({...formData, email: text})}
                    isReadOnly={!isEditing}
                    bg={isEditing ? 'white' : 'gray.100'}
                    keyboardType="email-address"
                  />
                </FormControl>
                
                <FormControl>
                  <FormControl.Label>Phone Number</FormControl.Label>
                  <Input
                    value={formData.phone}
                    onChangeText={(text) => setFormData({...formData, phone: text})}
                    isReadOnly={!isEditing}
                    bg={isEditing ? 'white' : 'gray.100'}
                    keyboardType="phone-pad"
                  />
                </FormControl>
              </VStack>
            </VStack>
          </Box>

          {/* Account Actions */}
          <Box bg={cardBg} borderRadius="lg" shadow={1}>
            <VStack space={0}>
              <Pressable>
                {({ isPressed }) => (
                  <HStack
                    justifyContent="space-between"
                    alignItems="center"
                    p={4}
                    opacity={isPressed ? 0.8 : 1}
                  >
                    <HStack alignItems="center" space={3}>
                      <Box
                        w={10}
                        h={10}
                        borderRadius="full"
                        bg="blue.100"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
                      </Box>
                      <VStack>
                        <Text fontSize="md" color={textColor}>
                          Identity Verification
                        </Text>
                        <Text fontSize="sm" color={subtextColor}>
                          Upload documents to increase limits
                        </Text>
                      </VStack>
                    </HStack>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </HStack>
                )}
              </Pressable>
              
              <Box ml={16} mr={4}>
                <Box h="1px" bg="gray.200" />
              </Box>
              
              <Pressable>
                {({ isPressed }) => (
                  <HStack
                    justifyContent="space-between"
                    alignItems="center"
                    p={4}
                    opacity={isPressed ? 0.8 : 1}
                  >
                    <HStack alignItems="center" space={3}>
                      <Box
                        w={10}
                        h={10}
                        borderRadius="full"
                        bg="green.100"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Ionicons name="lock-closed" size={20} color="#10B981" />
                      </Box>
                      <VStack>
                        <Text fontSize="md" color={textColor}>
                          Security Settings
                        </Text>
                        <Text fontSize="sm" color={subtextColor}>
                          Manage PIN, biometrics, and 2FA
                        </Text>
                      </VStack>
                    </HStack>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </HStack>
                )}
              </Pressable>
              
              <Box ml={16} mr={4}>
                <Box h="1px" bg="gray.200" />
              </Box>
              
              <Pressable>
                {({ isPressed }) => (
                  <HStack
                    justifyContent="space-between"
                    alignItems="center"
                    p={4}
                    opacity={isPressed ? 0.8 : 1}
                  >
                    <HStack alignItems="center" space={3}>
                      <Box
                        w={10}
                        h={10}
                        borderRadius="full"
                        bg="red.100"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                      </Box>
                      <VStack>
                        <Text fontSize="md" color={textColor}>
                          Close Account
                        </Text>
                        <Text fontSize="sm" color={subtextColor}>
                          Permanently delete your account
                        </Text>
                      </VStack>
                    </HStack>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </HStack>
                )}
              </Pressable>
            </VStack>
          </Box>
        </VStack>
      </ScrollView>

      {/* Upgrade Account Dialog */}
      <AlertDialog isOpen={showUpgradeDialog} leastDestructiveRef={cancelRef} onClose={() => setShowUpgradeDialog(false)}>
        <AlertDialog.Content>
          <AlertDialog.CloseButton />
          <AlertDialog.Header>Upgrade Account</AlertDialog.Header>
          <AlertDialog.Body>
            Upgrading your account will increase your transaction limits and unlock additional features. 
            Our team will contact you within 24 hours to guide you through the process.
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button.Group space={2}>
              <Button
                variant="ghost"
                colorScheme="gray"
                onPress={() => setShowUpgradeDialog(false)}
              >
                Cancel
              </Button>
              <Button onPress={handleUpgradeAccount}>
                Start Upgrade
              </Button>
            </Button.Group>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </Box>
  );
};

export default AccountDetailsScreen;