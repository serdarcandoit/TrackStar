import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, G, Text as SvgText } from 'react-native-svg';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { useBudget } from '../../context/BudgetContext';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { Card } from '../../components/ui/Card';
import { LineChart } from 'react-native-wagmi-charts';
import * as Haptics from 'expo-haptics';
import { format, getDaysInMonth, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, startOfYear, endOfYear, eachMonthOfInterval, getDay, getHours } from 'date-fns';
import { PieChart, Activity } from 'lucide-react-native';
import { Transaction } from '../../types';

const { width } = Dimensions.get('window');

// Simple helper to calculate pie chart paths
const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
};

type ChartType = 'distribution' | 'trend';
type TimeRange = 'Day' | 'Week' | 'Month' | 'Year';

export default function Stats() {
    const { transactions: currentMonthTransactions, getCategoryColor, getCategoryIcon, currentMonth, getTransactionsForYear } = useBudget();
    const [chartType, setChartType] = useState<ChartType>('distribution');
    const [timeRange, setTimeRange] = useState<TimeRange>('Month');
    const [yearTransactions, setYearTransactions] = useState<Transaction[]>([]);
    const [isLoadingYear, setIsLoadingYear] = useState(false);

    // Fetch year data when needed
    useEffect(() => {
        if (timeRange === 'Year') {
            const fetchYear = async () => {
                setIsLoadingYear(true);
                const year = currentMonth.split('-')[0];
                const data = await getTransactionsForYear(year);
                setYearTransactions(data);
                setIsLoadingYear(false);
            };
            fetchYear();
        }
    }, [timeRange, currentMonth]);

    // Determine which transactions to use based on range
    const activeTransactions = useMemo(() => {
        if (timeRange === 'Year') return yearTransactions;
        return currentMonthTransactions;
    }, [timeRange, yearTransactions, currentMonthTransactions]);

    const stats = useMemo(() => {
        // FILTERING LOGIC
        let filteredExpenses: Transaction[] = [];
        const today = new Date(); // In a real app, this might depend on selected "Day", defaulting to Today for demo

        let labelStart = '';
        let labelEnd = '';

        // Data for Chart: { timestamp: number, value: number }
        let lineData: { timestamp: number, value: number }[] = [];

        if (timeRange === 'Day') {
            // 1. Hourly Aggregation for Today (or last day with data?)
            // Let's use "Today" if in current month, otherwise 1st of selected month?
            // Simpler: Just filter transactions in `activeTransactions` that match "today"'s day of month
            // But context `currentMonth` might be different. 
            // Let's assume "Day" means "First day of current view" or "Today" if matches.
            // For better UX, "Day" usually involves a date picker. 
            // To keep it simple: "Day" view = Today's Hourly Breakdown.

            // Check if currentMonth is strictly this month.
            const isCurrentMonth = currentMonth === format(new Date(), 'yyyy-MM');
            const targetDay = isCurrentMonth ? new Date() : new Date(Number(currentMonth.split('-')[0]), Number(currentMonth.split('-')[1]) - 1, 1);

            filteredExpenses = activeTransactions.filter(t =>
                t.type === 'expense' && isSameDay(new Date(t.date), targetDay)
            );

            // Init 0-23 hours
            const hoursMap: Record<number, number> = {};
            for (let i = 0; i < 24; i++) hoursMap[i] = 0;

            filteredExpenses.forEach(t => {
                const h = getHours(new Date(t.date));
                hoursMap[h] += t.amount;
            });

            lineData = Object.entries(hoursMap).map(([h, val]) => {
                // Create a fake timestamp for chart continuity
                const d = new Date(targetDay);
                d.setHours(Number(h), 0, 0, 0);
                return { timestamp: d.getTime(), value: val };
            });

            labelStart = '00:00';
            labelEnd = '23:59';

        } else if (timeRange === 'Week') {
            // Last 7 days? Or Current Week (Sun-Sat)?
            // Visuals usually implied "Current Week"
            const [y, m] = currentMonth.split('-').map(Number);
            // If current month is selected, show "This Week", else "First Week"?
            // Let's stick to "Days in this month" but aggregated by... actually Week view usually means Mon-Sun.
            // Let's use: The week containing "Today" if current month, else first week.
            const isCurrentMonth = currentMonth === format(new Date(), 'yyyy-MM');
            const targetDate = isCurrentMonth ? new Date() : new Date(y, m - 1, 1);

            const start = startOfWeek(targetDate, { weekStartsOn: 1 }); // Monday
            const end = endOfWeek(targetDate, { weekStartsOn: 1 });

            const daysInterval = eachDayOfInterval({ start, end });

            // Init map
            const dayMap: Record<string, number> = {};
            daysInterval.forEach(d => {
                dayMap[format(d, 'yyyy-MM-dd')] = 0;
            });

            filteredExpenses = activeTransactions.filter(t => t.type === 'expense');
            filteredExpenses.forEach(t => {
                const dkey = t.date.slice(0, 10);
                if (dayMap[dkey] !== undefined) {
                    dayMap[dkey] += t.amount;
                }
            });

            lineData = Object.keys(dayMap).map(d => ({
                timestamp: new Date(d).getTime(),
                value: dayMap[d]
            }));

            labelStart = format(start, 'dd MMM');
            labelEnd = format(end, 'dd MMM');

        } else if (timeRange === 'Month') {
            // Existing Logic
            const [y, m] = currentMonth.split('-').map(Number);
            const daysInMon = getDaysInMonth(new Date(y, m - 1));

            const dayMap: Record<string, number> = {};
            for (let i = 1; i <= daysInMon; i++) {
                dayMap[format(new Date(y, m - 1, i), 'yyyy-MM-dd')] = 0;
            }

            filteredExpenses = activeTransactions.filter(t => t.type === 'expense');
            filteredExpenses.forEach(t => {
                const dkey = t.date.slice(0, 10);
                if (dayMap[dkey] !== undefined) {
                    dayMap[dkey] += t.amount;
                }
            });

            lineData = Object.keys(dayMap).map(d => ({
                timestamp: new Date(d).getTime(),
                value: dayMap[d]
            }));

            labelStart = '1st';
            labelEnd = `${daysInMon}th`;

        } else if (timeRange === 'Year') {
            // 12 Months
            const y = Number(currentMonth.split('-')[0]);
            const start = startOfYear(new Date(y, 0, 1));
            const end = endOfYear(new Date(y, 0, 1));
            const months = eachMonthOfInterval({ start, end });

            const monthMap: Record<string, number> = {};
            months.forEach(m => {
                monthMap[format(m, 'yyyy-MM')] = 0;
            });

            filteredExpenses = activeTransactions.filter(t => t.type === 'expense');
            filteredExpenses.forEach(t => {
                const mkey = t.date.slice(0, 7);
                if (monthMap[mkey] !== undefined) {
                    monthMap[mkey] += t.amount;
                }
            });

            lineData = Object.keys(monthMap).map(m => ({
                timestamp: new Date(m + '-01').getTime(), // 1st of month for timestamp
                value: monthMap[m]
            }));

            labelStart = 'Jan';
            labelEnd = 'Dec';
        }

        // STRICT SORTING
        lineData.sort((a, b) => a.timestamp - b.timestamp);

        // PIE DATA (Always aggregation of filtered expenses)
        const total = filteredExpenses.reduce((acc, t) => acc + t.amount, 0);
        const categoryGrouped: Record<string, number> = {};
        filteredExpenses.forEach(t => {
            categoryGrouped[t.category] = (categoryGrouped[t.category] || 0) + t.amount;
        });

        const pieData = Object.keys(categoryGrouped)
            .sort((a, b) => categoryGrouped[b] - categoryGrouped[a])
            .map((cat) => ({
                category: cat,
                amount: categoryGrouped[cat],
                percent: total > 0 ? categoryGrouped[cat] / total : 0,
                color: getCategoryColor(cat),
                icon: getCategoryIcon(cat)
            }));

        // Max value for scaling visual
        const maxValue = Math.max(...lineData.map(d => d.value), 0);

        // Safety: Ensure lineData has at least 2 points for Wagmi
        if (lineData.length === 0) lineData.push({ timestamp: Date.now(), value: 0 });
        if (lineData.length === 1) lineData.push({ timestamp: lineData[0].timestamp + 1000, value: lineData[0].value });

        return { lineData, pieData, total, maxValue, labelStart, labelEnd };

    }, [timeRange, activeTransactions, currentMonth, getCategoryColor, getCategoryIcon]);

    const renderDonutChart = () => {
        if (stats.pieData.length === 0) {
            return (
                <View style={[styles.chartContainer, { height: 240, justifyContent: 'center' }]}>
                    <Text style={styles.noDataText}>No expenses for this period</Text>
                </View>
            );
        }

        let cumulativePercent = 0;

        return (
            <View style={styles.chartContainer}>
                <Svg height="200" width="200" viewBox="-1.2 -1.2 2.4 2.4">
                    <G rotation="-90">
                        {stats.pieData.map((slice, index) => {
                            const start = getCoordinatesForPercent(cumulativePercent);
                            cumulativePercent += slice.percent;
                            const end = getCoordinatesForPercent(cumulativePercent);

                            if (slice.percent >= 1) {
                                return (
                                    <Circle
                                        key={index}
                                        cx="0" cy="0"
                                        r="0.8"
                                        fill="none"
                                        stroke={slice.color}
                                        strokeWidth="0.3"
                                    />
                                );
                            }

                            const largeArcFlag = slice.percent > 0.5 ? 1 : 0;
                            const pathData = [
                                `M 0 0`,
                                `L ${start[0]} ${start[1]}`,
                                `A 1 1 0 ${largeArcFlag} 1 ${end[0]} ${end[1]}`,
                                `Z`
                            ].join(' ');

                            return <Path d={pathData} fill={slice.color} key={index} />;
                        })}
                    </G>
                    <Circle cx="0" cy="0" r="0.65" fill={Colors.surface} />
                </Svg>

                <View style={styles.centerLabel}>
                    <Text style={styles.centerLabelText}>Total</Text>
                    <Text style={styles.centerLabelAmount}>${stats.total.toLocaleString()}</Text>
                </View>
            </View>
        );
    };

    const renderLineChart = () => {
        if (isLoadingYear && timeRange === 'Year') {
            return (
                <View style={[styles.chartContainer, { height: 260, justifyContent: 'center' }]}>
                    <Text style={styles.noDataText}>Loading Year Data...</Text>
                </View>
            );
        }

        if (stats.lineData.length === 0 || stats.pieData.length === 0) {
            // Logic check: if no expenses, chart is empty
            // But we padded lineData to avoid crashes. Check total.
            if (stats.total === 0) {
                return (
                    <View style={[styles.chartContainer, { height: 260, justifyContent: 'center' }]}>
                        <Text style={styles.noDataText}>No expenses for this period</Text>
                    </View>
                );
            }
        }

        return (
            <View style={[styles.chartContainer, { width: '100%', paddingHorizontal: 0, height: 260 }]}>
                {stats.maxValue > 0 && (
                    <Text style={styles.maxLabel}>Max: ${stats.maxValue.toLocaleString()}</Text>
                )}

                <LineChart.Provider data={stats.lineData} key={timeRange}>
                    <LineChart height={220} width={width - 32}>
                        <LineChart.Path color={Colors.primary} width={3}>
                            <LineChart.Gradient color={Colors.primary} />
                        </LineChart.Path>

                        <LineChart.CursorLine />

                        <LineChart.Tooltip
                            textStyle={{
                                color: Colors.surface,
                                fontSize: 14,
                                fontWeight: '700',
                                fontVariant: ['tabular-nums']
                            }}
                            style={{
                                backgroundColor: Colors.text,
                                borderRadius: 12,
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                            }}
                            position="top"
                        />

                        {/* Explicit Overlay for Gestures */}
                        <LineChart.HoverTrap />
                    </LineChart>
                </LineChart.Provider>

                <View style={styles.axisLabels}>
                    <Text style={styles.axisText}>{stats.labelStart}</Text>
                    <Text style={styles.axisText}>{timeRange}</Text>
                    <Text style={styles.axisText}>{stats.labelEnd}</Text>
                </View>
            </View>
        );
    };

    return (
        <ScreenWrapper backgroundColor={Colors.background}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.headerRow}>
                    <Text style={styles.headerTitle}>Statistics</Text>

                    <View style={styles.viewToggle}>
                        <TouchableOpacity
                            style={[styles.segment, chartType === 'distribution' && styles.segmentActive]}
                            onPress={() => {
                                setChartType('distribution');
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                        >
                            <PieChart
                                size={20}
                                color={chartType === 'distribution' ? Colors.iconBgPurple : Colors.textSecondary}
                                strokeWidth={2.5}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.segment, chartType === 'trend' && styles.segmentActive]}
                            onPress={() => {
                                setChartType('trend');
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                        >
                            <Activity
                                size={20}
                                color={chartType === 'trend' ? Colors.iconBgPurple : Colors.textSecondary}
                                strokeWidth={2.5}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* TIME RANGE SELECTOR (Only relevant for Trend usually, but lets show for both for consistency) */}
                <View style={styles.timeRangeContainer}>
                    {(['Day', 'Week', 'Month', 'Year'] as TimeRange[]).map((range) => (
                        <TouchableOpacity
                            key={range}
                            onPress={() => {
                                setTimeRange(range);
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                            style={[
                                styles.timeRangeButton,
                                timeRange === range && styles.timeRangeButtonActive
                            ]}
                        >
                            <Text style={[
                                styles.timeRangeText,
                                timeRange === range && styles.timeRangeTextActive
                            ]}>
                                {range}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {chartType === 'distribution' ? renderDonutChart() : renderLineChart()}

                {chartType === 'distribution' && (
                    <View style={styles.legendContainer}>
                        {stats.pieData.map((item, index) => {
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
                )}

                {chartType === 'trend' && (
                    <View style={styles.trendInfoContainer}>
                        <Text style={styles.trendInfoText}>
                            Showing {timeRange.toLowerCase()}ly spending.
                            {'\n'}Touch chart to see details.
                        </Text>
                    </View>
                )}

            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: Layout.spacing.lg,
        alignItems: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: Layout.spacing.lg,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -0.5,
    },
    // Segmented Control
    viewToggle: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        padding: 4,
        height: 48,
        alignItems: 'center',
        gap: 4
    },
    segment: {
        width: 44,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    segmentActive: {
        backgroundColor: '#FFF',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },

    // Time Range
    timeRangeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: Layout.spacing.xl,
        backgroundColor: 'transparent',
    },
    timeRangeButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
        borderRadius: 12,
    },
    timeRangeButtonActive: {
        backgroundColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    timeRangeText: {
        color: Colors.textSecondary,
        fontWeight: '600',
        fontSize: 14,
    },
    timeRangeTextActive: {
        color: '#FFF',
        fontWeight: '700',
    },

    chartContainer: {
        marginBottom: Layout.spacing.xl * 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        // height removed for flexibility
        width: 240,
        position: 'relative'
    },
    // CHART STYLES
    maxLabel: {
        position: 'absolute',
        top: 0,
        right: 16,
        fontSize: 12,
        color: Colors.textTertiary,
        fontWeight: '600',
        zIndex: 1,
    },
    axisLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: width - 32, // Match screen width minus padding
        marginTop: 8,
        paddingHorizontal: 8,
    },
    axisText: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: '600',
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
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 0,
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
    trendInfoContainer: {
        padding: 20,
        alignItems: 'center',
    },
    trendInfoText: {
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    }
});
