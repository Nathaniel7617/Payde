
import React from 'react';
import { Pressable } from 'react-native';
import {
  Box,
  Text,
  HStack,
  VStack,
  IconButton,
  useColorModeValue,
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface NotificationBannerProps {
  notification: Notification;
  onPress: () => void;
  onDismiss?: () => void;
  showDismiss?: boolean;
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({
  notification,
  onPress,
  onDismiss,
  showDismiss = true
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const subtextColor = useColorModeValue('gray.600', 'gray.300');

  const getNotificationConfig = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bgColor: '#DCFCE7',
          borderColor: '#10B981',
          iconColor: '#10B981',
          icon: 'checkmark-circle'
        };
      case 'warning':
        return {
          bgColor: '#FEF3C7',
          borderColor: '#F59E0B',
          iconColor: '#F59E0B',
          icon: 'warning'
        };
      case 'error':
        return {
          bgColor: '#FEE2E2',
          borderColor: '#EF4444',
          iconColor: '#EF4444',
          icon: 'alert-circle'
        };
      case 'info':
      default:
        return {
          bgColor: '#DBEAFE',
          borderColor: '#3B82F6',
          iconColor: '#3B82F6',
          icon: 'information-circle'
        };
    }
  };

  const config = getNotificationConfig(notification.type);

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
      return date.toLocaleDateString();
    }
  };

  return (
    <Pressable onPress={onPress}>
      {state => (
        <Box
          bg={config.bgColor}
          borderLeftWidth={4}
          borderLeftColor={config.borderColor}
          borderRadius="lg"
          p={4}
          opacity={state.pressed ? 0.8 : 1}
          style={{ transform: [{ scale: state.pressed ? 0.98 : 1 }] }}
        >
          <HStack alignItems="flex-start" space={3}>
            <Box
              bg={config.iconColor}
              borderRadius="full"
              w={8}
              h={8}
              alignItems="center"
              justifyContent="center"
              mt={0.5}
            >
              <Ionicons
                name={config.icon as any}
                size={16}
                color="white"
              />
            </Box>

            <VStack flex={1} space={1}>
              <HStack justifyContent="space-between" alignItems="flex-start">
                <Text
                  fontSize="md"
                  fontWeight="semibold"
                  color={textColor}
                  flex={1}
                  numberOfLines={2}
                >
                  {notification.title}
                </Text>
                
                {showDismiss && onDismiss && (
                  <IconButton
                    icon={<Ionicons name="close" size={16} color="#6B7280" />}
                    onPress={onDismiss}
                    variant="ghost"
                    size="sm"
                    _pressed={{ bg: 'rgba(0,0,0,0.1)' }}
                  />
                )}
              </HStack>

              <Text
                fontSize="sm"
                color={subtextColor}
                numberOfLines={3}
                lineHeight="sm"
              >
                {notification.message}
              </Text>

              <Text
                fontSize="xs"
                color={subtextColor}
                mt={1}
              >
                {formatTime(notification.timestamp)}
              </Text>
            </VStack>
          </HStack>

          {/* Unread indicator */}
          {!notification.read && (
            <Box
              position="absolute"
              top={2}
              right={2}
              w={2}
              h={2}
              bg={config.iconColor}
              borderRadius="full"
            />
          )}
        </Box>
      )}
    </Pressable>
  );
};

export default NotificationBanner;