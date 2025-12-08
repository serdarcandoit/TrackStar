import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import Svg, { Path, Circle, G, Text as SvgText } from 'react-native-svg';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { useBudget } from '../../context/BudgetContext';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { Card } from '../../components/ui/Card';
import { Utensils, Bus, ShoppingBag, Film, FileText, Heart, Wallet, Home, ShoppingCart, Coffee, MoreHorizontal, LucideIcon } from 'lucide-react-native';

const { width } = Dimensions.get('window');

// Category Icon Mapping
const CATEGORY_ICONS: Record<string, LucideIcon> = {
    "Food": Utensils,
    "Transport": Bus,
    "Shopping": ShoppingBag,
    "Entertainment": Film,
    "Bills": FileText,
    "Health": Heart,
    "Salary": Wallet,
    "Rent": Home,
    "Groceries": ShoppingCart,
    "Dining Out": Coffee,
    "Other": MoreHorizontal
};

// Simple helper to calculate pie chart paths
const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
};

export default function Stats() {
    const { transactions } = useBudget();

    const stats = useMemo(() => {
        const expenses = transactions.filter(t => t.type === 'expense');
        const total = expenses.reduce((acc, t) => acc + t.amount, 0);

        const grouped: { [key: string]: number } = {};
        expenses.forEach(t => {
            grouped[t.category] = (grouped[t.category] || 0) + t.amount;
        });

        const data = Object.keys(grouped)
            .sort((a, b) => grouped[b] - grouped[a])
            .map((category, index) => ({
                category,
                amount: grouped[category],
                percent: total > 0 ? grouped[category] / total : 0,
                color: Colors.charts[index % Colors.charts.length],
                icon: CATEGORY_ICONS[category] || MoreHorizontal
            }));

        return { data, total };
    }, [transactions]);

    const renderDonutChart = () => {
        if (stats.data.length === 0) {
            return (
                <View style={styles.chartContainer}>
                    <Text style={styles.noDataText}>No expenses yet</Text>
                </View>
            );
        }

        let cumulativePercent = 0;
        const radius = 80;
        const strokeWidth = 20; // Donut thickness

        // We use a simplified SVG approach for key segments
        // Note: For a true donut with many small slices, existing paths logic works fine,
        // we just need to "mask" the center or use stroke-dasharray (advanced).
        // BUT simpler: keeping the PIE logic but overlaying a white circle in the center.

        return (
            <View style={styles.chartContainer}>
                <Svg height="200" width="200" viewBox="-1.2 -1.2 2.4 2.4">
                    <G rotation="-90">
                        {stats.data.map((slice, index) => {
                            const start = getCoordinatesForPercent(cumulativePercent);
                            cumulativePercent += slice.percent;
                            const end = getCoordinatesForPercent(cumulativePercent);

                            // Full circle check
                            if (slice.percent >= 1) {
                                return (
                                    <Circle
                                        key={index}
                                        cx="0" cy="0"
                                        r="0.8" // Outer radius scaled (1.0 goes to edge)
                                        fill="none"
                                        stroke={slice.color}
                                        strokeWidth="0.3"
                                    />
                                );
                            }

                            const largeArcFlag = slice.percent > 0.5 ? 1 : 0;

                            // Annulus Sector (Donut Slice) logic is complex in pure Path d commands without d3-shape.
                            // Easier Hack: Draw Pie Slices, then draw a white circle on top.
                            const pathData = [
                                `M 0 0`,
                                `L ${start[0]} ${start[1]}`,
                                `A 1 1 0 ${largeArcFlag} 1 ${end[0]} ${end[1]}`,
                                `Z`
                            ].join(' ');

                            return <Path d={pathData} fill={slice.color} key={index} />;
                        })}
                    </G>
                    {/* The Donut Hole */}
                    <Circle cx="0" cy="0" r="0.65" fill={Colors.surface} />
                </Svg>

                {/* Center Label */}
                <View style={styles.centerLabel}>
                    <Text style={styles.centerLabelText}>Total</Text>
                    <Text style={styles.centerLabelAmount}>${stats.total.toLocaleString()}</Text>
                </View>
            </View>
        );
    };

    return (
        <ScreenWrapper backgroundColor={Colors.background}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.headerTitle}>Spending Breakdown</Text>

                {renderDonutChart()}

                <View style={styles.legendContainer}>
                    {stats.data.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <Card key={index} style={styles.legendItem}>
                                <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                                    <Icon size={20} color={item.color} />
                                </View>

                                <View style={styles.legendTextContainer}>
                                    <Text style={styles.legendCategory}>{item.category}</Text>
                                    <View style={styles.progressBarBg}>
                                        <View style={[styles.progressBarFill, { width: `${item.percent * 100}%`, backgroundColor: item.color }]} />
                                    </View>
                                </View>

                                <View style={styles.amountContainer}>
                                    <Text style={styles.legendAmount}>${item.amount.toLocaleString()}</Text>
                                    <Text style={styles.legendPercent}>{(item.percent * 100).toFixed(1)}%</Text>
                                </View>
                            </Card>
                        );
                    })}
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: Layout.spacing.lg,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: Layout.spacing.xl,
        alignSelf: 'flex-start',
        letterSpacing: -0.5,
    },
    chartContainer: {
        marginBottom: Layout.spacing.xl * 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        height: 240,
        width: 240,
        position: 'relative' // For absolute positioning of center text
    },
    centerLabel: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerLabelText: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    centerLabelAmount: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.text,
        marginTop: 2,
    },
    noDataText: {
        color: Colors.textTertiary,
        fontSize: 16,
        textAlign: 'center'
    },
    legendContainer: {
        width: '100%',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Layout.spacing.md,
        padding: Layout.spacing.md,
        borderRadius: 16, // Softer cards
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 0, // Clean look
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Layout.spacing.md,
    },
    legendTextContainer: {
        flex: 1,
        marginRight: Layout.spacing.md,
    },
    legendCategory: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 6,
    },
    progressBarBg: {
        height: 4,
        backgroundColor: Colors.border,
        borderRadius: 2,
        width: '100%',
        overflow: 'hidden'
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 2
    },
    amountContainer: {
        alignItems: 'flex-end',
    },
    legendAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 2
    },
    legendPercent: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: '500'
    },
});
