/**
 * Crypto and Buffer Polyfills for React Native
 * This file MUST be imported before any other imports
 */

// Polyfill for crypto.getRandomValues (required by ethers.js)
import 'react-native-get-random-values';

// Buffer polyfill
import { Buffer } from 'buffer';
global.Buffer = Buffer;

// Process polyfill
if (typeof process === 'undefined') {
  global.process = { env: {} };
}
