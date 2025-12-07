import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { useBudget } from '../../context/BudgetContext';
import { Card } from '../../components/ui/Card';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { ChevronLeft, ChevronRight, Plus, Pencil } from 'lucide-react-native';
import { Button } from '../../components/ui/Button';
import { Link, useRouter } from 'expo-router';
import { format, addMonths, subMonths, parseISO } from 'date-fns';

export default function Dashboard() {
    const {
        currentMonth,
        switchMonth,
        totalSpent,
        remainingBalance,
        monthlyBudget
    } = useBudget();

    const router = useRouter();

    const handlePrevMonth = () => {
        const date = parseISO(`${currentMonth}-01`);
        const newDate = subMonths(date, 1);
        switchMonth(format(newDate, 'yyyy-MM'));
    };

    const handleNextMonth = () => {
        const date = parseISO(`${currentMonth}-01`);
        const newDate = addMonths(date, 1);
        switchMonth(format(newDate, 'yyyy-MM'));
    };

    const formattedMonth = format(parseISO(`${currentMonth}-01`), 'MMMM yyyy');

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header / Date Selector */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handlePrevMonth} style={styles.arrowButton}>
                        <ChevronLeft size={24} color={Colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.monthTitle}>{formattedMonth}</Text>
                    <TouchableOpacity onPress={handleNextMonth} style={styles.arrowButton}>
                        <ChevronRight size={24} color={Colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* Main Summary Card */}
                <Card style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>Remaining Balance</Text>
                    <Text style={[
                        styles.balanceAmount,
                        { color: remainingBalance < 0 ? Colors.danger : Colors.text }
                    ]}>
                        ${remainingBalance.toLocaleString()}
                    </Text>
                    <View style={styles.progressContainer}>
                        <View style={[
                            styles.progressBar,
                            {
                                width: `${Math.min((totalSpent / monthlyBudget) * 100, 100)}%`,
                                backgroundColor: totalSpent > monthlyBudget ? Colors.danger : Colors.primary
                            }
                        ]} />
                    </View>

                    <TouchableOpacity
                        style={styles.budgetContainer}
                        onPress={() => router.push('/edit-budget')}
                    >
                        <Text style={styles.budgetInfo}>
                            Budget: ${monthlyBudget.toLocaleString()}
                        </Text>
                        <Pencil size={14} color={Colors.textSecondary} style={{ marginLeft: 6 }} />
                    </TouchableOpacity>
                </Card>

                {/* Secondary Stats */}
                <View style={styles.row}>
                    <Card style={[styles.statCard, { marginRight: Layout.spacing.sm }]}>
                        <Text style={styles.statLabel}>Total Spent</Text>
                        <Text style={styles.statAmount}>${totalSpent.toLocaleString()}</Text>
                    </Card>
                    <Card style={[styles.statCard, { marginLeft: Layout.spacing.sm }]}>
                        <Text style={styles.statLabel}>Saved</Text>
                        <Text style={[styles.statAmount, { color: Colors.success }]}>
                            ${Math.max(monthlyBudget - totalSpent, 0).toLocaleString()}
                        </Text>
                    </Card>
                </View>

                {/* Quick Actions */}
                <View style={styles.fabContainer}>
                    <Button
                        title="Add Transaction"
                        icon={<Plus size={20} color={Colors.surface} />}
                        onPress={() => router.push('/add-modal')}
                        style={styles.addButton}
                    />
                </View>

            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        padding: Layout.spacing.md,
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Layout.spacing.lg,
        paddingHorizontal: Layout.spacing.sm,
    },
    monthTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
    },
    arrowButton: {
        padding: Layout.spacing.xs,
    },
    summaryCard: {
        marginBottom: Layout.spacing.lg,
        padding: Layout.spacing.xl,
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 16,
        color: Colors.textSecondary,
        marginBottom: Layout.spacing.xs,
    },
    balanceAmount: {
        fontSize: 36,
        fontWeight: '800',
        marginBottom: Layout.spacing.lg,
    },
    progressContainer: {
        height: 8,
        backgroundColor: Colors.border,
        borderRadius: 4,
        width: '100%',
        overflow: 'hidden',
        marginBottom: Layout.spacing.sm,
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
    },
    budgetInfo: {
        color: Colors.textSecondary,
        fontSize: 14,
    },
    budgetContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
    },
    row: {
        flexDirection: 'row',
        marginBottom: Layout.spacing.lg,
    },
    statCard: {
        flex: 1,
        padding: Layout.spacing.lg,
    },
    statLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: Layout.spacing.xs,
    },
    statAmount: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
    },
    fabContainer: {
        marginTop: Layout.spacing.md,
    },
    addButton: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    }
});
