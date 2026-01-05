/**
 * Web3 Wallet Entry Point
 */

// Polyfills must be imported FIRST
import 'react-native-get-random-values';

import { AppRegistry } from 'react-native';
import App from './App';

AppRegistry.registerComponent('TempWallet', () => App);
