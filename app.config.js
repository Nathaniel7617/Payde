import 'dotenv/config';

export default {
  expo: {
    name: "Payde Banking",
    slug: "payde-banking",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    userInterfaceStyle: "automatic",
    scheme: "payde",
    platforms: ["ios", "android"],
    
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#0066CC"
    },
    
    assetBundlePatterns: [
      "**/*"
    ],
    
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.payde.banking",
      buildNumber: "1.0.0",
      infoPlist: {
        NSFaceIDUsageDescription: "Payde uses Face ID for secure biometric authentication to protect your financial data.",
        NSCameraUsageDescription: "Payde needs camera access for document verification and QR code scanning.",
        NSMicrophoneUsageDescription: "Payde may use microphone for voice authentication and customer support.",
        NSLocationWhenInUseUsageDescription: "Payde uses location for fraud prevention and nearby ATM/branch finder.",
        NSContactsUsageDescription: "Payde can access contacts to make transfers easier (optional).",
        NSPhotoLibraryUsageDescription: "Payde needs photo access for document upload and profile pictures.",
        ITSAppUsesNonExemptEncryption: false,
        NSAppTransportSecurity: {
          NSExceptionDomains: {
            "api.payde.com": {
              NSExceptionRequiresForwardSecrecy: false,
              NSExceptionMinimumTLSVersion: "1.2",
              NSIncludesSubdomains: true
            }
          }
        }
      },
      associatedDomains: ["applinks:payde.com", "applinks:app.payde.com"],
      usesAppleSignIn: true
    },
    
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#0066CC"
      },
      package: "com.payde.banking",
      versionCode: 1,
      permissions: [
        "CAMERA",
        "RECORD_AUDIO",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "READ_CONTACTS",
        "WRITE_EXTERNAL_STORAGE",
        "READ_EXTERNAL_STORAGE",
        "USE_FINGERPRINT",
        "USE_BIOMETRIC",
        "VIBRATE",
        "RECEIVE_BOOT_COMPLETED",
        "WAKE_LOCK"
      ],
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "payde.com"
            },
            {
              scheme: "https", 
              host: "app.payde.com"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    
    web: {
      favicon: "./assets/images/favicon.png",
      bundler: "metro"
    },
    
    plugins: [
      [
        "expo-local-authentication",
        {
          faceIDPermission: "Allow Payde to use Face ID for secure biometric authentication to protect your financial data."
        }
      ],
      [
        "expo-camera",
        {
          cameraPermission: "Payde needs camera access for document verification, QR code scanning, and identity verification."
        }
      ],
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Payde uses location for fraud prevention, security verification, and to help you find nearby ATMs and branches."
        }
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/notification-icon.png",
          color: "#0066CC",
          sounds: [
            "./assets/sounds/transaction-success.wav",
            "./assets/sounds/transaction-failed.wav",
            "./assets/sounds/security-alert.wav"
          ]
        }
      ],
      [
        "expo-secure-store",
        {
          faceIDPermission: "Payde uses Face ID to securely access your encrypted financial data."
        }
      ],
      "expo-font",
      "expo-splash-screen"
    ],
    
    extra: {
      apiUrl: process.env.API_BASE_URL,
      graphqlEndpoint: process.env.GRAPHQL_ENDPOINT,
      encryptionKey: process.env.ENCRYPTION_KEY,
      paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY,
      flutterwavePublicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      mixpanelToken: process.env.MIXPANEL_TOKEN,
      sentryDsn: process.env.SENTRY_DSN,
      featureFlagApiKey: process.env.FEATURE_FLAG_API_KEY,
      eas: {
        projectId: "your-eas-project-id"
      }
    },
    
    updates: {
      fallbackToCacheTimeout: 0,
      url: "https://u.expo.dev/your-project-id"
    },
    
    runtimeVersion: {
      policy: "sdkVersion"
    }
  }
};