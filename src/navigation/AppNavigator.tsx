/**
 * 앱 네비게이션
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamList, MainTabParamList } from '../types';

// Screens
import SplashScreen from '../screens/onboarding/SplashScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import WalletSetupScreen from '../screens/onboarding/WalletSetupScreen';
import CreateWalletScreen from '../screens/wallet/CreateWalletScreen';
import ImportWalletScreen from '../screens/wallet/ImportWalletScreen';
import BackupMnemonicScreen from '../screens/wallet/BackupMnemonicScreen';
import VerifyMnemonicScreen from '../screens/wallet/VerifyMnemonicScreen';
import SetupPinScreen from '../screens/wallet/SetupPinScreen';
import HomeScreen from '../screens/home/HomeScreen';
import SendScreen from '../screens/transfer/SendScreen';
import ReceiveScreen from '../screens/transfer/ReceiveScreen';
import ConfirmTransactionScreen from '../screens/transfer/ConfirmTransactionScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import SecurityScreen from '../screens/settings/SecurityScreen';
import LegalScreen from '../screens/settings/LegalScreen';
import UnlockScreen from '../screens/onboarding/UnlockScreen';
import TransactionHistoryScreen from '../screens/history/TransactionHistoryScreen';
import AddTokenScreen from '../screens/settings/AddTokenScreen';
import QRScannerScreen from '../screens/transfer/QRScannerScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// 메인 탭 네비게이터
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E5EA',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Wallet',
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
}

// 루트 스택 네비게이터
export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}
      >
        {/* Onboarding */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="WalletSetup" component={WalletSetupScreen} />
        <Stack.Screen name="UnlockScreen" component={UnlockScreen} />

        {/* Wallet Creation */}
        <Stack.Screen name="CreateWallet" component={CreateWalletScreen} />
        <Stack.Screen name="ImportWallet" component={ImportWalletScreen} />
        <Stack.Screen name="BackupMnemonic" component={BackupMnemonicScreen} />
        <Stack.Screen name="VerifyMnemonic" component={VerifyMnemonicScreen} />
        <Stack.Screen name="SetupPin" component={SetupPinScreen} />

        {/* Main App */}
        <Stack.Screen name="Main" component={MainTabs} />

        {/* Transfer */}
        <Stack.Screen
          name="Send"
          component={SendScreen}
          options={{ headerShown: true, title: 'Send' }}
        />
        <Stack.Screen
          name="Receive"
          component={ReceiveScreen}
          options={{ headerShown: true, title: 'Receive' }}
        />
        <Stack.Screen
          name="ConfirmTransaction"
          component={ConfirmTransactionScreen}
          options={{ headerShown: true, title: 'Confirm' }}
        />
        <Stack.Screen
          name="TransactionHistory"
          component={TransactionHistoryScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddToken"
          component={AddTokenScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="QRScanner"
          component={QRScannerScreen}
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
          }}
        />

        {/* Settings */}
        <Stack.Screen
          name="Security"
          component={SecurityScreen}
          options={{ headerShown: true, title: 'Security' }}
        />
        <Stack.Screen
          name="Legal"
          component={LegalScreen}
          options={{ headerShown: true, title: 'Legal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
