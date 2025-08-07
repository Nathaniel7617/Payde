
import React from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Avatar,
  Pressable,
  useColorModeValue,
  ScrollView,
  Divider,
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../../store';

interface ProfileScreenProps {
  navigation: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user } = useAppSelector(state => state.auth);
  
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const subtextColor = useColorModeValue('gray.600', 'gray.300');

  const menuItems = [
    { title: 'Account Details', icon: 'person', onPress: () => navigation.navigate('AccountDetails') },
    { title: 'Transaction History', icon: 'time', onPress: () => navigation.navigate('TransactionHistory') },
    { title: 'Notifications', icon: 'notifications', onPress: () => navigation.navigate('Notifications') },
    { title: 'Settings', icon: 'settings', onPress: () => navigation.navigate('Settings') },
    { title: 'Help & Support', icon: 'help-circle', onPress: () => {} },
    { title: 'About', icon: 'information-circle', onPress: () => {} },
  ];

  return (
    <Box flex={1} bg={bgColor} safeArea>
      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <VStack space={6} p={4}>
          {/* Profile Header */}
          <Box bg={cardBg} p={6} borderRadius="lg" shadow={1}>
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
              
              <VStack alignItems="center" space={1}>
                <Text fontSize="xl" fontWeight="bold" color={textColor}>
                  {user?.firstName} {user?.lastName}
                </Text>
                <Text fontSize="sm" color={subtextColor}>
                  {user?.email}
                </Text>
                <Text fontSize="sm" color={subtextColor}>
                  {user?.phone}
                </Text>
              </VStack>
            </VStack>
          </Box>

          {/* Menu Items */}
          <Box bg={cardBg} borderRadius="lg" shadow={1}>
            {menuItems.map((item, index) => (
              <VStack key={item.title}>
                <Pressable onPress={item.onPress}>
                  {({ isPressed }) => (
                    <HStack
                      alignItems="center"
                      justifyContent="space-between"
                      p={4}
                      opacity={isPressed ? 0.8 : 1}
                    >
                      <HStack alignItems="center" space={3}>
                        <Box
                          w={10}
                          h={10}
                          borderRadius="full"
                          bg="primary.100"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Ionicons name={item.icon as any} size={20} color="#0066CC" />
                        </Box>
                        <Text fontSize="md" color={textColor}>
                          {item.title}
                        </Text>
                      </HStack>
                      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </HStack>
                  )}
                </Pressable>
                {index < menuItems.length - 1 && <Divider />}
              </VStack>
            ))}
          </Box>

          {/* Sign Out */}
          <Pressable>
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
    </Box>
  );
};

export default ProfileScreen;