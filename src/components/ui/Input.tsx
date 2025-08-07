// src/components/ui/Input.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  TextInputProps,
  ViewStyle,
  TextStyle
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { useLocalization } from '../../hooks/useLocalization';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  variant?: 'default' | 'filled' | 'outlined' | 'underlined';
  size?: 'small' | 'medium' | 'large';
  cultural?: 'nigerian' | 'ghanaian' | 'kenyan' | 'global';
  inputType?: 'text' | 'email' | 'phone' | 'currency' | 'pin' | 'account' | 'card';
  mask?: string;
  formatValue?: (value: string) => string;
  validateInput?: (value: string) => boolean;
  showValidation?: boolean;
  maxAmount?: number;
  currency?: string;
  countryCode?: string;
  bankCode?: string;
  required?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  variant = 'outlined',
  size = 'medium',
  cultural = 'global',
  inputType = 'text',
  mask,
  formatValue,
  validateInput,
  showValidation = false,
  maxAmount,
  currency = 'USD',
  countryCode,
  bankCode,
  required = false,
  value,
  onChangeText,
  style,
  inputStyle,
  labelStyle,
  errorStyle,
  containerStyle,
  ...props
}) => {
  const theme = useTheme();
  const { t, isRTL, formatCurrency, formatPhoneNumber } = useLocalization();
  
  const [isFocused, setIsFocused] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [internalValue, setInternalValue] = useState(value || '');
  const [showSecure, setShowSecure] = useState(false);
  
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;
  const inputRef = useRef<TextInput>(null);

  // Cultural color schemes
  const culturalColors = {
    nigerian: {
      primary: '#008751',
      accent: '#FF6B35',
      border: '#E8F5E8'
    },
    ghanaian: {
      primary: '#DC143C',
      accent: '#FFD700',
      border: '#FFF8DC'
    },
    kenyan: {
      primary: '#DC143C',
      accent: '#008751',
      border: '#F5F5F5'
    },
    global: {
      primary: theme.colors.primary,
      accent: theme.colors.accent,
      border: theme.colors.border
    }
  };

  const currentColors = culturalColors[cultural];

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused || internalValue ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, internalValue]);

  const handleFocus = () => {
    setIsFocused(true);
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (validateInput && showValidation) {
      setIsValid(validateInput(internalValue));
    }
  };

  const handleChangeText = (text: string) => {
    let formattedText = text;

    // Apply input type specific formatting
    switch (inputType) {
      case 'currency':
        formattedText = formatCurrencyInput(text);
        break;
      case 'phone':
        formattedText = formatPhoneInput(text);
        break;
      case 'pin':
        formattedText = formatPINInput(text);
        break;
      case 'account':
        formattedText = formatAccountInput(text);
        break;
      case 'card':
        formattedText = formatCardInput(text);
        break;
      default:
        if (formatValue) {
          formattedText = formatValue(text);
        }
        break;
    }

    // Apply mask if provided
    if (mask) {
      formattedText = applyMask(formattedText, mask);
    }

    setInternalValue(formattedText);
    onChangeText?.(formattedText);

    // Real-time validation
    if (validateInput && showValidation) {
      setIsValid(validateInput(formattedText));
    }
  };

  const formatCurrencyInput = (text: string): string => {
    // Remove non-numeric characters except decimal point
    const cleaned = text.replace(/[^\d.]/g, '');
    const parts = cleaned.split('.');
    
    // Ensure only one decimal point
    if (parts.length > 2) {
      return internalValue; // Return previous value if invalid
    }

    // Format the integer part with commas
    let formattedValue = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Add decimal part if exists
    if (parts.length === 2) {
      formattedValue += '.' + parts[1].slice(0, 2); // Limit to 2 decimal places
    }

    // Check maximum amount
    const numericValue = parseFloat(cleaned);
    if (maxAmount && numericValue > maxAmount) {
      return internalValue; // Return previous value if exceeds maximum
    }

    return formattedValue;
  };

  const formatPhoneInput = (text: string): string => {
    // Remove non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Apply country-specific formatting
    switch (countryCode) {
      case 'NG':
        // Nigerian format: +234 xxx xxx xxxx
        if (cleaned.length <= 11) {
          return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
        }
        break;
      case 'GH':
        // Ghanaian format: +233 xx xxx xxxx
        if (cleaned.length <= 10) {
          return cleaned.replace(/(\d{2})(\d{3})(\d{4})/, '$1 $2 $3');
        }
        break;
      case 'KE':
        // Kenyan format: +254 xxx xxx xxx
        if (cleaned.length <= 10) {
          return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
        }
        break;
      default:
        return cleaned;
    }
    
    return cleaned;
  };

  const formatPINInput = (text: string): string => {
    // Only allow numeric characters and limit length
    const cleaned = text.replace(/\D/g, '');
    const maxLength = inputType === 'pin' ? (props.maxLength || 6) : 4;
    return cleaned.slice(0, maxLength);
  };

  const formatAccountInput = (text: string): string => {
    // Remove non-numeric characters and apply bank-specific formatting
    const cleaned = text.replace(/\D/g, '');
    
    // Apply bank-specific account number formatting
    if (bankCode) {
      switch (bankCode) {
        case 'GTB':
        case 'UBA':
          return cleaned.slice(0, 10); // 10-digit accounts
        case 'ACCESS':
          return cleaned.slice(0, 10);
        default:
          return cleaned.slice(0, 10);
      }
    }
    
    return cleaned.slice(0, 10);
  };

  const formatCardInput = (text: string): string => {
    // Format card number with spaces every 4 digits
    const cleaned = text.replace(/\D/g, '');
    return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19); // 16 digits + 3 spaces
  };

  const applyMask = (text: string, maskPattern: string): string => {
    let maskedValue = '';
    let textIndex = 0;
    
    for (let i = 0; i < maskPattern.length && textIndex < text.length; i++) {
      if (maskPattern[i] === '9') {
        if (/\d/.test(text[textIndex])) {
          maskedValue += text[textIndex];
          textIndex++;
        } else {
          break;
        }
      } else if (maskPattern[i] === 'A') {
        if (/[A-Za-z]/.test(text[textIndex])) {
          maskedValue += text[textIndex];
          textIndex++;
        } else {
          break;
        }
      } else {
        maskedValue += maskPattern[i];
      }
    }
    
    return maskedValue;
  };

  const getInputProps = (): Partial<TextInputProps> => {
    const baseProps: Partial<TextInputProps> = {
      ref: inputRef,
      value: internalValue,
      onChangeText: handleChangeText,
      onFocus: handleFocus,
      onBlur: handleBlur,
      style: [getInputStyle(), inputStyle],
      placeholderTextColor: theme.colors.textSecondary,
      ...props,
    };

    // Add input type specific props
    switch (inputType) {
      case 'email':
        return {
          ...baseProps,
          keyboardType: 'email-address',
          autoCapitalize: 'none',
          autoCorrect: false,
          textContentType: 'emailAddress',
        };
      case 'phone':
        return {
          ...baseProps,
          keyboardType: 'phone-pad',
          textContentType: 'telephoneNumber',
        };
      case 'currency':
        return {
          ...baseProps,
          keyboardType: 'numeric',
        };
      case 'pin':
        return {
          ...baseProps,
          keyboardType: 'numeric',
          secureTextEntry: !showSecure,
          textContentType: 'password',
          maxLength: props.maxLength || 6,
        };
      case 'account':
        return {
          ...baseProps,
          keyboardType: 'numeric',
          maxLength: 10,
        };
      case 'card':
        return {
          ...baseProps,
          keyboardType: 'numeric',
          maxLength: 19,
        };
      default:
        return baseProps;
    }
  };

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      marginBottom: theme.spacing.sm,
    };

    switch (variant) {
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: currentColors.border,
          borderRadius: theme.borderRadius.medium,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
        };
      case 'outlined':
        return {
          ...baseStyle,
          borderWidth: 1,
          borderColor: error ? theme.colors.error : (isFocused ? currentColors.primary : currentColors.border),
          borderRadius: theme.borderRadius.medium,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
        };
      case 'underlined':
        return {
          ...baseStyle,
          borderBottomWidth: 2,
          borderBottomColor: error ? theme.colors.error : (isFocused ? currentColors.primary : currentColors.border),
          paddingVertical: theme.spacing.sm,
        };
      default:
        return baseStyle;
    }
  };

  const getInputStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontSize: getSizeStyle().fontSize,
      fontFamily: theme.fonts.regular,
      color: theme.colors.textPrimary,
      textAlign: isRTL ? 'right' : 'left',
      writingDirection: isRTL ? 'rtl' : 'ltr',
    };

    return baseStyle;
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return { fontSize: theme.fontSizes.sm, minHeight: 36 };
      case 'large':
        return { fontSize: theme.fontSizes.lg, minHeight: 56 };
      default:
        return { fontSize: theme.fontSizes.md, minHeight: 48 };
    }
  };

  const renderLabel = () => {
    if (!label) return null;

    const labelStyle: TextStyle = {
      fontSize: theme.fontSizes.sm,
      fontFamily: theme.fonts.medium,
      color: error ? theme.colors.error : (isFocused ? currentColors.primary : theme.colors.textSecondary),
      marginBottom: theme.spacing.xs,
      ...(labelStyle as TextStyle),
    };

    return (
      <Text style={labelStyle}>
        {label}
        {required && <Text style={{ color: theme.colors.error }}> *</Text>}
      </Text>
    );
  };

  const renderError = () => {
    if (!error) return null;

    return (
      <Text style={[styles.errorText, { color: theme.colors.error }, errorStyle]}>
        {error}
      </Text>
    );
  };

  const renderHelperText = () => {
    if (!helperText || error) return null;

    return (
      <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>
        {helperText}
      </Text>
    );
  };

  const renderLeftIcon = () => {
    if (!leftIcon) return null;

    return (
      <View style={[styles.iconContainer, isRTL && styles.iconRight]}>
        <Ionicons
          name={leftIcon}
          size={20}
          color={isFocused ? currentColors.primary : theme.colors.textSecondary}
        />
      </View>
    );
  };

  const renderRightIcon = () => {
    // Show eye icon for PIN inputs
    if (inputType === 'pin') {
      return (
        <TouchableOpacity
          style={[styles.iconContainer, isRTL && styles.iconLeft]}
          onPress={() => setShowSecure(!showSecure)}
        >
          <Ionicons
            name={showSecure ? 'eye-off' : 'eye'}
            size={20}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
      );
    }

    if (!rightIcon) return null;

    return (
      <TouchableOpacity
        style={[styles.iconContainer, isRTL && styles.iconLeft]}
        onPress={onRightIconPress}
      >
        <Ionicons
          name={rightIcon}
          size={20}
          color={isFocused ? currentColors.primary : theme.colors.textSecondary}
        />
      </TouchableOpacity>
    );
  };

  const renderValidationIcon = () => {
    if (!showValidation) return null;

    return (
      <View style={[styles.iconContainer, isRTL && styles.iconLeft]}>
        <Ionicons
          name={isValid ? 'checkmark-circle' : 'close-circle'}
          size={20}
          color={isValid ? theme.colors.success : theme.colors.error}
        />
      </View>
    );
  };

  const renderCurrencyPrefix = () => {
    if (inputType !== 'currency') return null;

    const currencySymbols = {
      NGN: '₦',
      GHS: '₵',
      KES: 'KSh',
      USD: '$',
      EUR: '€',
      GBP: '£',
    };

    return (
      <View style={styles.currencyPrefix}>
        <Text style={[styles.currencyText, { color: theme.colors.textSecondary }]}>
          {currencySymbols[currency as keyof typeof currencySymbols] || currency}
        </Text>
      </View>
    );
  };

  return (
    <View style={[containerStyle]}>
      {renderLabel()}
      <View style={[getContainerStyle(), style]}>
        <View style={styles.inputContainer}>
          {renderLeftIcon()}
          {renderCurrencyPrefix()}
          <TextInput {...getInputProps()} style={[getInputStyle(), { flex: 1 }]} />
          {renderValidationIcon()}
          {renderRightIcon()}
        </View>
      </View>
      {renderError()}
      {renderHelperText()}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  currencyPrefix: {
    marginRight: 8,
  },
  currencyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default Input;