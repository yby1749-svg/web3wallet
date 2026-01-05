/**
 * Backup Mnemonic Screen - 니모닉 백업
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { walletService } from '../../services/wallet/WalletService';
import { Button } from '../../components/Button';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'BackupMnemonic'>;
type RouteProps = RouteProp<RootStackParamList, 'BackupMnemonic'>;

export const BackupMnemonicScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { mnemonic } = route.params;

  const [words, setWords] = useState<string[]>([]);
  const [hasConfirmed, setHasConfirmed] = useState(false);

  useEffect(() => {
    setWords(walletService.mnemonicToWords(mnemonic));
  }, [mnemonic]);

  const handleContinue = () => {
    if (!hasConfirmed) {
      Alert.alert(
        'Have you written it down?',
        'Make sure you have safely stored your recovery phrase before continuing.',
        [
          { text: 'Go Back', style: 'cancel' },
          {
            text: 'Yes, I saved it',
            onPress: () => {
              setHasConfirmed(true);
              navigation.navigate('VerifyMnemonic', { mnemonic });
            },
          },
        ]
      );
    } else {
      navigation.navigate('VerifyMnemonic', { mnemonic });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.icon}>📝</Text>
          <Text style={styles.title}>Recovery Phrase</Text>
          <Text style={styles.subtitle}>
            Write down these 12 words in order and store them safely
          </Text>
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ Never share this phrase</Text>
          <Text style={styles.warningText}>
            Anyone with this phrase can access your funds
          </Text>
        </View>

        <View style={styles.wordsContainer}>
          {words.map((word, index) => (
            <View key={index} style={styles.wordItem}>
              <Text style={styles.wordNumber}>{index + 1}</Text>
              <Text style={styles.wordText}>{word}</Text>
            </View>
          ))}
        </View>

        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>How to store safely:</Text>
          <Text style={styles.tipsText}>
            • Write on paper, not digital{'\n'}
            • Store in multiple secure locations{'\n'}
            • Never take a screenshot{'\n'}
            • Never share with anyone
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="I've Written It Down"
          onPress={handleContinue}
          size="large"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  warningBox: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C62828',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#C62828',
  },
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  wordItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  wordNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    width: 24,
  },
  wordText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  tips: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1565C0',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 13,
    color: '#1565C0',
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
  },
});

export default BackupMnemonicScreen;
