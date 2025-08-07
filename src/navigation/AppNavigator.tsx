
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useColorModeValue } from 'native-base';

// Types
import { AuthStackParamList, MainStackParamList, TabParamList } from './types';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen';
import SetupSecurityScreen from '../screens/auth/SetupSecurityScreen';

// Main Screens
import DashboardScreen from '../screens/DashboardScreen';
import TransactionHistoryScreen from '../screens/transaction/TransactionHistoryScreen';
import TransactionDetailsScreen from '../screens/transaction/TransactionDetailsScreen';
import MoneyTransferScreen from '../screens/transfer/MoneyTransferScreen';
import BillPaymentScreen from '../screens/bills/BillPaymentScreen';
import AirtimePurchaseScreen from '../screens/airtime/AirtimePurchaseScreen';
import VirtualCardsScreen from '../screens/cards/VirtualCardsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import AccountDetailsScreen from '../screens/account/AccountDetailsScreen';

// Screens
import IntroScreen from '../screens/IntroScreen';

// Services
import AuthService, { AuthState } from '../services/AuthService';
import { AppConfig } from '../config/AppConfig';

// Root Stack Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainStack = createStackNavigator<MainStackParamList>();

// Auth Stack Navigator
const AuthNavigator = () => (
  <AuthStack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: '#F9FAFB' }
    }}
  >
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
    <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <AuthStack.Screen name="OTPVerification" component={OTPVerificationScreen} />
    <AuthStack.Screen name="SetupSecurity" component={SetupSecurityScreen} />
  </AuthStack.Navigator>
);

// Main Tab Navigator
const TabNavigator = () => {
  const tabBarBg = useColorModeValue('white', 'gray.800');
  const activeColor = AppConfig.ui.theme.primary;
  const inactiveColor = useColorModeValue('#6B7280', '#9CA3AF');

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Transfer':
              iconName = focused ? 'send' : 'send-outline';
              break;
            case 'Bills':
              iconName = focused ? 'receipt' : 'receipt-outline';
              break;
            case 'Cards':
              iconName = focused ? 'card' : 'card-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'circle';
          }

          return (
            <Ionicons
              name={iconName as any}
              size={size}
              color={focused ? activeColor : inactiveColor}
            />
          );
        },
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor: tabBarBg,
          borderTopWidth: 1,
          borderTopColor: useColorModeValue('#E5E7EB', '#374151'),
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={DashboardScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="Transfer" 
        component={MoneyTransferScreen}
        options={{ tabBarLabel: 'Transfer' }}
      />
      <Tab.Screen 
        name="Bills" 
        component={BillPaymentScreen}
        options={{ tabBarLabel: 'Bills' }}
      />
      <Tab.Screen 
        name="Cards" 
        component={VirtualCardsScreen}
        options={{ tabBarLabel: 'Cards' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// Main Stack Navigator
const MainNavigator = () => (
  <MainStack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: '#F9FAFB' }
    }}
  >
    <MainStack.Screen name="MainTabs" component={TabNavigator} />
    <MainStack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
    <MainStack.Screen name="TransactionDetails" component={TransactionDetailsScreen} />
    <MainStack.Screen name="AirtimePurchase" component={AirtimePurchaseScreen} />
    <MainStack.Screen name="Notifications" component={NotificationsScreen} />
    <MainStack.Screen name="Settings" component={SettingsScreen} />
    <MainStack.Screen name="AccountDetails" component={AccountDetailsScreen} />
  </MainStack.Navigator>
);

// Root App Navigator
const AppNavigator = () => {
  const [authState, setAuthState] = useState<AuthState>(AuthState.UNAUTHENTICATED);
  const [isLoading, setIsLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [authService] = useState(() => new AuthService(AppConfig.api.baseURL));

  useEffect(() => {
    // Initialize auth state
    const initializeAuth = async () => {
      try {
        // Check if user is already authenticated
        const currentUser = authService.getCurrentUser();
        const currentAuthState = authService.getAuthState();
        
        setAuthState(currentAuthState);
      } catch (error) {
        console.error('Error initializing auth:', error);
        setAuthState(AuthState.UNAUTHENTICATED);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [authService]);

  // Listen for auth state changes
  useEffect(() => {
    // In a real app, you'd subscribe to auth state changes
    // For now, we'll check periodically
    const interval = setInterval(() => {
      const currentAuthState = authService.getAuthState();
      if (currentAuthState !== authState) {
        setAuthState(currentAuthState);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [authService, authState]);

  if (showIntro) {
    return (
      <IntroScreen 
        onGetStarted={() => {
          setShowIntro(false);
          // Continue with normal loading process
          setTimeout(() => setIsLoading(false), 500);
        }}
      />
    );
  }
  
  if (isLoading) {
    // Show a simple loading state after intro
    return null;
  }

  const isAuthenticated = authState === AuthState.AUTHENTICATED;
  const needsRegistration = [
    AuthState.REGISTERING,
    AuthState.VERIFYING_PHONE,
    AuthState.VERIFYING_EMAIL,
    AuthState.VERIFYING_IDENTITY,
    AuthState.SETTING_UP_SECURITY
  ].includes(authState);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#F9FAFB' }
        }}
      >
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;