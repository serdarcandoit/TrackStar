import { Stack } from 'expo-router';
import { BudgetProvider } from '../context/BudgetContext';
import { Colors } from '../constants/Colors';

export default function RootLayout() {
    return (
        <BudgetProvider>
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: Colors.background },
                    headerTintColor: Colors.primary,
                }}
            >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                    name="add-modal"
                    options={{
                        presentation: 'modal',
                        headerShown: true,
                        title: 'Add Transaction',
                        headerStyle: {
                            backgroundColor: Colors.surface,
                        },
                        headerTitleStyle: {
                            color: 'black'
                        }
                    }}
                />
                <Stack.Screen
                    name="edit-budget"
                    options={{
                        presentation: 'modal',
                        headerShown: true,
                        title: 'Edit Budget',
                        headerStyle: { backgroundColor: Colors.surface },
                        headerTitleStyle: { color: 'black' }
                    }}
                />
            </Stack>
        </BudgetProvider>
    );
}
