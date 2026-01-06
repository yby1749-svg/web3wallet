/**
 * Web3 Wallet App
 *
 * Self-custodial Web3 wallet for Ethereum and EVM-compatible chains.
 * This wallet is non-custodial - we never store or have access to your private keys.
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useWalletConnectStore } from './src/stores/walletConnectStore';

// WalletConnect Initializer Component
function WalletConnectInitializer(): null {
  const initialize = useWalletConnectStore((state) => state.initialize);

  useEffect(() => {
    // Initialize WalletConnect when app starts
    initialize().catch((error) => {
      console.error('Failed to initialize WalletConnect:', error);
    });
  }, [initialize]);

  return null;
}

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <WalletConnectInitializer />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default App;
