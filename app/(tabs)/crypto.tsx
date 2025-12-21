import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { Plus, TrendingUp, TrendingDown, Trash2 } from 'lucide-react-native';
import { Storage } from '../../utils/storage';
import { CryptoAsset } from '../../types';
import { CryptoApi, CoinPrice } from '../../utils/cryptoApi';
import AddCryptoModal from '../../components/AddCryptoModal';
import Sparkline from '../../components/Sparkline';
import { useFocusEffect, useRouter } from 'expo-router';

export default function CryptoScreen() {
    const router = useRouter();
    const [portfolio, setPortfolio] = useState<CryptoAsset[]>([]);
    const [prices, setPrices] = useState<Map<string, CoinPrice>>(new Map());
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<CryptoAsset | undefined>(undefined);

    const loadData = async () => {
        try {
            const assets = await Storage.getCryptoPortfolio();
            setPortfolio(assets);

            if (assets.length > 0) {
                const ids = assets.map(a => a.id);
                // Remove duplicates
                const uniqueIds = [...new Set(ids)];
                const priceData = await CryptoApi.fetchPrices(uniqueIds);

                const priceMap = new Map();
                priceData.forEach(p => priceMap.set(p.id, p));
                setPrices(priceMap);
            }
        } catch (e) {
            console.error('Failed to load crypto data', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const handleSaveAsset = async (assetData: any, isEdit: boolean = false) => {
        let newAsset: CryptoAsset;

        if (isEdit) {
            // Direct update
            newAsset = assetData;
        } else {
            // Add/Merge logic
            const existingAsset = portfolio.find(p => p.id === assetData.id);
            newAsset = {
                ...assetData,
                amount: existingAsset ? existingAsset.amount + assetData.amount : assetData.amount,
                averageBuyPrice: existingAsset
                    ? ((existingAsset.averageBuyPrice * existingAsset.amount) + (assetData.averageBuyPrice * assetData.amount)) / (existingAsset.amount + assetData.amount)
                    : assetData.averageBuyPrice
            };
        }

        await Storage.saveCryptoAsset(newAsset);
        loadData();
    };

    const openAddModal = () => {
        setSelectedAsset(undefined);
        setModalVisible(true);
    };

    const openEditModal = (asset: CryptoAsset) => {
        setSelectedAsset(asset);
        setModalVisible(true);
    };

    const handleDeleteAsset = (id: string) => {
        Alert.alert(
            "Delete Asset",
            "Are you sure you want to remove this asset from your portfolio?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await Storage.deleteCryptoAsset(id);
                        loadData();
                    }
                }
            ]
        );
    };

    // Calculations
    const totalValue = portfolio.reduce((sum, asset) => {
        const price = prices.get(asset.id)?.current_price || 0;
        return sum + (asset.amount * price);
    }, 0);

    const totalCost = portfolio.reduce((sum, asset) => {
        return sum + (asset.amount * asset.averageBuyPrice);
    }, 0);

    const totalPL = totalValue - totalCost;
    const totalPLPercentage = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;

    const renderItem = ({ item }: { item: CryptoAsset }) => {
        const currentPriceData = prices.get(item.id);
        const currentPrice = currentPriceData?.current_price || 0;
        const value = item.amount * currentPrice;
        const profit = value - (item.amount * item.averageBuyPrice);
        const profitPercent = (profit / (item.amount * item.averageBuyPrice)) * 100;

        return (
            <TouchableOpacity
                style={styles.assetCard}
                onPress={() => router.push({ pathname: '/crypto/[id]', params: { id: item.id } })}
                onLongPress={() => handleDeleteAsset(item.id)}
            >
                <View style={styles.assetHeader}>
                    <View style={styles.coinInfo}>
                        {currentPriceData?.image && (
                            <Image source={{ uri: currentPriceData.image }} style={styles.coinIcon} />
                        )}
                        <View>
                            <Text style={styles.coinSymbol}>{item.symbol.toUpperCase()}</Text>
                            <Text style={styles.coinName}>{item.amount} {item.symbol.toUpperCase()}</Text>
                        </View>
                    </View>
                    <View style={styles.priceInfo}>
                        <Text style={styles.assetValue}>${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 2 }}>
                            {profit >= 0 ? <TrendingUp size={14} color="#4CAF50" style={{ marginRight: 2 }} /> : <TrendingDown size={14} color="#F44336" style={{ marginRight: 2 }} />}
                            <Text style={{ color: profit >= 0 ? '#4CAF50' : '#F44336', fontSize: 13, fontWeight: '600' }}>
                                {profitPercent.toFixed(2)}%
                            </Text>
                        </View>
                        <Text style={{ color: profit >= 0 ? '#4CAF50' : '#F44336', fontSize: 12, marginTop: 1 }}>
                            {profit >= 0 ? '+' : '-'}${Math.abs(profit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Crypto Portfolio</Text>
            </View>

            <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Total Balance</Text>
                <Text style={styles.summaryValue}>
                    ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>

                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Profit/Loss</Text>
                    <View style={{ alignItems: 'flex-end' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {totalPL >= 0 ? <TrendingUp size={20} color="#4CAF50" style={{ marginRight: 4 }} /> : <TrendingDown size={20} color="#F44336" style={{ marginRight: 4 }} />}
                            <Text style={[styles.summaryPL, { color: totalPL >= 0 ? '#4CAF50' : '#F44336' }]}>
                                ${Math.abs(totalPL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                        </View>
                        <Text style={{ color: totalPL >= 0 ? '#4CAF50' : '#F44336', fontSize: 14, marginTop: 4, fontWeight: '500' }}>
                            ({totalPLPercentage.toFixed(2)}%)
                        </Text>
                    </View>
                </View>
            </View>

            <FlatList
                data={portfolio}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No assets yet. Tap + to add.</Text>
                    </View>
                }
            />

            <AddCryptoModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSave={handleSaveAsset}
                onDelete={selectedAsset ? () => handleDeleteAsset(selectedAsset.id) : undefined}
                initialAsset={selectedAsset}
            />

            {/* Floating Action Button */}
            <View style={styles.fabContainer}>
                <TouchableOpacity
                    style={styles.fab}
                    onPress={openAddModal}
                >
                    <Plus size={32} color="#FFF" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.text,
    },
    addButton: {
        backgroundColor: Colors.primary,
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryCard: {
        margin: 20,
        marginTop: 5,
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    summaryLabel: {
        color: Colors.textSecondary,
        fontSize: 14,
        marginBottom: 5,
    },
    summaryValue: {
        color: Colors.text,
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
        paddingTop: 15,
    },
    summaryPL: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 5,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    assetCard: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    assetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    coinInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    coinIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 10,
    },
    coinSymbol: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
    },
    coinName: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    priceInfo: {
        alignItems: 'flex-end',
    },
    assetValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
    },
    coinPrice: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 12,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statLabel: {
        fontSize: 12,
        color: Colors.textTertiary,
        marginBottom: 2,
    },
    statValue: {
        fontSize: 14,
        color: Colors.text,
        fontWeight: '500',
    },
    plContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    plValue: {
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 4,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyText: {
        color: Colors.textSecondary,
        fontSize: 16,
    },
    fabContainer: {
        position: 'absolute',
        bottom: 100, // Raised to clear the footer
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 100,
    },
    fab: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.iconBgPurple,
        justifyContent: 'center',
        alignItems: 'center',
        ...Layout.shadows.medium,
        shadowColor: Colors.iconBgPurple,
        shadowOpacity: 0.4,
    }
});
