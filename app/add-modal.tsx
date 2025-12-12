import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, KeyboardAvoidingView, Alert, TouchableOpacity, Switch, Modal, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { format } from 'date-fns';
import { Plus, X } from 'lucide-react-native';

import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';
import { DEFAULT_CATEGORIES } from '../constants/CategoryIcons';
import { useBudget } from '../context/BudgetContext';

export default function AddModal() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { addTransaction, updateTransaction, deleteRecurringRule, recurringRules, categories, addCustomCategory, deleteCustomCategory } = useBudget();

    const [amount, setAmount] = useState(params.amount ? String(params.amount) : '');
    const [category, setCategory] = useState(params.category ? String(params.category) : '');
    const [note, setNote] = useState(params.note ? String(params.note) : '');

    // Custom Category Modal State
    const [isAddCatModalVisible, setIsAddCatModalVisible] = useState(false);
    const [newCatName, setNewCatName] = useState('');

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

            const transactionData = {
                id: isEditing ? String(params.id) : Date.now().toString(),
                amount: parseFloat(amount),
                category: category.trim(),
                date: new Date(dateStr).toISOString(), // Updated date
                note: note.trim(),
                type: 'expense' as const
            };

            if (isEditing) {
                // Pass original date (params.date) to handle month moving
                const oldDate = params.date ? String(params.date) : undefined;
                await updateTransaction(transactionData, oldDate, shouldCreateRule);
            } else {
                await addTransaction(transactionData, shouldCreateRule);
            }

            router.back();
        } catch (e) {
            Alert.alert('Error', 'Failed to save transaction');
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = () => {
        if (!newCatName.trim()) return;

        addCustomCategory(newCatName.trim());
        setCategory(newCatName.trim());
        setNewCatName('');
        setIsAddCatModalVisible(false);
    };

    const handleDeleteCategoryTrigger = (cat: string) => {
        // Only allow deleting custom categories
        if (DEFAULT_CATEGORIES.includes(cat)) return;

        Alert.alert(
            "Delete Category",
            `Are you sure you want to delete "${cat}"?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        // If selected category is the one being deleted, clear selection
                        if (category === cat) {
                            setCategory('');
                        }
                        await deleteCustomCategory(cat);
                    }
                }
            ]
        );
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
                    <Text style={styles.label}>Category</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.chipsScroll}
                        contentContainerStyle={styles.chipsContainer}
                    >
                        {categories.map((cat) => {
                            const isDefault = DEFAULT_CATEGORIES.includes(cat);
                            return (
                                <TouchableOpacity
                                    key={cat}
                                    onPress={() => setCategory(cat)}
                                    // Long press to delete custom categories
                                    onLongPress={() => !isDefault && handleDeleteCategoryTrigger(cat)}
                                    delayLongPress={500}
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
                            );
                        })}


                        {/* ADD CATEGORY BUTTON */}
                        <TouchableOpacity
                            onPress={() => setIsAddCatModalVisible(true)}
                            style={[styles.chip, styles.addCatChip]}
                        >
                            <Plus size={16} color={Colors.primary} />
                            <Text style={[styles.chipText, { color: Colors.primary, marginLeft: 4 }]}>New</Text>
                        </TouchableOpacity>

                    </ScrollView>
                    {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}

                    <Input
                        label="Amount"
                        placeholder="0.00"
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={setAmount}
                        error={errors.amount}
                        style={styles.amountInput}
                    />

                    {/* Hidden input for visual spacing consistency, moved logic to chips above */}

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

                {/* Custom Category Modal */}
                <Modal
                    visible={isAddCatModalVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setIsAddCatModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>New Category</Text>
                                <TouchableOpacity onPress={() => setIsAddCatModalVisible(false)}>
                                    <X size={24} color={Colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                style={styles.modalInput}
                                placeholder="Category Name"
                                placeholderTextColor={Colors.textTertiary}
                                value={newCatName}
                                onChangeText={setNewCatName}
                                autoFocus
                            />

                            <Button title="Add Category" onPress={handleAddCategory} />
                        </View>
                    </View>
                </Modal>

            </ScreenWrapper>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: Layout.spacing.lg,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.textSecondary,
        marginBottom: 8,
        marginLeft: 4
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: Colors.background,
        marginRight: 8,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    addCatChip: {
        borderStyle: 'dashed',
        borderColor: Colors.primary,
        backgroundColor: Colors.primary + '10'
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
    },
    errorText: {
        color: Colors.danger,
        fontSize: 12,
        marginBottom: 8,
        marginLeft: 4
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        width: '100%',
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        ...Layout.shadows.medium
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text
    },
    modalInput: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: Colors.text,
        marginBottom: 20
    }
});
