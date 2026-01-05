# Web3 Wallet

A self-custodial Web3 wallet for Ethereum and EVM-compatible chains.

## Features

- **Non-Custodial**: Your keys, your crypto. We never store or have access to your private keys.
- **Multi-Chain**: Support for Ethereum, Polygon, and other EVM chains.
- **Secure**: Encrypted key storage using device Secure Enclave/Keychain.
- **dApp Ready**: WalletConnect integration for connecting to Web3 applications.

## Security

This wallet is designed with security as the top priority:

- Private keys are stored locally on device only
- Keys are encrypted using AES-256
- Biometric authentication (Face ID / Touch ID)
- PIN protection
- No server-side key storage

**Important**: We cannot recover your wallet if you lose your recovery phrase.

## Tech Stack

- React Native
- TypeScript
- ethers.js v6
- Zustand (State Management)
- React Navigation v6
- react-native-keychain

## Getting Started

### Prerequisites

- Node.js >= 18
- React Native development environment
- Xcode (for iOS)
- Android Studio (for Android)

### Installation

```bash
# Clone the repository
git clone https://github.com/yby1749-svg/web3wallet.git
cd web3wallet

# Install dependencies
npm install

# Install iOS pods
cd ios && pod install && cd ..

# Run on iOS
npm run ios

# Run on Android
npm run android
```

### Configuration

1. Get an Alchemy API key from [alchemy.com](https://www.alchemy.com)
2. Update `src/constants/chains.ts` with your API key

## Project Structure

```
src/
├── components/     # Reusable UI components
├── screens/        # Screen components
├── services/       # Business logic services
├── stores/         # Zustand state stores
├── constants/      # Constants and configurations
├── utils/          # Utility functions
├── navigation/     # Navigation configuration
└── types/          # TypeScript type definitions
```

## Legal

This is a self-custodial wallet. We do not store, manage, or control your funds.

## License

MIT
