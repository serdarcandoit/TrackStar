import React, { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, SectionList, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { useBudget } from '../../context/BudgetContext';
import { Transaction } from '../../types';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { Trash2 } from 'lucide-react-native';
import { Card } from '../../components/ui/Card';

export default function Transactions() {
    const { transactions, deleteTransaction } = useBudget();

    const sections = useMemo(() => {
        // 1. Sort transactions by date desc
        const sorted = [...transactions].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        // 2. Group by date
        const grouped: { [key: string]: Transaction[] } = {};
        sorted.forEach(t => {
            const dateKey = t.date.split('T')[0];
            if (!grouped[dateKey]) grouped[dateKey] = [];
            grouped[dateKey].push(t);
        });

        // 3. Convert to SectionList format
        return Object.keys(grouped).map(dateKey => {
            const date = parseISO(dateKey);
            let title = format(date, 'MMMM dd, yyyy');
            if (isToday(date)) title = 'Today';
            if (isYesterday(date)) title = 'Yesterday';

            return {
                title,
                data: grouped[dateKey]
            };
        });
    }, [transactions]);

    const router = useRouter();

    const handleEdit = (item: Transaction) => {
        router.push({
            pathname: '/add-modal',
            params: {
                id: item.id,
                amount: item.amount,
                category: item.category,
                date: item.date,
                note: item.note || '',
                type: item.type
            }
        });
    };

    const renderItem = ({ item }: { item: Transaction }) => (
        <View style={styles.itemContainer}>
            <TouchableOpacity
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                onPress={() => handleEdit(item)}
            >
                <View style={styles.itemIcon}>
                    <Text style={styles.itemIconText}>{item.category[0].toUpperCase()}</Text>
                </View>
                <View style={styles.itemContent}>
                    <Text style={styles.itemCategory}>{item.category}</Text>
                    {item.note ? <Text style={styles.itemNote} numberOfLines={1}>{item.note}</Text> : null}
                </View>
                <View style={styles.amountContainer}>
                    <Text style={[styles.itemAmount, { color: item.type === 'expense' ? Colors.text : Colors.success }]}>
                        {item.type === 'expense' ? '-' : '+'}${item.amount.toLocaleString()}
                    </Text>
                </View>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => deleteTransaction(item.id)}
                style={styles.deleteButton}
            >
                <Trash2 size={16} color={Colors.textTertiary} />
            </TouchableOpacity>
        </View>
    );

    return (
        <ScreenWrapper>
            <SectionList
                sections={sections}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                renderSectionHeader={({ section: { title } }) => (
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionHeaderText}>{title}</Text>
                    </View>
                )}
                contentContainerStyle={styles.listContent}
                stickySectionHeadersEnabled={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No transactions for this month.</Text>
                    </View>
                }
            />
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    listContent: {
        padding: Layout.spacing.md,
        paddingBottom: 100,
    },
    sectionHeader: {
        paddingVertical: Layout.spacing.sm,
        marginBottom: Layout.spacing.xs,
    },
    sectionHeaderText: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: Layout.spacing.md,
        borderRadius: Layout.borderRadius.md,
        marginBottom: Layout.spacing.sm,
        ...Layout.shadows.small,
    },
    itemIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Layout.spacing.md,
    },
    itemIconText: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.primary,
    },
    itemContent: {
        flex: 1,
    },
    itemCategory: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    itemNote: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    amountContainer: {
        alignItems: 'flex-end',
        marginRight: Layout.spacing.sm,
    },
    itemAmount: {
        fontSize: 16,
        fontWeight: '700',
    },
    deleteButton: {
        padding: 8,
    },
    emptyContainer: {
        padding: Layout.spacing.xxl,
        alignItems: 'center',
    },
    emptyText: {
        color: Colors.textTertiary,
        fontSize: 16,
    }
});
