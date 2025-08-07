import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Payde',
  slug: 'payde-banking',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  userInterfaceStyle: 'automatic',
  scheme: 'payde',
  
  splash: {
    image: './assets/images/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0066CC'
  },
  
  assetBundlePatterns: [
    '**/*'
  ],
  
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.payde.banking',
    buildNumber: '1.0.0',
    requireFullScreen: true,
    config: {
      usesNonExemptEncryption: false
    },
    infoPlist: {
      NSFaceIDUsageDescription: 'Use Face ID to authenticate securely and access your account',
      NSCameraUsageDescription: 'Camera access is needed for document verification and QR code scanning',
      NSPhotoLibraryUsageDescription: 'Photo library access is needed to upload identity documents',
      NSContactsUsageDescription: 'Contacts access helps you send money to people in your address book',
      NSLocationWhenInUseUsageDescription: 'Location access helps us verify your identity and prevent fraud',
      NSMicrophoneUsageDescription: 'Microphone access is needed for customer support calls',
      CFBundleAllowMixedLocalizations: true,
      ITSAppUsesNonExemptEncryption: false
    },
    associatedDomains: [
      'applinks:payde.com',
      'applinks:api.payde.com'
    ],
    usesAppleSignIn: true
  },
  
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#FFFFFF'
    },
    package: 'com.payde.banking',
    versionCode: 1,
    compileSdkVersion: 34,
    targetSdkVersion: 34,
    buildToolsVersion: '34.0.0',
    permissions: [
      'USE_FINGERPRINT',
      'USE_BIOMETRIC',
      'CAMERA',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'READ_CONTACTS',
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'RECORD_AUDIO',
      'VIBRATE',
      'RECEIVE_BOOT_COMPLETED',
      'SYSTEM_ALERT_WINDOW',
      'INTERNET',
      'ACCESS_NETWORK_STATE',
      'ACCESS_WIFI_STATE'
    ],
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'https',
            host: 'payde.com'
          },
          {
            scheme: 'https',
            host: 'api.payde.com'
          }
        ],
        category: ['BROWSABLE', 'DEFAULT']
      }
    ],
    googleServicesFile: './google-services.json'
  },
  
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png'
  },
  
  plugins: [
    'expo-router',
    [
      'expo-notifications',
      {
        icon: './assets/images/notification-icon.png',
        color: '#ffffff',
        defaultChannel: 'default',
        sounds: [
          './assets/sounds/notification.wav',
          './assets/sounds/success.wav'
        ]
      }
    ],
    [
      'expo-local-authentication',
      {
        faceIDPermission: 'Allow Payde to use Face ID for secure authentication'
      }
    ],
    [
      'expo-camera',
      {
        cameraPermission: 'Allow Payde to access your camera for document verification and QR code scanning'
      }
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Allow Payde to access your photo library to upload identity documents',
        cameraPermission: 'Allow Payde to use your camera to take photos of identity documents'
      }
    ],
    [
      'expo-document-picker',
      {
        iCloudContainerEnvironment: 'Production'
      }
    ],
    [
      'expo-secure-store'
    ],
    [
      'expo-font',
      {
        fonts: [
          './assets/fonts/Inter-Regular.ttf',
          './assets/fonts/Inter-Medium.ttf',
          './assets/fonts/Inter-SemiBold.ttf',
          './assets/fonts/Inter-Bold.ttf'
        ]
      }
    ],
    [
      'expo-build-properties',
      {
        android: {
          enableProguardInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
          compileSdkVersion: 34,
          targetSdkVersion: 34,
          buildToolsVersion: '34.0.0'
        },
        ios: {
          deploymentTarget: '13.0',
          useFrameworks: 'static'
        }
      }
    ]
  ],
  
  experiments: {
    typedRoutes: true
  },
  
  extra: {
    environment: process.env.NODE_ENV || 'development',
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api-dev.payde.com',
    wsUrl: process.env.EXPO_PUBLIC_WS_URL || 'wss://ws-dev.payde.com',
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    amplitudeApiKey: process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY,
    oneSignalAppId: process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID,
    googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    plaidPublicKey: process.env.EXPO_PUBLIC_PLAID_PUBLIC_KEY,
    stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    eas: {
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || 'your-eas-project-id'
    }
  },
  
  updates: {
    url: 'https://u.expo.dev/your-project-id',
    fallbackToCacheTimeout: 0,
    checkAutomatically: 'ON_LOAD',
    enabled: true
  },
  
  runtimeVersion: {
    policy: 'sdkVersion'
  },
  
  hooks: {
    postPublish: [
      {
        file: 'sentry-expo/upload-sourcemaps',
        config: {
          organization: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          authToken: process.env.SENTRY_AUTH_TOKEN
        }
      }
    ]
  }
});