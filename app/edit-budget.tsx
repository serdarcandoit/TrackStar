import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';
import { useBudget } from '../context/BudgetContext';

export default function EditBudget() {
    const router = useRouter();
    const { monthlyBudget, setBudget } = useBudget();
    const [amount, setAmount] = useState(monthlyBudget.toString());
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        const val = parseFloat(amount);
        if (!amount || isNaN(val) || val <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid budget amount.');
            return;
        }

        setLoading(true);
        await setBudget(val);
        setLoading(false);
        router.back();
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <ScreenWrapper backgroundColor={Colors.surface}>
                <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
                <View style={styles.container}>
                    <Input
                        label="Monthly Budget"
                        placeholder="5000"
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={setAmount}
                        autoFocus
                        style={styles.input}
                    />

                    <View style={styles.spacer} />

                    <Button
                        title="Update Budget"
                        onPress={handleSave}
                        loading={loading}
                    />
                </View>
            </ScreenWrapper>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: Layout.spacing.lg,
        flex: 1,
    },
    input: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.primary,
    },
    spacer: {
        height: Layout.spacing.lg,
    }
});
