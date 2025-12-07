import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { useBudget } from '../../context/BudgetContext';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { Card } from '../../components/ui/Card';

const { width } = Dimensions.get('window');

// Simple helper to calculate pie chart paths
const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
};

export default function Stats() {
    const { transactions } = useBudget();

    const data = useMemo(() => {
        const expenses = transactions.filter(t => t.type === 'expense');
        const total = expenses.reduce((acc, t) => acc + t.amount, 0);

        const grouped: { [key: string]: number } = {};
        expenses.forEach(t => {
            grouped[t.category] = (grouped[t.category] || 0) + t.amount;
        });

        return Object.keys(grouped)
            .sort((a, b) => grouped[b] - grouped[a])
            .map((category, index) => ({
                category,
                amount: grouped[category],
                percent: total > 0 ? grouped[category] / total : 0,
                color: Colors.charts[index % Colors.charts.length]
            }));
    }, [transactions]);

    const renderChart = () => {
        if (data.length === 0) {
            return (
                <View style={styles.chartContainer}>
                    <Text style={styles.noDataText}>No expenses this month</Text>
                </View>
            );
        }

        let cumulativePercent = 0;

        return (
            <View style={styles.chartContainer}>
                <Svg height="200" width="200" viewBox="-1 -1 2 2">
                    {data.map((slice, index) => {
                        const start = getCoordinatesForPercent(cumulativePercent);
                        cumulativePercent += slice.percent;
                        const end = getCoordinatesForPercent(cumulativePercent);

                        // If it's a full circle (one slice 100%)
                        if (slice.percent === 1) {
                            return <Circle key={index} cx="0" cy="0" r="1" fill={slice.color} />;
                        }

                        const largeArcFlag = slice.percent > 0.5 ? 1 : 0;
                        const pathData = [
                            `M ${start[0]} ${start[1]}`, // Move
                            `A 1 1 0 ${largeArcFlag} 1 ${end[0]} ${end[1]}`, // Arc
                            `L 0 0`, // Line to center
                        ].join(' ');

                        return <Path d={pathData} fill={slice.color} key={index} />;
                    })}
                </Svg>
            </View>
        );
    };

    return (
        <ScreenWrapper>
            <View style={styles.container}>
                <Text style={styles.headerTitle}>Spending Breakdown</Text>

                {renderChart()}

                <View style={styles.legendContainer}>
                    {data.map((item, index) => (
                        <Card key={index} style={styles.legendItem}>
                            <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                            <View style={styles.legendTextContainer}>
                                <Text style={styles.legendCategory}>{item.category}</Text>
                                <Text style={styles.legendPercent}>{(item.percent * 100).toFixed(1)}%</Text>
                            </View>
                            <Text style={styles.legendAmount}>${item.amount.toLocaleString()}</Text>
                        </Card>
                    ))}
                </View>
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: Layout.spacing.md,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: Layout.spacing.xl,
        alignSelf: 'flex-start'
    },
    chartContainer: {
        marginBottom: Layout.spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        height: 200,
    },
    noDataText: {
        color: Colors.textTertiary,
        fontSize: 16,
    },
    legendContainer: {
        width: '100%',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Layout.spacing.sm,
        padding: Layout.spacing.md,
    },
    legendColor: {
        width: 16,
        height: 16,
        borderRadius: 8,
        marginRight: Layout.spacing.md,
    },
    legendTextContainer: {
        flex: 1,
    },
    legendCategory: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    legendPercent: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    legendAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
});
