import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction } from '../types';

const STORAGE_PREFIX = 'budget_app_';

// Helper to get key for a specific month
const getMonthKey = (monthKey: string) => `${STORAGE_PREFIX}${monthKey}`;

export const Storage = {
    /**
     * Get all transactions for a specific month
     * @param monthKey format "YYYY-MM"
     */
    getTransactions: async (monthKey: string): Promise<Transaction[]> => {
        try {
            const key = getMonthKey(monthKey);
            const jsonValue = await AsyncStorage.getItem(key);
            return jsonValue != null ? JSON.parse(jsonValue) : [];
        } catch (e) {
            console.error('Failed to fetch transactions', e);
            throw new Error('Failed to fetch data');
        }
    },

    /**
     * Save a transaction (add or update)
     * @param monthKey format "YYYY-MM"
     * @param transaction complete transaction object
     */
    saveTransaction: async (monthKey: string, transaction: Transaction): Promise<void> => {
        try {
            const key = getMonthKey(monthKey);
            const currentTransactions = await Storage.getTransactions(monthKey);

            // Check if updating or adding
            const index = currentTransactions.findIndex(t => t.id === transaction.id);
            let newTransactions;

            if (index >= 0) {
                // Update existing
                newTransactions = [...currentTransactions];
                newTransactions[index] = transaction;
            } else {
                // Add new
                newTransactions = [transaction, ...currentTransactions];
            }

            await AsyncStorage.setItem(key, JSON.stringify(newTransactions));
        } catch (e) {
            console.error('Failed to save transaction', e);
            throw new Error('Failed to save data');
        }
    },

    /**
     * Delete a transaction
     */
    deleteTransaction: async (monthKey: string, transactionId: string): Promise<void> => {
        try {
            const key = getMonthKey(monthKey);
            const currentTransactions = await Storage.getTransactions(monthKey);
            const newTransactions = currentTransactions.filter(t => t.id !== transactionId);
            await AsyncStorage.setItem(key, JSON.stringify(newTransactions));
        } catch (e) {
            console.error('Failed to delete transaction', e);
            throw new Error('Failed to delete data');
        }
    },

    /**
     * Get budget for a specific month
     */
    getBudget: async (monthKey: string): Promise<number> => {
        try {
            const key = `budget_limit_${monthKey}`;
            const jsonValue = await AsyncStorage.getItem(key);
            return jsonValue != null ? parseFloat(jsonValue) : 5000;
        } catch (e) {
            return 5000;
        }
    },

    /**
     * Save budget for a specific month
     */
    saveBudget: async (monthKey: string, amount: number): Promise<void> => {
        try {
            const key = `budget_limit_${monthKey}`;
            await AsyncStorage.setItem(key, amount.toString());
        } catch (e) {
            console.error('Failed to save budget', e);
        }
    },

    /**
     * Clear all data for a month
     */
    clearMonth: async (monthKey: string): Promise<void> => {
        try {
            const key = getMonthKey(monthKey);
            await AsyncStorage.removeItem(key);
        } catch (e) {
            console.error('Failed to clear month', e);
        }
    }
};
