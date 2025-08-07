
import React from 'react';
import { Pressable } from 'react-native';
import {
  Box,
  Text,
  HStack,
  Badge,
  useColorModeValue,
  Tooltip,
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { KYCLevel } from '../../services/AuthService';

interface SecurityIndicatorProps {
  level: KYCLevel;
  onPress?: () => void;
  showTooltip?: boolean;
}

const SecurityIndicator: React.FC<SecurityIndicatorProps> = ({
  level,
  onPress,
  showTooltip = true
}) => {
  const textColor = useColorModeValue('gray.800', 'white');

  const getSecurityLevel = (kycLevel: KYCLevel) => {
    switch (kycLevel) {
      case KYCLevel.LEVEL_0:
        return {
          label: 'Basic',
          color: 'red',
          icon: 'shield-outline',
          description: 'Complete verification to increase your limits'
        };
      case KYCLevel.LEVEL_1:
        return {
          label: 'Verified',
          color: 'orange',
          icon: 'shield-half',
          description: 'Upload documents to unlock all features'
        };
      case KYCLevel.LEVEL_2:
        return {
          label: 'Enhanced',
          color: 'blue',
          icon: 'shield',
          description: 'Complete enhanced verification for maximum limits'
        };
      case KYCLevel.LEVEL_3:
        return {
          label: 'Premium',
          color: 'green',
          icon: 'shield-checkmark',
          description: 'Full verification complete - enjoy unlimited access'
        };
      default:
        return {
          label: 'Unverified',
          color: 'gray',
          icon: 'shield-outline',
          description: 'Start verification process'
        };
    }
  };

  const securityInfo = getSecurityLevel(level);

  const SecurityBadge = () => (
    <HStack alignItems="center" space={1}>
      <Ionicons
        name={securityInfo.icon as any}
        size={16}
        color={
          securityInfo.color === 'red' ? '#EF4444' :
          securityInfo.color === 'orange' ? '#F59E0B' :
          securityInfo.color === 'blue' ? '#3B82F6' :
          securityInfo.color === 'green' ? '#10B981' : '#6B7280'
        }
      />
      <Badge
        colorScheme={securityInfo.color}
        variant="subtle"
        borderRadius="full"
        _text={{ fontSize: 'xs', fontWeight: 'medium' }}
      >
        {securityInfo.label}
      </Badge>
    </HStack>
  );

  if (showTooltip) {
    return (
      <Pressable onPress={onPress}>
        <Tooltip label={securityInfo.description} placement="bottom">
          <SecurityBadge />
        </Tooltip>
      </Pressable>
    );
  }

  return onPress ? (
    <Pressable onPress={onPress}>
      <SecurityBadge />
    </Pressable>
  ) : (
    <SecurityBadge />
  );
};

export default SecurityIndicator;