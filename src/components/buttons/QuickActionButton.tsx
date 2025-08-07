
import React from 'react';
import { Pressable } from 'react-native';
import {
  Box,
  Text,
  VStack,
  useColorModeValue,
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';

interface QuickActionButtonProps {
  title: string;
  icon: string;
  color: string;
  onPress: () => void;
  flex?: number;
  disabled?: boolean;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  title,
  icon,
  color,
  onPress,
  flex = 1,
  disabled = false
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');

  return (
    <Pressable 
      onPress={onPress} 
      disabled={disabled}
      style={{ flex }}
    >
      {state => (
        <Box
          bg={cardBg}
          borderRadius="lg"
          p={4}
          alignItems="center"
          shadow={1}
          opacity={disabled ? 0.5 : state.pressed ? 0.8 : 1}
          style={{ transform: [{ scale: state.pressed ? 0.95 : 1 }] }}
        >
          <VStack alignItems="center" space={2}>
            <Box
              bg={{
                linearGradient: {
                  colors: [color, `${color}90`],
                  start: [0, 0],
                  end: [1, 1],
                }
              }}
              borderRadius="full"
              w={12}
              h={12}
              alignItems="center"
              justifyContent="center"
            >
              <Ionicons
                name={icon as any}
                size={24}
                color="white"
              />
            </Box>
            
            <Text
              fontSize="sm"
              fontWeight="medium"
              color={textColor}
              textAlign="center"
              numberOfLines={1}
            >
              {title}
            </Text>
          </VStack>
        </Box>
      )}
    </Pressable>
  );
};

export default QuickActionButton;