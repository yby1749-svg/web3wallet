/**
 * Transaction History Screen
 *
 * 지갑의 트랜잭션 히스토리를 표시합니다.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { TransactionHistory } from '../../types';
import { useWalletStore } from '../../stores/walletStore';
import { useNetworkStore } from '../../stores/networkStore';
import { transactionHistoryService } from '../../services/blockchain/TransactionHistoryService';

type FilterType = 'all' | 'sent' | 'received';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'sent', label: 'Sent' },
  { key: 'received', label: 'Received' },
];

export default function TransactionHistoryScreen() {
  const navigation = useNavigation();
  const { activeWallet } = useWalletStore();
  const { currentChain } = useNetworkStore();

  const [transactions, setTransactions] = useState<TransactionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  // Filter transactions based on selected filter
  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions;
    if (filter === 'sent') return transactions.filter((tx) => tx.txType === 'send');
    if (filter === 'received') return transactions.filter((tx) => tx.txType === 'receive');
    return transactions;
  }, [transactions, filter]);

  const fetchTransactions = useCallback(
    async (pageNum: number = 1, isRefresh: boolean = false) => {
      if (!activeWallet?.address) return;

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else if (pageNum === 1) {
          setLoading(true);
        }

        const txs = await transactionHistoryService.getAllTransactionHistory(
          activeWallet.address,
          pageNum,
          20
        );

        if (pageNum === 1) {
          setTransactions(txs);
        } else {
          setTransactions((prev) => [...prev, ...txs]);
        }

        setHasMore(txs.length >= 20);
        setPage(pageNum);
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeWallet?.address]
  );

  useEffect(() => {
    fetchTransactions(1);
  }, [fetchTransactions, currentChain.chainId]);

  const handleRefresh = () => {
    fetchTransactions(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchTransactions(page + 1);
    }
  };

  const openExplorer = (hash: string) => {
    const url = `${currentChain.explorerUrl}/tx/${hash}`;
    Linking.openURL(url);
  };

  const renderTransaction = ({ item }: { item: TransactionHistory }) => {
    const isSend = item.txType === 'send';
    const isContract = item.txType === 'contract';

    // 토큰 전송인 경우
    const isTokenTransfer = !!item.tokenSymbol;
    const displayValue = isTokenTransfer
      ? transactionHistoryService.formatValue(
          item.tokenValue || '0',
          item.tokenDecimal || 18
        )
      : transactionHistoryService.formatValue(item.value);

    const symbol = isTokenTransfer ? item.tokenSymbol : currentChain.symbol;

    return (
      <TouchableOpacity
        style={styles.txItem}
        onPress={() => openExplorer(item.hash)}
        activeOpacity={0.7}
      >
        <View style={styles.txIconContainer}>
          <View
            style={[
              styles.txIcon,
              isContract
                ? styles.txIconContract
                : isSend
                ? styles.txIconSend
                : styles.txIconReceive,
            ]}
          >
            <Text style={styles.txIconText}>
              {isContract ? '📄' : isSend ? '↑' : '↓'}
            </Text>
          </View>
        </View>

        <View style={styles.txDetails}>
          <View style={styles.txHeader}>
            <Text style={styles.txType}>
              {isContract ? 'Contract' : isSend ? 'Sent' : 'Received'}
              {isTokenTransfer && ` ${item.tokenSymbol}`}
            </Text>
            <Text
              style={[
                styles.txValue,
                item.isError && styles.txValueError,
                !isSend && !item.isError && styles.txValueReceive,
              ]}
            >
              {item.isError
                ? 'Failed'
                : `${isSend ? '-' : '+'}${displayValue} ${symbol}`}
            </Text>
          </View>

          <View style={styles.txFooter}>
            <Text style={styles.txAddress} numberOfLines={1}>
              {isSend ? `To: ${item.to.slice(0, 10)}...` : `From: ${item.from.slice(0, 10)}...`}
            </Text>
            <Text style={styles.txTime}>
              {transactionHistoryService.formatTimestamp(item.timestamp)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyTitle}>No Transactions</Text>
        <Text style={styles.emptySubtitle}>
          Your transaction history will appear here
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!hasMore || transactions.length === 0) return null;

    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  };

  // Render filter buttons
  const renderFilters = () => (
    <View style={styles.filterContainer}>
      {FILTERS.map((f) => (
        <TouchableOpacity
          key={f.key}
          style={[
            styles.filterButton,
            filter === f.key && styles.filterButtonActive,
          ]}
          onPress={() => setFilter(f.key)}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === f.key && styles.filterButtonTextActive,
            ]}
          >
            {f.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Transaction count
  const txCount = filteredTransactions.length;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Transaction History</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.subHeader}>
        <View style={styles.networkBadge}>
          <Text style={styles.networkText}>{currentChain.name}</Text>
        </View>
        <Text style={styles.txCount}>
          {txCount} {txCount === 1 ? 'transaction' : 'transactions'}
        </Text>
      </View>

      {renderFilters()}

      {loading && transactions.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => `${item.hash}-${item.timestamp}`}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#007AFF"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  placeholder: {
    width: 60,
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  networkBadge: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  networkText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  txCount: {
    fontSize: 13,
    color: '#8E8E93',
  },
  // Filter styles
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8E8E93',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
  txItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  txIconContainer: {
    marginRight: 12,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txIconSend: {
    backgroundColor: '#FFE5E5',
  },
  txIconReceive: {
    backgroundColor: '#E5FFE5',
  },
  txIconContract: {
    backgroundColor: '#E5E5FF',
  },
  txIconText: {
    fontSize: 18,
  },
  txDetails: {
    flex: 1,
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  txType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  txValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  txValueReceive: {
    color: '#34C759',
  },
  txValueError: {
    color: '#FF3B30',
  },
  txFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txAddress: {
    fontSize: 13,
    color: '#8E8E93',
    flex: 1,
    marginRight: 8,
  },
  txTime: {
    fontSize: 13,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
