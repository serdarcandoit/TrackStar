import { Tabs } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Home, PieChart, List } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet } from 'react-native';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textTertiary,
                tabBarStyle: {
                    position: 'absolute',
                    borderTopWidth: 0,
                    backgroundColor: Platform.OS === 'ios' ? 'transparent' : Colors.surface,
                    elevation: 0,
                },
                tabBarBackground: () => (
                    Platform.OS === 'ios' ? (
                        <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="light" />
                    ) : null
                ),
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="transactions"
                options={{
                    title: 'History',
                    tabBarIcon: ({ color, size }) => <List size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="stats"
                options={{
                    title: 'Statistics',
                    tabBarIcon: ({ color, size }) => <PieChart size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}
