
import React, { useState, useRef } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  ScrollView,
  useColorModeValue,
  Switch,
  Pressable,
  Divider,
  Select,
  CheckIcon,
  AlertDialog,
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector, useAppDispatch } from '../../store';
import { updatePreferences, updateSecuritySettings } from '../../store/slices/authSlice';

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { user } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const cancelRef = useRef(null);

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const subtextColor = useColorModeValue('gray.600', 'gray.300');

  const handlePreferenceUpdate = (key: string, value: any) => {
    dispatch(updatePreferences({ [key]: value }));
  };

  const handleSecurityUpdate = (key: string, value: any) => {
    dispatch(updateSecuritySettings({ [key]: value }));
  };

  const handleLogout = () => {
    setShowLogoutDialog(false);
    // Handle logout logic
  };

  const settingSections = [
    {
      title: 'Notifications',
      items: [
        {
          title: 'Push Notifications',
          description: 'Receive push notifications',
          type: 'switch',
          value: user?.preferences.notifications.push,
          onToggle: (value: boolean) => handlePreferenceUpdate('notifications', { 
            ...user?.preferences.notifications, 
            push: value 
          }),
        },
        {
          title: 'Email Notifications',
          description: 'Receive email notifications',
          type: 'switch',
          value: user?.preferences.notifications.email,
          onToggle: (value: boolean) => handlePreferenceUpdate('notifications', { 
            ...user?.preferences.notifications, 
            email: value 
          }),
        },
        {
          title: 'SMS Notifications',
          description: 'Receive SMS notifications',
          type: 'switch',
          value: user?.preferences.notifications.sms,
          onToggle: (value: boolean) => handlePreferenceUpdate('notifications', { 
            ...user?.preferences.notifications, 
            sms: value 
          }),
        },
      ],
    },
    {
      title: 'Security',
      items: [
        {
          title: 'Biometric Login',
          description: 'Use fingerprint or face recognition',
          type: 'switch',
          value: user?.security.biometricEnabled,
          onToggle: (value: boolean) => handleSecurityUpdate('biometricEnabled', value),
        },
        {
          title: 'Two-Factor Authentication',
          description: 'Add extra security to your account',
          type: 'switch',
          value: user?.security.twoFactorEnabled,
          onToggle: (value: boolean) => handleSecurityUpdate('twoFactorEnabled', value),
        },
        {
          title: 'Auto-Lock',
          description: 'Automatically lock the app',
          type: 'switch',
          value: user?.security.autoLockEnabled,
          onToggle: (value: boolean) => handleSecurityUpdate('autoLockEnabled', value),
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          title: 'Language',
          description: 'App language',
          type: 'select',
          value: user?.preferences.language,
          options: [
            { label: 'English', value: 'en' },
            { label: 'French', value: 'fr' },
            { label: 'Spanish', value: 'es' },
          ],
          onSelect: (value: string) => handlePreferenceUpdate('language', value),
        },
        {
          title: 'Theme',
          description: 'App appearance',
          type: 'select',
          value: user?.preferences.theme,
          options: [
            { label: 'Auto', value: 'auto' },
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
          ],
          onSelect: (value: string) => handlePreferenceUpdate('theme', value),
        },
      ],
    },
  ];

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
          Settings
        </Text>
      </HStack>

      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <VStack space={6} p={4}>
          {settingSections.map((section) => (
            <Box key={section.title} bg={cardBg} borderRadius="lg" shadow={1}>
              <VStack space={0}>
                <Text fontSize="md" fontWeight="semibold" color={textColor} p={4} pb={2}>
                  {section.title}
                </Text>
                
                {section.items.map((item, index) => (
                  <VStack key={item.title}>
                    <HStack justifyContent="space-between" alignItems="center" p={4}>
                      <VStack flex={1}>
                        <Text fontSize="md" color={textColor}>
                          {item.title}
                        </Text>
                        <Text fontSize="sm" color={subtextColor}>
                          {item.description}
                        </Text>
                      </VStack>
                      
                      {item.type === 'switch' && 'onToggle' in item && (
                        <Switch
                          isChecked={item.value as boolean}
                          onToggle={item.onToggle}
                        />
                      )}
                      
                      {item.type === 'select' && 'onSelect' in item && (
                        <Select
                          selectedValue={item.value as string}
                          minWidth="120"
                          onValueChange={item.onSelect}
                          _selectedItem={{
                            bg: "primary.600",
                            endIcon: <CheckIcon size="5" />
                          }}
                        >
                          {item.options?.map((option: any) => (
                            <Select.Item
                              key={option.value}
                              label={option.label}
                              value={option.value}
                            />
                          ))}
                        </Select>
                      )}
                    </HStack>
                    
                    {index < section.items.length - 1 && <Divider ml={4} />}
                  </VStack>
                ))}
              </VStack>
            </Box>
          ))}

          {/* Additional Settings */}
          <Box bg={cardBg} borderRadius="lg" shadow={1}>
            <VStack space={0}>
              <Pressable onPress={() => navigation.navigate('AccountDetails')}>
                {({ isPressed }) => (
                  <HStack
                    justifyContent="space-between"
                    alignItems="center"
                    p={4}
                    opacity={isPressed ? 0.8 : 1}
                  >
                    <HStack alignItems="center" space={3}>
                      <Box
                        w={8}
                        h={8}
                        borderRadius="full"
                        bg="primary.100"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Ionicons name="person" size={16} color="#0066CC" />
                      </Box>
                      <VStack>
                        <Text fontSize="md" color={textColor}>
                          Account Details
                        </Text>
                        <Text fontSize="sm" color={subtextColor}>
                          Manage your account information
                        </Text>
                      </VStack>
                    </HStack>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </HStack>
                )}
              </Pressable>
              
              <Divider ml={4} />
              
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
                        w={8}
                        h={8}
                        borderRadius="full"
                        bg="orange.100"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Ionicons name="help-circle" size={16} color="#F59E0B" />
                      </Box>
                      <VStack>
                        <Text fontSize="md" color={textColor}>
                          Help & Support
                        </Text>
                        <Text fontSize="sm" color={subtextColor}>
                          Get help with your account
                        </Text>
                      </VStack>
                    </HStack>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </HStack>
                )}
              </Pressable>
            </VStack>
          </Box>

          {/* Logout */}
          <Pressable onPress={() => setShowLogoutDialog(true)}>
            {({ isPressed }) => (
              <Box
                bg="red.50"
                p={4}
                borderRadius="lg"
                opacity={isPressed ? 0.8 : 1}
              >
                <HStack alignItems="center" justifyContent="center" space={2}>
                  <Ionicons name="log-out" size={20} color="#EF4444" />
                  <Text fontSize="md" color="red.500" fontWeight="medium">
                    Sign Out
                  </Text>
                </HStack>
              </Box>
            )}
          </Pressable>
        </VStack>
      </ScrollView>

      {/* Logout Confirmation Dialog */}
      <AlertDialog isOpen={showLogoutDialog} leastDestructiveRef={cancelRef} onClose={() => setShowLogoutDialog(false)}>
        <AlertDialog.Content>
          <AlertDialog.CloseButton />
          <AlertDialog.Header>Sign Out</AlertDialog.Header>
          <AlertDialog.Body>
            Are you sure you want to sign out? You'll need to sign in again to access your account.
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button.Group space={2}>
              <Button
                variant="ghost"
                colorScheme="gray"
                onPress={() => setShowLogoutDialog(false)}
              >
                Cancel
              </Button>
              <Button colorScheme="red" onPress={handleLogout}>
                Sign Out
              </Button>
            </Button.Group>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </Box>
  );
};

export default SettingsScreen;