import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { useBudget } from '../../context/BudgetContext';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { CategoryIcons, CategoryColors } from '../../constants/CategoryIcons';
import { useRouter } from 'expo-router';
import { Plus, Pencil } from 'lucide-react-native';
import { format } from 'date-fns';

export default function Dashboard() {
    const {
        totalSpent,
        remainingBalance,
        monthlyBudget,
        transactions
    } = useBudget();

    const router = useRouter();

    // Limit to latest 5 transactions
    const recentTransactions = transactions.slice(0, 5);

    return (
        <ScreenWrapper backgroundColor={Colors.background}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Good Morning</Text>
                        <Text style={styles.userName}>My Budget</Text>
                    </View>
                </View>

                {/* Main Balance Card (Dark) */}
                <View style={styles.mainCard}>
                    <View style={styles.cardHeader}>
                        <View>
                            <Text style={styles.balanceAmount}>${remainingBalance.toLocaleString()}</Text>
                            <Text style={styles.balanceLabel}>Remaining Balance</Text>
                        </View>
                        {/* Edit Budget Button (Restored) */}
                        <TouchableOpacity onPress={() => router.push('/edit-budget')} style={styles.editButton}>
                            <Pencil size={20} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.cardFooter}>
                        {/* Progress Bar for Budget */}
                        <View style={styles.budgetProgressContainer}>
                            <View style={[
                                styles.budgetProgressBar,
                                { width: `${Math.min((totalSpent / monthlyBudget) * 100, 100)}%` }
                            ]} />
                        </View>

                        <View style={styles.cardBottomRow}>
                            <Text style={styles.cardNumber}>**** **** **** 302</Text>

                            {/* Mastercard Circles (Restored) */}
                            <View style={styles.mastercardCircle}>
                                <View style={[styles.mcCircle, { backgroundColor: '#EB001B', left: 0 }]} />
                                <View style={[styles.mcCircle, { backgroundColor: '#F79E1B', left: 12 }]} />
                            </View>
                        </View>
                        <Text style={styles.budgetLimitText}>Budget: ${monthlyBudget.toLocaleString()}</Text>
                    </View>
                </View>

                {/* Recent Transactions */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Transaction</Text>
                    <TouchableOpacity onPress={() => router.push('/transactions')}>
                        <View style={styles.viewAllButton}>
                            <Text style={styles.viewAllText}>View All</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.transactionList}>
                    {recentTransactions.map((t) => {
                        const IconComponent = CategoryIcons[t.category] || CategoryIcons['Other'];
                        const iconColor = CategoryColors[t.category] || Colors.textSecondary;

                        return (
                            <View key={t.id} style={styles.transactionItem}>
                                <View style={[styles.itemIcon, { backgroundColor: iconColor + '20' }]}>
                                    <IconComponent size={24} color={iconColor} />
                                </View>
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemTitle}>{t.category}</Text>
                                    <Text style={styles.itemSubtitle}>{t.note || format(new Date(t.date), 'HMS a')}</Text>
                                </View>
                                <Text style={[
                                    styles.itemAmount,
                                    { color: t.type === 'expense' ? Colors.danger : Colors.success }
                                ]}>
                                    {t.type === 'expense' ? '-' : '+'}${t.amount.toLocaleString()}
                                </Text>
                            </View>
                        );
                    })}
                    {recentTransactions.length === 0 && (
                        <Text style={{ textAlign: 'center', color: Colors.textTertiary, marginTop: 20 }}>No recent transactions</Text>
                    )}
                </View>

            </ScrollView>

            {/* Floating Action Button (Centered) */}
            <View style={styles.fabContainer}>
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => router.push('/add-modal')}
                >
                    <Plus size={32} color="#FFF" />
                </TouchableOpacity>
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        padding: Layout.spacing.lg,
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Layout.spacing.xl,
        marginTop: Layout.spacing.sm,
    },
    greeting: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
    },
    notificationButton: {
        padding: 8,
        backgroundColor: '#FFF',
        borderRadius: 20,
        ...Layout.shadows.small
    },
    // Main Card
    mainCard: {
        backgroundColor: Colors.cardDark,
        borderRadius: 24,
        padding: 24,
        height: 200, // Fixed height for consistency
        justifyContent: 'space-between',
        marginBottom: Layout.spacing.xl,
        ...Layout.shadows.medium,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    balanceAmount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF',
    },
    balanceLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 4,
    },
    editButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
    },
    cardFooter: {
        gap: 16,
    },
    budgetProgressContainer: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 3,
        overflow: 'hidden',
        width: '60%', // Matches image visual
    },
    budgetProgressBar: {
        height: '100%',
        backgroundColor: '#F59E0B',
    },
    cardBottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardNumber: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        letterSpacing: 1,
    },
    mastercardCircle: {
        width: 32,
        height: 20,
        position: 'relative',
    },
    mcCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        position: 'absolute',
        opacity: 0.8,
    },
    budgetLimitText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        marginTop: -10
    },
    // Transactions
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Layout.spacing.md,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    viewAllButton: {
        backgroundColor: '#F3F4F6', // Light gray pill
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    viewAllText: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    transactionList: {
        gap: 16,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: Layout.spacing.md,
        borderRadius: 16,
        marginBottom: 12,
        ...Layout.shadows.small,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    itemIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    itemInfo: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 4,
    },
    itemSubtitle: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    itemAmount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    // FAB
    fabContainer: {
        position: 'absolute',
        bottom: 100, // Raised to clear the new taller footer (80px)
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 100, // Ensure it's above other elements
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
