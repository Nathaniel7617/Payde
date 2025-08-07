
import React, { useState } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  ScrollView,
  useColorModeValue,
  Badge,
  Pressable,
  Switch,
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';

interface NotificationsScreenProps {
  navigation: any;
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const subtextColor = useColorModeValue('gray.600', 'gray.300');

  const notifications = [
    {
      id: '1',
      type: 'success',
      title: 'Transfer Successful',
      message: 'Your transfer of ₦50,000 to John Doe has been completed successfully.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      id: '2',
      type: 'info',
      title: 'KYC Verification Required',
      message: 'Complete your KYC verification to unlock higher transaction limits.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      read: true,
    },
    {
      id: '3',
      type: 'warning',
      title: 'Unusual Activity Detected',
      message: 'We noticed a login from a new device. If this wasn\'t you, please secure your account.',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      read: true,
    },
  ];

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return { name: 'checkmark-circle', color: '#10B981' };
      case 'warning':
        return { name: 'warning', color: '#F59E0B' };
      case 'error':
        return { name: 'alert-circle', color: '#EF4444' };
      case 'info':
      default:
        return { name: 'information-circle', color: '#3B82F6' };
    }
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
          Notifications
        </Text>
      </HStack>

      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <VStack space={4} p={4}>
          {/* Settings */}
          <Box bg={cardBg} p={4} borderRadius="lg" shadow={1}>
            <HStack justifyContent="space-between" alignItems="center">
              <VStack>
                <Text fontSize="md" fontWeight="medium" color={textColor}>
                  Push Notifications
                </Text>
                <Text fontSize="sm" color={subtextColor}>
                  Receive notifications for transactions and updates
                </Text>
              </VStack>
              <Switch
                isChecked={notificationsEnabled}
                onToggle={setNotificationsEnabled}
              />
            </HStack>
          </Box>

          {/* Notifications List */}
          {notifications.length === 0 ? (
            <Box bg={cardBg} p={8} borderRadius="lg" shadow={1} alignItems="center">
              <Ionicons name="notifications-outline" size={64} color="#9CA3AF" />
              <Text fontSize="lg" fontWeight="medium" color={textColor} mt={4}>
                No Notifications
              </Text>
              <Text fontSize="sm" color={subtextColor} textAlign="center" mt={2}>
                You're all caught up! New notifications will appear here.
              </Text>
            </Box>
          ) : (
            <Box bg={cardBg} borderRadius="lg" shadow={1} overflow="hidden">
              {notifications.map((notification, index) => {
                const iconConfig = getNotificationIcon(notification.type);
                
                return (
                  <VStack key={notification.id}>
                    <Pressable>
                      {({ isPressed }) => (
                        <HStack
                          p={4}
                          space={3}
                          alignItems="flex-start"
                          opacity={isPressed ? 0.8 : 1}
                        >
                          <Box
                            w={10}
                            h={10}
                            borderRadius="full"
                            bg={`${iconConfig.color}20`}
                            alignItems="center"
                            justifyContent="center"
                            mt={0.5}
                          >
                            <Ionicons
                              name={iconConfig.name as any}
                              size={20}
                              color={iconConfig.color}
                            />
                          </Box>

                          <VStack flex={1} space={1}>
                            <HStack justifyContent="space-between" alignItems="flex-start">
                              <Text
                                fontSize="md"
                                fontWeight="medium"
                                color={textColor}
                                flex={1}
                                numberOfLines={1}
                              >
                                {notification.title}
                              </Text>
                              
                              <HStack alignItems="center" space={2} ml={2}>
                                <Text fontSize="xs" color={subtextColor}>
                                  {formatTime(notification.timestamp)}
                                </Text>
                                {!notification.read && (
                                  <Box
                                    w={2}
                                    h={2}
                                    bg="primary.500"
                                    borderRadius="full"
                                  />
                                )}
                              </HStack>
                            </HStack>

                            <Text
                              fontSize="sm"
                              color={subtextColor}
                              numberOfLines={2}
                              lineHeight="sm"
                            >
                              {notification.message}
                            </Text>
                          </VStack>
                        </HStack>
                      )}
                    </Pressable>
                    
                    {index < notifications.length - 1 && (
                      <Box ml={16} mr={4}>
                        <Box h="1px" bg="gray.200" />
                      </Box>
                    )}
                  </VStack>
                );
              })}
            </Box>
          )}
        </VStack>
      </ScrollView>
    </Box>
  );
};

export default NotificationsScreen;