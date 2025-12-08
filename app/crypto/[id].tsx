import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { CryptoApi } from '../../utils/cryptoApi';
import { Storage } from '../../utils/storage';
import { ArrowLeft, TrendingUp, TrendingDown, Edit2 } from 'lucide-react-native';
import DetailedChart from '../../components/DetailedChart';
import AddCryptoModal from '../../components/AddCryptoModal';
import { CryptoAsset } from '../../types';

const TIMEFRAMES = [
    { label: '1D', value: '1' },
    { label: '1W', value: '7' },
    { label: '1M', value: '30' },
    { label: '3M', value: '90' },
    { label: '1Y', value: '365' },
];

export default function CryptoDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [asset, setAsset] = useState<CryptoAsset | null>(null);
    const [priceData, setPriceData] = useState<any>(null);
    const [chartData, setChartData] = useState<number[][]>([]);
    const [timeframe, setTimeframe] = useState('1'); // Default 1 day
    const [loading, setLoading] = useState(true);
    const [chartLoading, setChartLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    const assetId = Array.isArray(id) ? id[0] : id;

    const loadAssetDetails = useCallback(async () => {
        try {
            const portfolio = await Storage.getCryptoPortfolio();
            const foundAsset = portfolio.find(p => p.id === assetId);
            setAsset(foundAsset || null);

            // Fetch current price details
            const prices = await CryptoApi.fetchPrices([assetId]);
            if (prices.length > 0) {
                setPriceData(prices[0]);
            }
        } catch (e) {
            console.error("Failed to load asset details", e);
        }
    }, [assetId]);

    const loadChartData = useCallback(async () => {
        if (!assetId) return;
        setChartLoading(true);
        try {
            const history = await CryptoApi.fetchMarketChart(assetId, timeframe);
            setChartData(history);
        } catch (e) {
            console.error("Failed to load chart", e);
        } finally {
            setChartLoading(false);
        }
    }, [assetId, timeframe]);

    useEffect(() => {
        setLoading(true);
        Promise.all([loadAssetDetails(), loadChartData()]).finally(() => setLoading(false));
    }, [loadAssetDetails, loadChartData]);

    // Reload details when modal closes (in case of edit)
    const onModalClose = () => {
        setModalVisible(false);
        loadAssetDetails();
    };

    const handleSaveAsset = async (assetData: any, isEdit: boolean = false) => {
        // Since we are in detail view, we assume edit mode or straightforward update
        // We reuse the logic from main screen or simplify
        // Here we just overwrite for simplicity as key use case is editing THIS asset
        await Storage.saveCryptoAsset(assetData);
        onModalClose();
    };

    const handleDeleteAsset = async () => {
        await Storage.deleteCryptoAsset(assetId);
        router.back();
    };

    if (loading && !asset && !priceData) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!asset) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <ArrowLeft color={Colors.text} size={24} />
                    </TouchableOpacity>
                </View>
                <View style={styles.center}>
                    <Text style={styles.errorText}>Asset not found in portfolio.</Text>
                </View>
            </SafeAreaView>
        );
    }

    const currentPrice = priceData?.current_price || 0;
    const value = asset.amount * currentPrice;
    const profit = value - (asset.amount * asset.averageBuyPrice);
    const profitPercent = asset.averageBuyPrice > 0 ? (profit / (asset.amount * asset.averageBuyPrice)) * 100 : 0;
    const isProfit = profit >= 0;
    const themeColor = isProfit ? '#4CAF50' : '#F44336';

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft color={Colors.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{asset.name}</Text>
                <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.editButton}>
                    <Edit2 color={Colors.text} size={20} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Price Display */}
                <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Current Value</Text>
                    <Text style={styles.bigPrice}>${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                    <View style={styles.changeContainer}>
                        {isProfit ? <TrendingUp size={20} color={themeColor} /> : <TrendingDown size={20} color={themeColor} />}
                        <Text style={[styles.changeText, { color: themeColor }]}>
                            ${Math.abs(profit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({profitPercent.toFixed(2)}%)
                        </Text>
                        <Text style={styles.timeframeText}>All Time</Text>
                    </View>
                </View>

                {/* Chart */}
                <View style={styles.chartContainer}>
                    {chartLoading ? (
                        <ActivityIndicator color={themeColor} />
                    ) : (
                        <DetailedChart data={chartData} color={themeColor} />
                    )}
                </View>

                {/* Timeframes */}
                <View style={styles.timeframeContainer}>
                    {TIMEFRAMES.map((tf) => (
                        <TouchableOpacity
                            key={tf.value}
                            style={[styles.timeframeButton, timeframe === tf.value && { backgroundColor: String(themeColor) + '20' }]}
                            onPress={() => setTimeframe(tf.value)}
                        >
                            <Text style={[styles.timeframeLabel, timeframe === tf.value && { color: themeColor, fontWeight: 'bold' }]}>{tf.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Position Details */}
                <View style={styles.detailsCard}>
                    <Text style={styles.sectionTitle}>Your Position</Text>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>{asset.symbol.toUpperCase()} Balance</Text>
                        <Text style={styles.detailValue}>{asset.amount}</Text>
                    </View>
                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Avg. Buy Price</Text>
                        <Text style={styles.detailValue}>${asset.averageBuyPrice.toLocaleString()}</Text>
                    </View>
                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Portfolio Cost</Text>
                        <Text style={styles.detailValue}>${(asset.amount * asset.averageBuyPrice).toLocaleString()}</Text>
                    </View>
                </View>
            </ScrollView>

            <AddCryptoModal
                visible={modalVisible}
                onClose={onModalClose}
                onSave={handleSaveAsset}
                initialAsset={asset}
                onDelete={handleDeleteAsset}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    backButton: {
        padding: 5,
    },
    editButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    priceContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    priceLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 5,
    },
    bigPrice: {
        fontSize: 36,
        fontWeight: 'bold',
        color: Colors.text,
    },
    changeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    changeText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 5,
        marginRight: 5,
    },
    timeframeText: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    chartContainer: {
        height: 250,
        justifyContent: 'center',
    },
    timeframeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 10,
        marginBottom: 20,
    },
    timeframeButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    timeframeLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    detailsCard: {
        margin: 20,
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 20,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 15,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 10,
    },
    detailLabel: {
        fontSize: 16,
        color: Colors.textSecondary,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    divider: {
        height: 1,
        backgroundColor: '#EEEEEE',
    },
    errorText: {
        color: Colors.textSecondary,
        fontSize: 16,
    }
});
