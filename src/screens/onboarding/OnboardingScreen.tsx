/**
 * Onboarding Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { Button } from '../../components/Button';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

const { width } = Dimensions.get('window');

const slides = [
  {
    title: 'Self-Custodial Wallet',
    description: 'You control your private keys.\nWe never store or have access to your funds.',
    icon: '🔐',
  },
  {
    title: 'Multi-Chain Support',
    description: 'Access Ethereum, Polygon and more.\nAll your assets in one place.',
    icon: '⛓️',
  },
  {
    title: 'Connect to dApps',
    description: 'Seamlessly connect to DeFi,\nNFT marketplaces, and Web3 apps.',
    icon: '🌐',
  },
];

export const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [currentPage, setCurrentPage] = useState(0);

  const handleScroll = (event: any) => {
    const page = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentPage(page);
  };

  const handleGetStarted = () => {
    navigation.navigate('WalletSetup');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {slides.map((slide, index) => (
          <View key={index} style={styles.slide}>
            <Text style={styles.icon}>{slide.icon}</Text>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.description}>{slide.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentPage === index && styles.dotActive,
            ]}
          />
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Get Started"
          onPress={handleGetStarted}
          size="large"
        />
      </View>

      <Text style={styles.disclaimer}>
        This is a self-custodial wallet.{'\n'}
        We do not store or control your funds.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  icon: {
    fontSize: 80,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#007AFF',
    width: 24,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  disclaimer: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 24,
  },
});

export default OnboardingScreen;
