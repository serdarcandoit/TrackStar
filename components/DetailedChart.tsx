import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-wagmi-charts';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/Colors';

interface DetailedChartProps {
    data: number[][]; // [timestamp, price]
    color?: string;
    onDataScrub?: (data: { timestamp: number; value: number } | null) => void;
}

export default function DetailedChart({ data, color = Colors.primary, onDataScrub }: DetailedChartProps) {
    const { width: screenWidth } = Dimensions.get('window');

    // Transform data for wagmi-charts
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];
        return data.map(d => ({ timestamp: d[0], value: d[1] }));
    }, [data]);

    if (!chartData || chartData.length === 0) return null;

    return (
        <View style={styles.container}>
            <LineChart.Provider data={chartData}>
                <LineChart width={screenWidth} height={250}>
                    <LineChart.Path color={color} width={3}>
                        <LineChart.Gradient color={color} />
                    </LineChart.Path>
                    <LineChart.CursorCrosshair
                        onActivated={(item) => {
                            Haptics.selectionAsync();
                            if (onDataScrub && item) {
                                // Extract the raw data point
                                const point = { timestamp: item.timestamp, value: item.value };
                                onDataScrub(point);
                            }
                        }}
                        onEnded={() => {
                            if (onDataScrub) {
                                onDataScrub(null);
                            }
                        }}
                        color={Colors.text}
                    />
                </LineChart>
            </LineChart.Provider>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20,
    },
});
