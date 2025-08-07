# Payde - Global Banking Application

A comprehensive, secure, and user-friendly global banking application built with Expo framework, focusing on African markets (Nigeria, Ghana, Kenya) with plans for global expansion.

![Payde Banner](./assets/images/payde-banner.png)

## 🌟 Features

### Core Banking Features
- **International Money Transfers** with competitive exchange rates
- **Virtual Card Generation** (Mastercard and Verve options)
- **Bill Payment Services** adapted to local markets
- **Mobile Data and Airtime Purchase** capabilities
- **Real-time Balance Updates** in user's preferred currency
- **Dashboard** with customizable widgets and financial insights

### Security Features
- **Advanced Registration Process** with identity verification
- **Two-Factor Authentication (2FA)** with multiple methods
- **OTP Verification System** with session management
- **6-digit Login PIN** creation and management
- **4-digit Transaction PIN** for financial operations
- **Biometric Authentication** options (Face ID, Fingerprint)
- **Electronic Receipt Generation** for all transactions

### Regional Support
- **Initial Launch**: Nigerian Naira (NGN), Ghanaian Cedi (GHS), Kenyan Shilling (KES)
- **Global Expansion**: USD, EUR, GBP, and all major international currencies
- **Localized Payment Methods** and compliance
- **Regional Bill Payment Providers** and mobile money integrations
- **Local Regulatory Compliance** (CBN, BOG, CBK)

## 🏗️ Technical Stack

### Frontend
- **Framework**: React Native with Expo SDK 49+
- **State Management**: Redux Toolkit with RTK Query
- **Navigation**: React Navigation v6
- **UI Library**: NativeBase
- **Authentication**: Expo SecureStore + JWT
- **Biometrics**: Expo LocalAuthentication
- **Real-time Updates**: WebSocket with Socket.io

### Backend Requirements
- **Authentication Service**: JWT-based with refresh tokens
- **Transaction Service**: Real-time processing and updates
- **Receipt Service**: PDF generation with email/SMS delivery
- **Payment Gateways**: Multiple provider integrations
- **Currency Service**: Real-time exchange rate updates
- **Compliance Service**: AML/KYC verification and monitoring

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Expo CLI** (`npm install -g @expo/cli`)
- **EAS CLI** (`npm install -g eas-cli`)
- **iOS Simulator** (for iOS development)
- **Android Studio** (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/payde/payde-mobile-app.git
   cd payde-mobile-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   EXPO_PUBLIC_API_URL=https://api-dev.payde.com
   EXPO_PUBLIC_WS_URL=wss://ws-dev.payde.com
   EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn
   EXPO_PUBLIC_EAS_PROJECT_ID=your-eas-project-id
   ```

4. **Start the development server**
   ```bash
   npm start
   # or
   expo start
   ```

5. **Run on device/simulator**
   ```bash
   # iOS Simulator
   npm run ios
   
   # Android Emulator
   npm run android
   
   # Web Browser
   npm run web
   ```

## 📱 Demo Mode

The app includes a comprehensive demo mode for testing and demonstration purposes:

### Demo Features
- **Pre-populated Account**: Demo account with sample balance and transactions
- **Simulated Transactions**: All transaction types with realistic processing times
- **Sample Data**: Representative transaction history and account information
- **Full Navigation**: Access to all app features without real financial impact
- **Educational Tips**: Guided tour and feature explanations

### Enabling Demo Mode
```typescript
// In src/config/AppConfig.ts
features: {
  demoMode: true, // Set to false for production
  // ... other features
}
```

## 🔒 Security Implementation

### Authentication Flow
1. **Registration**: Email/Phone → OTP Verification → Identity Documents → Security Setup
2. **Login Options**: Password, 6-digit PIN, Biometric authentication
3. **Transaction Security**: 4-digit transaction PIN for all financial operations
4. **Session Management**: Auto-logout, session refresh, secure token storage

### Security Features
- **End-to-End Encryption**: All sensitive data encrypted at rest and in transit
- **Biometric Integration**: Face ID, Touch ID, Fingerprint authentication
- **PIN Security**: Hashed and salted PIN storage with attempt limits
- **Device Security**: Device binding and suspicious activity detection
- **Compliance**: PCI DSS, AML, KYC regulatory compliance

## 🧾 Receipt System

### Automatic Receipt Generation
Every transaction automatically generates a comprehensive receipt with:
- **Transaction Details**: Amount, reference, timestamp, status
- **Participant Information**: Sender and recipient details
- **Fee Breakdown**: Itemized fees and charges
- **Balance Information**: Before and after transaction balances
- **Company Branding**: Logo, colors, contact information

### Receipt Delivery Options
- **Email**: PDF attachment with transaction summary
- **SMS**: Receipt link and transaction confirmation
- **Push Notification**: In-app receipt notification
- **Download**: Save to device storage
- **Share**: Native sharing with other apps

### Receipt Formats
- **PDF**: Professional formatted receipt
- **HTML**: Web-friendly format
- **Image**: PNG/JPEG for easy sharing

## 🌍 Regional Compliance

### Nigeria (CBN Compliance)
- **KYC Levels**: 3-tier verification system
- **Transaction Limits**: Based on verification level
- **Required Documents**: BVN, NIN, Government ID, Address Proof
- **Reporting**: Automated suspicious activity reporting

### Ghana (BOG Compliance)
- **Ghana Card Integration**: National ID verification
- **TIN Verification**: Tax identification number validation
- **Mobile Money**: Integration with local providers
- **Currency Controls**: Forex transaction monitoring

### Kenya (CBK Compliance)
- **M-Pesa Integration**: Mobile money interoperability
- **KRA PIN**: Tax compliance verification
- **National ID**: Huduma Namba integration
- **Cross-border**: EAC region support

## 📊 Dashboard Features

### Customizable Widgets
- **Balance Card**: Real-time balance with visibility toggle
- **Quick Actions**: Fast access to common transactions
- **Recent Transactions**: Latest transaction history
- **Pending Transactions**: Awaiting processing
- **Exchange Rates**: Real-time currency conversion rates
- **Monthly Spending**: Expense tracking and insights

### Real-time Updates
- **WebSocket Connection**: Live transaction updates
- **Push Notifications**: Transaction alerts and confirmations
- **Balance Refresh**: Automatic balance synchronization
- **Status Updates**: Real-time transaction status changes

## 🔧 Development

### Project Structure
```
payde-app/
├── src/
│   ├── components/           # Reusable UI components
│   ├── screens/              # Screen components
│   ├── navigation/           # Navigation configuration
│   ├── services/            # API services and integrations
│   ├── store/               # Redux store configuration
│   ├── utils/               # Utility functions
│   ├── hooks/               # Custom React hooks
│   ├── constants/           # App constants
│   └── types/               # TypeScript definitions
├── assets/                  # Static assets
├── config/                  # Environment configurations
└── __tests__/              # Test files
```

### Key Services

#### AuthService
```typescript
// Complete authentication management
- User registration and verification
- Multi-factor authentication
- Biometric integration
- Session management
- Security settings
```

#### TransactionService
```typescript
// Comprehensive transaction processing
- Domestic and international transfers
- Bill payments and utilities
- Airtime and data purchases
- Real-time status updates
- Fee calculations
```

#### ReceiptService
```typescript
// Automatic receipt generation
- PDF creation and formatting
- Multi-channel delivery
- Template customization
- Receipt history storage
- Sharing capabilities
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix
```

## 📦 Building and Deployment

### Development Build
```bash
# Start development server
npm start

# Build for development testing
expo build:android
expo build:ios
```

### Production Build
```bash
# Configure EAS Build
eas build:configure

# Build for production
npm run build

# Build specific platforms
npm run build:android
npm run build:ios
```

### App Store Submission
```bash
# Submit to app stores
npm run submit

# iOS App Store
eas submit --platform ios

# Google Play Store
eas submit --platform android
```

## 🌐 Environment Configuration

### Development Environment
```env
EXPO_PUBLIC_API_URL=https://api-dev.payde.com
EXPO_PUBLIC_WS_URL=wss://ws-dev.payde.com
NODE_ENV=development
```

### Staging Environment
```env
EXPO_PUBLIC_API_URL=https://api-staging.payde.com
EXPO_PUBLIC_WS_URL=wss://ws-staging.payde.com
NODE_ENV=staging
```

### Production Environment
```env
EXPO_PUBLIC_API_URL=https://api.payde.com
EXPO_PUBLIC_WS_URL=wss://ws.payde.com
NODE_ENV=production
```

## 📈 Performance Optimization

### Bundle Size Optimization
- **Tree Shaking**: Remove unused code
- **Code Splitting**: Lazy load screens and components
- **Asset Optimization**: Compress images and fonts
- **Bundle Analysis**: Monitor bundle size changes

### Runtime Performance
- **Image Caching**: Efficient image loading and caching
- **List Virtualization**: Handle large transaction lists
- **Memory Management**: Prevent memory leaks
- **Network Optimization**: Request batching and caching

## 🔐 Security Best Practices

### Code Security
- **Sensitive Data**: Never store secrets in source code
- **Environment Variables**: Use secure environment configuration
- **Dependencies**: Regular security audits and updates
- **Code Signing**: Proper certificate management

### Runtime Security
- **Certificate Pinning**: Prevent man-in-the-middle attacks
- **Biometric Security**: Secure biometric template storage
- **Session Security**: Proper token management and rotation
- **Device Security**: Root/jailbreak detection

## 📚 Documentation

### API Documentation
- **Authentication Endpoints**: Complete auth flow documentation
- **Transaction Endpoints**: All transaction types and parameters
- **Account Endpoints**: User account management
- **Admin Endpoints**: Administrative functions

### User Guides
- **Getting Started**: User onboarding guide
- **Feature Guides**: Detailed feature explanations
- **Security Guide**: Security best practices for users
- **Troubleshooting**: Common issues and solutions

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Enforced code style and best practices
- **Prettier**: Consistent code formatting
- **Testing**: Comprehensive test coverage required

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

### Technical Support
- **Email**: tech-support@payde.com
- **Documentation**: https://docs.payde.com
- **GitHub Issues**: https://github.com/payde/payde-mobile-app/issues

### Business Inquiries
- **Email**: business@payde.com
- **Website**: https://payde.com
- **Phone**: +234-700-PAYDE-NOW

## 🗺️ Roadmap

### Phase 1: Foundation (Completed)
- ✅ Core authentication system
- ✅ Basic transaction processing
- ✅ Receipt generation system
- ✅ Dashboard implementation
- ✅ Security infrastructure

### Phase 2: Enhanced Features (In Progress)
- 🔄 Advanced analytics and insights
- 🔄 Savings and investment features
- 🔄 Cryptocurrency support
- 🔄 Advanced fraud detection
- 🔄 Multi-language support

### Phase 3: Global Expansion (Planned)
- 🔜 European market support
- 🔜 North American expansion
- 🔜 Asian market integration
- 🔜 Advanced compliance features
- 🔜 Enterprise solutions

## 🏆 Awards and Recognition

- **Best Fintech Innovation 2024** - African Fintech Awards
- **Mobile Banking App of the Year** - Nigeria Banking Awards
- **Security Excellence Award** - Cybersecurity Excellence Awards

---

**Built with ❤️ by the Payde Team**

*Empowering financial inclusion across Africa and beyond*#   P a y d e  
 