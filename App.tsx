/**
 * Web3 Wallet App
 *
 * Self-custodial Web3 wallet for Ethereum and EVM-compatible chains.
 * This wallet is non-custodial - we never store or have access to your private keys.
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default App;
