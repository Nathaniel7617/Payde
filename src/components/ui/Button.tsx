// src/components/ui/Button.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
  Platform,
  AccessibilityInfo
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolateColor
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { useLocalization } from '../../hooks/useLocalization';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large' | 'full';
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  gradient?: boolean;
  cultural?: 'nigerian' | 'ghanaian' | 'kenyan' | 'global';
  hapticFeedback?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  loadingText?: string;
  animatePress?: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  gradient = false,
  cultural = 'global',
  hapticFeedback = true,
  accessibilityLabel,
  accessibilityHint,
  testID,
  style,
  textStyle,
  loadingText,
  animatePress = true,
  ...props
}) => {
  const theme = useTheme();
  const { t, isRTL } = useLocalization();
  
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const colorProgress = useSharedValue(0);

  // Cultural color schemes
  const culturalColors = {
    nigerian: {
      primary: ['#008751', '#FFFFFF'], // Green and white
      secondary: ['#FF6B35', '#FFE5DB'],
      accent: '#008751'
    },
    ghanaian: {
      primary: ['#DC143C', '#FFD700', '#008751'], // Red, gold, green
      secondary: ['#FFD700', '#FFF8DC'],
      accent: '#DC143C'
    },
    kenyan: {
      primary: ['#000000', '#DC143C', '#FFFFFF'], // Black, red, white
      secondary: ['#008751', '#90EE90'],
      accent: '#DC143C'
    },
    global: {
      primary: [theme.colors.primary, theme.colors.primaryLight],
      secondary: [theme.colors.secondary, theme.colors.secondaryLight],
      accent: theme.colors.accent
    }
  };

  const currentColors = culturalColors[cultural];

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.medium,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: isRTL ? 'row-reverse' : 'row',
      ...getSizeStyle(),
      ...getVariantStyle(),
    };

    return { ...baseStyle, ...(style as ViewStyle) };
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs,
          minHeight: 36,
        };
      case 'medium':
        return {
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          minHeight: 48,
        };
      case 'large':
        return {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          minHeight: 56,
        };
      case 'full':
        return {
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          minHeight: 48,
          width: '100%',
        };
      default:
        return {};
    }
  };

  const getVariantStyle = (): ViewStyle => {
    const styles: Record<string, ViewStyle> = {
      primary: {
        backgroundColor: gradient ? 'transparent' : currentColors.primary[0],
        shadowColor: currentColors.primary[0],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
      },
      secondary: {
        backgroundColor: gradient ? 'transparent' : currentColors.secondary[0],
        shadowColor: currentColors.secondary[0],
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: currentColors.primary[0],
      },
      ghost: {
        backgroundColor: 'transparent',
      },
      danger: {
        backgroundColor: theme.colors.error,
        shadowColor: theme.colors.error,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
      },
      success: {
        backgroundColor: theme.colors.success,
        shadowColor: theme.colors.success,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
      },
    };

    return styles[variant] || styles.primary;
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontFamily: theme.fonts.medium,
      fontSize: getTextSize(),
      textAlign: 'center',
      ...getTextColor(),
    };

    return { ...baseTextStyle, ...(textStyle as TextStyle) };
  };

  const getTextSize = (): number => {
    switch (size) {
      case 'small':
        return theme.fontSizes.sm;
      case 'medium':
        return theme.fontSizes.md;
      case 'large':
        return theme.fontSizes.lg;
      case 'full':
        return theme.fontSizes.md;
      default:
        return theme.fontSizes.md;
    }
  };

  const getTextColor = (): { color: string } => {
    if (disabled) {
      return { color: theme.colors.textSecondary };
    }

    switch (variant) {
      case 'primary':
      case 'danger':
      case 'success':
        return { color: theme.colors.white };
      case 'secondary':
        return { color: theme.colors.textPrimary };
      case 'outline':
      case 'ghost':
        return { color: currentColors.primary[0] };
      default:
        return { color: theme.colors.white };
    }
  };

  const handlePress = async () => {
    if (disabled || loading) return;

    // Haptic feedback
    if (hapticFeedback && Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Animation
    if (animatePress) {
      scale.value = withSpring(0.95, { duration: 100 }, () => {
        scale.value = withSpring(1, { duration: 100 });
      });
    }

    // Announce to screen readers
    if (accessibilityLabel && Platform.OS !== 'web') {
      AccessibilityInfo.announceForAccessibility(
        `${accessibilityLabel} ${t('common.pressed')}`
      );
    }

    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: disabled ? 0.6 : opacity.value,
    };
  });

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size={size === 'small' ? 'small' : 'small'}
            color={getTextColor().color}
            style={styles.loadingIndicator}
          />
          {loadingText && (
            <Text style={[getTextStyle(), styles.loadingText]}>
              {loadingText}
            </Text>
          )}
        </View>
      );
    }

    return (
      <>
        {leftIcon && (
          <View style={[styles.iconContainer, isRTL && styles.iconRight]}>
            {leftIcon}
          </View>
        )}
        <Text style={getTextStyle()} numberOfLines={1}>
          {title}
        </Text>
        {rightIcon && (
          <View style={[styles.iconContainer, isRTL && styles.iconLeft]}>
            {rightIcon}
          </View>
        )}
      </>
    );
  };

  const ButtonComponent = () => (
    <AnimatedTouchableOpacity
      style={[getButtonStyle(), animatedStyle]}
      onPress={handlePress}
      disabled={disabled || loading}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
      testID={testID}
      {...props}
    >
      {renderContent()}
    </AnimatedTouchableOpacity>
  );

  // Render with gradient if specified
  if (gradient && (variant === 'primary' || variant === 'secondary')) {
    return (
      <LinearGradient
        colors={currentColors[variant]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[getButtonStyle(), animatedStyle]}
      >
        <TouchableOpacity
          style={styles.gradientButton}
          onPress={handlePress}
          disabled={disabled || loading}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel || title}
          accessibilityHint={accessibilityHint}
          accessibilityState={{
            disabled: disabled || loading,
            busy: loading,
          }}
          testID={testID}
        >
          {renderContent()}
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return <ButtonComponent />;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIndicator: {
    marginRight: 8,
  },
  loadingText: {
    marginLeft: 8,
  },
  iconContainer: {
    marginRight: 8,
  },
  iconLeft: {
    marginRight: 0,
    marginLeft: 8,
  },
  iconRight: {
    marginLeft: 0,
    marginRight: 8,
  },
  gradientButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
});

export default Button;