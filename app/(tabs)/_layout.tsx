import { Tabs } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Home, PieChart, List } from 'lucide-react-native';
import { Platform, View, StyleSheet } from 'react-native';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textTertiary,
                tabBarShowLabel: true,
                tabBarStyle: {
                    position: 'absolute',
                    borderTopWidth: 0,
                    backgroundColor: '#FFFFFF', // White background
                    height: 80, // Taller footer
                    paddingBottom: 20,
                    ...styles.shadow
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color, size }) => (
                        <View style={styles.iconContainer}>
                            <Home size={size} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="transactions"
                options={{
                    title: 'History',
                    tabBarIcon: ({ color, size }) => (
                        <View style={styles.iconContainer}>
                            <List size={size} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="stats"
                options={{
                    title: 'Statistics',
                    tabBarIcon: ({ color, size }) => (
                        <View style={styles.iconContainer}>
                            <PieChart size={size} color={color} />
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    shadow: {
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
        width: 50,
    },
});
