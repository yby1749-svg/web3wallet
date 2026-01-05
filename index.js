/**
 * Web3 Wallet Entry Point
 */

// Polyfills MUST be imported FIRST before any other imports
import './shim';

import { AppRegistry } from 'react-native';
import App from './App';

AppRegistry.registerComponent('TempWallet', () => App);
