
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, View } from 'react-native';
import { NativeBaseProvider, extendTheme } from 'native-base';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { Provider } from 'react-redux';

// Navigation
import AppNavigator from './src/navigation/AppNavigator';

// Redux Store
import { store } from './src/store/index';

// Config
import { AppConfig } from './src/config/AppConfig';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Custom theme configuration
const theme = extendTheme({
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: AppConfig.ui.theme.primary,
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    secondary: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: AppConfig.ui.theme.secondary,
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
    accent: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: AppConfig.ui.theme.accent,
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: AppConfig.ui.theme.error,
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: AppConfig.ui.theme.warning,
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    success: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: AppConfig.ui.theme.success,
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
  },
  fontConfig: {
    Inter: {
      100: {
        normal: 'Inter-Light',
      },
      200: {
        normal: 'Inter-Light',
      },
      300: {
        normal: 'Inter-Light',
      },
      400: {
        normal: 'Inter-Regular',
      },
      500: {
        normal: 'Inter-Medium',
      },
      600: {
        normal: 'Inter-SemiBold',
      },
      700: {
        normal: 'Inter-Bold',
      },
      800: {
        normal: 'Inter-Bold',
      },
      900: {
        normal: 'Inter-Bold',
      },
    },
  },
  fonts: {
    heading: 'Inter',
    body: 'Inter',
    mono: 'Inter',
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: 'lg',
        _text: {
          fontWeight: 'semibold',
        },
      },
      defaultProps: {
        colorScheme: 'primary',
      },
      variants: {
        solid: {
          _pressed: {
            opacity: 0.8,
          },
        },
        outline: {
          borderWidth: 2,
          _pressed: {
            opacity: 0.8,
          },
        },
      },
    },
    Input: {
      baseStyle: {
        borderRadius: 'lg',
        borderWidth: 2,
        borderColor: 'gray.200',
        _focus: {
          borderColor: 'primary.500',
          backgroundColor: 'white',
        },
      },
    },
    FormControl: {
      baseStyle: {
        _errorMessage: {
          fontSize: 'sm',
          color: 'error.500',
        },
      },
    },
  },
  config: {
    useSystemColorMode: true,
    initialColorMode: 'light',
  },
});

// Font loading configuration
const loadFonts = async () => {
  try {
    await Font.loadAsync({
      'Inter-Light': require('./assets/fonts/Inter-Regular.ttf'),
      'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
      'Inter-Medium': require('./assets/fonts/Inter-Medium.ttf'),
      'Inter-SemiBold': require('./assets/fonts/Inter-SemiBold.ttf'),
      'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
    });
  } catch (error) {
    console.warn('Font loading failed, using system fonts');
  }
};

const App: React.FC = () => {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts and other resources
        await loadFonts();
        
        // Artificially delay for minimum splash screen time
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn('Error loading app resources:', e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = React.useCallback(async () => {
    if (appIsReady) {
      // This tells the splash screen to hide immediately
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <NativeBaseProvider theme={theme}>
          <View onLayout={onLayoutRootView} style={{ flex: 1 }}>
            <AppNavigator />
            <StatusBar 
              style="auto" 
              backgroundColor={AppConfig.ui.theme.primary}
              translucent={Platform.OS === 'android'}
            />
          </View>
        </NativeBaseProvider>
      </SafeAreaProvider>
    </Provider>
  );
};

export default App;