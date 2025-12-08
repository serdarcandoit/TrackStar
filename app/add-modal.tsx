import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, KeyboardAvoidingView, Alert, TouchableOpacity, Switch } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { format } from 'date-fns';

import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';
import { useBudget } from '../context/BudgetContext';

const CATEGORIES = ["Food", "Transport", "Shopping", "Entertainment", "Bills", "Health", "Salary", "Rent", "Groceries", "Dining Out", "Other"];

export default function AddModal() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { addTransaction, deleteRecurringRule, recurringRules } = useBudget();

    const [amount, setAmount] = useState(params.amount ? String(params.amount) : '');
    const [category, setCategory] = useState(params.category ? String(params.category) : '');
    const [note, setNote] = useState(params.note ? String(params.note) : '');

    // Parse date correctly: if date param exists, use it, else default to today
    const initialDateStr = params.date
        ? new Date(String(params.date)).toISOString().slice(0, 10) // Format YYYY-MM-DD
        : format(new Date(), 'yyyy-MM-dd');

    const [dateStr, setDateStr] = useState(initialDateStr);

    // Check if editing an existing recurring transaction AND the rule is still active
    const initialIsRecurring = useMemo(() => {
        if (!params.recurringRuleId) return false;
        return recurringRules.some(r => r.id === params.recurringRuleId);
    }, [params.recurringRuleId, recurringRules]);

    const [isRecurring, setIsRecurring] = useState(initialIsRecurring);

    // Update isRecurring if initial changes (e.g. rules loaded)
    useEffect(() => {
        if (params.recurringRuleId) {
            const isActive = recurringRules.some(r => r.id === params.recurringRuleId);
            setIsRecurring(isActive);
        }
    }, [recurringRules, params.recurringRuleId]);

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ amount?: string; category?: string }>({});

    const isEditing = !!params.id;

    const validate = () => {
        const newErrors: typeof errors = {};
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            newErrors.amount = 'Please enter a valid amount';
        }
        if (!category.trim()) {
            newErrors.category = 'Category is required';
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            // Allow it but could warn.
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            // Handle Recurring Toggle Logic
            let shouldCreateRule = isRecurring;

            if (isEditing) {
                // If it WAS recurring but now turned OFF -> Delete the rule
                if (params.recurringRuleId && !isRecurring) {
                    const currentTransactionDate = new Date(dateStr).toISOString();
                    await deleteRecurringRule(String(params.recurringRuleId), currentTransactionDate);
                    shouldCreateRule = false;
                }
                // If it WAS recurring and still IS -> Don't create duplicate
                if (params.recurringRuleId && isRecurring) {
                    shouldCreateRule = false;
                }
                // If it WAS NOT recurring and now IS -> Create rule (shouldCreateRule = true)
            }

            await addTransaction({
                id: isEditing ? String(params.id) : Date.now().toString(),
                amount: parseFloat(amount),
                category: category.trim(),
                date: new Date(dateStr).toISOString(),
                note: note.trim(),
                type: 'expense'
            }, shouldCreateRule); // Pass the computed flag

            router.back();
        } catch (e) {
            Alert.alert('Error', 'Failed to save transaction');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
            <ScreenWrapper backgroundColor={Colors.surface}>
                <StatusBar style={Platform.OS === 'ios' ? 'light' : 'dark'} />
                <ScrollView contentContainerStyle={styles.container}>

                    {/* Category Chips */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.chipsScroll}
                        contentContainerStyle={styles.chipsContainer}
                    >
                        {CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                onPress={() => setCategory(cat)}
                                style={[
                                    styles.chip,
                                    category === cat && styles.chipActive
                                ]}
                            >
                                <Text style={[
                                    styles.chipText,
                                    category === cat && styles.chipTextActive
                                ]}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Input
                        label="Amount"
                        placeholder="0.00"
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={setAmount}
                        error={errors.amount}
                        style={styles.amountInput}
                    />

                    <Input
                        label="Category"
                        placeholder="e.g. Food, Rent, Salary"
                        value={category}
                        onChangeText={setCategory}
                        error={errors.category}
                    />

                    <Input
                        label="Date (YYYY-MM-DD)"
                        placeholder="YYYY-MM-DD"
                        value={dateStr}
                        onChangeText={setDateStr}
                    />

                    <Input
                        label="Note (Optional)"
                        placeholder="Add details..."
                        value={note}
                        onChangeText={setNote}
                        multiline
                        numberOfLines={3}
                        style={{ height: 80, textAlignVertical: 'top' }}
                    />

                    {/* Recurring Option */}
                    <View style={styles.switchContainer}>
                        <Text style={styles.switchLabel}>Repeats Monthly</Text>
                        <Switch
                            value={isRecurring}
                            onValueChange={setIsRecurring}
                            trackColor={{ false: Colors.border, true: Colors.primary }}
                        />
                    </View>

                    <View style={styles.spacer} />

                    <Button
                        title={isEditing ? "Update Transaction" : "Save Transaction"}
                        onPress={handleSubmit}
                        loading={loading}
                    />

                </ScrollView>
            </ScreenWrapper>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: Layout.spacing.lg,
    },
    amountInput: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.primary,
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: Layout.spacing.md,
        paddingHorizontal: 4,
    },
    switchLabel: {
        fontSize: 16,
        color: Colors.text,
        fontWeight: '500',
    },
    spacer: {
        height: Layout.spacing.xl,
    },
    chipsScroll: {
        maxHeight: 50,
        marginBottom: Layout.spacing.md,
    },
    chipsContainer: {
        paddingHorizontal: 2,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: Colors.background,
        marginRight: 8,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    chipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    chipText: {
        fontSize: 14,
        color: Colors.text,
        fontWeight: '500',
    },
    chipTextActive: {
        color: '#FFFFFF',
    }
});
