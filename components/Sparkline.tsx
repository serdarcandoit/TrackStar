import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../constants/Colors';

interface SparklineProps {
    data: number[];
    width?: number;
    height?: number;
    color?: string;
}

export default function Sparkline({ data, width = 100, height = 40, color = Colors.primary }: SparklineProps) {
    if (!data || data.length === 0) return null;

    const pathD = useMemo(() => {
        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max - min;

        // If flat line
        if (range === 0) {
            return `M 0 ${height / 2} L ${width} ${height / 2}`;
        }

        const stepX = width / (data.length - 1);

        return data.reduce((path, val, index) => {
            const x = index * stepX;
            // Invert Y axis because SVG 0 is top
            const y = height - ((val - min) / range) * height;
            return `${path} ${index === 0 ? 'M' : 'L'} ${x} ${y}`;
        }, '');
    }, [data, width, height]);

    return (
        <View style={{ width, height }}>
            <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                <Path
                    d={pathD}
                    stroke={color}
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </Svg>
        </View>
    );
}
