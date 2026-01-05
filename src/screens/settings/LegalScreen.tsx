/**
 * Legal Screen - Terms, Privacy, Risk Disclosure
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

type Section = 'terms' | 'privacy' | 'risk';

export const LegalScreen: React.FC = () => {
  const [activeSection, setActiveSection] = useState<Section>('terms');

  const renderTerms = () => (
    <View style={styles.content}>
      <Text style={styles.contentTitle}>Terms of Service</Text>
      <Text style={styles.lastUpdated}>Last Updated: January 2026</Text>

      <Text style={styles.paragraph}>
        <Text style={styles.bold}>1. Acceptance of Terms</Text>
        {'\n'}By using this application, you agree to these Terms of Service.
        If you do not agree, please do not use this application.
      </Text>

      <Text style={styles.paragraph}>
        <Text style={styles.bold}>2. Non-Custodial Service</Text>
        {'\n'}This is a self-custodial wallet application. We do not store,
        custody, manage, or have access to your private keys, recovery phrases,
        or digital assets. You are solely responsible for:
        {'\n'}• Safeguarding your recovery phrase
        {'\n'}• Managing your private keys
        {'\n'}• All transactions made using this application
      </Text>

      <Text style={styles.paragraph}>
        <Text style={styles.bold}>3. No Recovery</Text>
        {'\n'}If you lose your recovery phrase, we cannot recover your wallet
        or funds. There is no password reset, account recovery, or customer
        support that can restore access to your wallet.
      </Text>

      <Text style={styles.paragraph}>
        <Text style={styles.bold}>4. Third-Party Services</Text>
        {'\n'}This application connects to third-party blockchain networks,
        decentralized applications, and services. We are not responsible for
        the operation, security, or availability of these third-party services.
      </Text>

      <Text style={styles.paragraph}>
        <Text style={styles.bold}>5. Limitation of Liability</Text>
        {'\n'}To the maximum extent permitted by law, we shall not be liable
        for any direct, indirect, incidental, special, or consequential damages
        arising from the use of this application.
      </Text>
    </View>
  );

  const renderPrivacy = () => (
    <View style={styles.content}>
      <Text style={styles.contentTitle}>Privacy Policy</Text>
      <Text style={styles.lastUpdated}>Last Updated: January 2026</Text>

      <Text style={styles.paragraph}>
        <Text style={styles.bold}>1. Data We Collect</Text>
        {'\n'}We collect minimal data to provide our services:
        {'\n'}• Device information for app functionality
        {'\n'}• Crash reports and analytics (anonymized)
        {'\n'}• Public blockchain addresses (visible on public blockchains)
      </Text>

      <Text style={styles.paragraph}>
        <Text style={styles.bold}>2. Data We Do NOT Collect</Text>
        {'\n'}We never collect, store, or have access to:
        {'\n'}• Your private keys
        {'\n'}• Your recovery phrase
        {'\n'}• Your PIN or biometric data
        {'\n'}• Your personal identity information
      </Text>

      <Text style={styles.paragraph}>
        <Text style={styles.bold}>3. Local Storage</Text>
        {'\n'}Your private keys and recovery phrase are stored locally on your
        device using secure encryption. This data never leaves your device.
      </Text>

      <Text style={styles.paragraph}>
        <Text style={styles.bold}>4. Third-Party Services</Text>
        {'\n'}We use the following third-party services:
        {'\n'}• Blockchain RPC providers (Alchemy/Infura)
        {'\n'}• Price data providers (CoinGecko)
        {'\n'}These services may collect data according to their own privacy
        policies.
      </Text>

      <Text style={styles.paragraph}>
        <Text style={styles.bold}>5. Your Rights</Text>
        {'\n'}You can delete all local data by resetting the wallet in settings.
        Since we don't store your data on our servers, there is no server-side
        data to delete.
      </Text>
    </View>
  );

  const renderRisk = () => (
    <View style={styles.content}>
      <Text style={styles.contentTitle}>Risk Disclosure</Text>
      <Text style={styles.lastUpdated}>Last Updated: January 2026</Text>

      <Text style={styles.paragraph}>
        <Text style={styles.bold}>Important: Please Read Carefully</Text>
        {'\n'}Using this application and interacting with blockchain networks
        involves significant risks. By using this application, you acknowledge
        and accept these risks.
      </Text>

      <Text style={styles.paragraph}>
        <Text style={styles.bold}>1. Loss of Funds Risk</Text>
        {'\n'}• Cryptocurrency transactions are irreversible
        {'\n'}• Sending to wrong addresses results in permanent loss
        {'\n'}• Lost recovery phrases cannot be recovered
        {'\n'}• Private key theft leads to total loss of funds
      </Text>

      <Text style={styles.paragraph}>
        <Text style={styles.bold}>2. Market Risk</Text>
        {'\n'}• Cryptocurrency values are highly volatile
        {'\n'}• You may lose some or all of your investment
        {'\n'}• Past performance does not guarantee future results
      </Text>

      <Text style={styles.paragraph}>
        <Text style={styles.bold}>3. Technical Risk</Text>
        {'\n'}• Smart contract bugs may result in loss
        {'\n'}• Network congestion may delay transactions
        {'\n'}• Protocol changes may affect your assets
      </Text>

      <Text style={styles.paragraph}>
        <Text style={styles.bold}>4. Security Risk</Text>
        {'\n'}• Phishing attacks target cryptocurrency users
        {'\n'}• Malicious dApps may steal your funds
        {'\n'}• Device compromise may expose your keys
      </Text>

      <Text style={styles.paragraph}>
        <Text style={styles.bold}>5. Regulatory Risk</Text>
        {'\n'}• Laws and regulations vary by jurisdiction
        {'\n'}• Regulatory changes may affect your ability to use services
        {'\n'}• You are responsible for tax compliance
      </Text>

      <Text style={styles.paragraph}>
        <Text style={styles.bold}>6. Not Financial Advice</Text>
        {'\n'}This application does not provide financial, investment, legal,
        or tax advice. Consult qualified professionals before making decisions.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeSection === 'terms' && styles.activeTab]}
          onPress={() => setActiveSection('terms')}
        >
          <Text
            style={[
              styles.tabText,
              activeSection === 'terms' && styles.activeTabText,
            ]}
          >
            Terms
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeSection === 'privacy' && styles.activeTab]}
          onPress={() => setActiveSection('privacy')}
        >
          <Text
            style={[
              styles.tabText,
              activeSection === 'privacy' && styles.activeTabText,
            ]}
          >
            Privacy
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeSection === 'risk' && styles.activeTab]}
          onPress={() => setActiveSection('risk')}
        >
          <Text
            style={[
              styles.tabText,
              activeSection === 'risk' && styles.activeTabText,
            ]}
          >
            Risks
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {activeSection === 'terms' && renderTerms()}
        {activeSection === 'privacy' && renderPrivacy()}
        {activeSection === 'risk' && renderRisk()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  activeTabText: {
    color: '#007AFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  contentTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 24,
  },
  paragraph: {
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 22,
    marginBottom: 20,
  },
  bold: {
    fontWeight: '700',
  },
});

export default LegalScreen;
