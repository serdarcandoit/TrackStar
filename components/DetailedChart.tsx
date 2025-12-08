import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../constants/Colors';

interface DetailedChartProps {
    data: number[][]; // [timestamp, price]
    color?: string;
}

export default function DetailedChart({ data, color = Colors.primary }: DetailedChartProps) {
    const { width: screenWidth } = Dimensions.get('window');
    const width = screenWidth;
    const height = 250;

    const chartPath = useMemo(() => {
        if (!data || data.length === 0) return '';

        const prices = data.map(d => d[1]);
        const max = Math.max(...prices);
        const min = Math.min(...prices);
        const range = max - min;

        if (range === 0) return `M 0 ${height / 2} L ${width} ${height / 2}`;

        const stepX = width / (prices.length - 1);

        const path = prices.reduce((acc, price, index) => {
            const x = index * stepX;
            // Add padding to top/bottom so it doesn't touch edges exactly
            const y = height - ((price - min) / range) * (height - 40) - 20;
            return `${acc} ${index === 0 ? 'M' : 'L'} ${x} ${y}`;
        }, '');

        return path;
    }, [data, width, height]);

    const fillPath = useMemo(() => {
        if (!chartPath) return '';
        return `${chartPath} L ${width} ${height} L 0 ${height} Z`;
    }, [chartPath, width, height]);

    if (!data || data.length === 0) return null;

    return (
        <View style={styles.container}>
            <Svg width={width} height={height}>
                <Defs>
                    <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={color} stopOpacity="0.5" />
                        <Stop offset="1" stopColor={color} stopOpacity="0" />
                    </LinearGradient>
                </Defs>
                <Path
                    d={fillPath}
                    fill="url(#gradient)"
                />
                <Path
                    d={chartPath}
                    stroke={color}
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </Svg>
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
