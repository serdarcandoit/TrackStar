import { LineChart } from 'react-native-wagmi-charts';
import { Colors } from '../constants/Colors';
import { Dimensions } from 'react-native';

interface DetailedChartProps {
    color?: string;
}

export function DetailedChart({ color = Colors.primary }: DetailedChartProps) {
    const { width: screenWidth } = Dimensions.get('window');

    return (
        <LineChart width={screenWidth} height={250}>
            <LineChart.Path color={color} width={3}>
                <LineChart.Gradient color={color} />
            </LineChart.Path>
            <LineChart.CursorCrosshair color={Colors.text} />
        </LineChart>
    );
}

// Re-export memoized version if needed, but simple component is fine
export default DetailedChart;
