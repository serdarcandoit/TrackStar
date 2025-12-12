import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, MonthData, RecurringTransaction, CryptoAsset } from '../types';

const STORAGE_PREFIX = 'budget_app_';
const RECURRING_KEY = 'budget_app_recurring_rules';
const CRYPTO_KEY = 'budget_app_crypto_portfolio';
const CUSTOM_CATEGORIES_KEY = 'budget_app_custom_categories';

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
     * Recurrring Rules Logic
     */
    getRecurringRules: async (): Promise<RecurringTransaction[]> => {
        try {
            const jsonValue = await AsyncStorage.getItem(RECURRING_KEY);
            return jsonValue != null ? JSON.parse(jsonValue) : [];
        } catch (e) {
            return [];
        }
    },

    saveRecurringRule: async (rule: RecurringTransaction): Promise<void> => {
        try {
            const rules = await Storage.getRecurringRules();
            const newRules = [...rules, rule];
            await AsyncStorage.setItem(RECURRING_KEY, JSON.stringify(newRules));
        } catch (e) {
            console.error('Failed to save recurring rule', e);
        }
    },

    deleteRecurringRule: async (ruleId: string): Promise<void> => {
        try {
            const rules = await Storage.getRecurringRules();
            const newRules = rules.filter(r => r.id !== ruleId);
            await AsyncStorage.setItem(RECURRING_KEY, JSON.stringify(newRules));
        } catch (e) {
            console.error('Failed to delete recurring rule', e);
        }
    },

    /**
     * Process recurring rules for a given month.
     * Checks if any rule hasn't been generated for this month yet.
     */
    processRecurringTransactions: async (targetMonth: string): Promise<void> => {
        try {
            const rules = await Storage.getRecurringRules();
            let rulesUpdated = false;

            for (const rule of rules) {
                // If rule's lastGeneratedMonth is before targetMonth, we generate
                if (rule.lastGeneratedMonth < targetMonth) {

                    // Create Date for the target month
                    const day = rule.dayOfMonth.toString().padStart(2, '0');
                    const newDate = `${targetMonth}-${day}`;

                    const newTransaction: Transaction = {
                        id: Date.now().toString() + Math.random().toString(),
                        amount: rule.amount,
                        category: rule.category,
                        note: rule.note,
                        type: rule.type,
                        date: new Date(newDate).toISOString(), // Ensure full ISO string
                        recurringRuleId: rule.id
                    };

                    // Save to transaction storage
                    await Storage.saveTransaction(targetMonth, newTransaction);

                    // Update rule
                    rule.lastGeneratedMonth = targetMonth;
                    rulesUpdated = true;
                }
            }

            if (rulesUpdated) {
                await AsyncStorage.setItem(RECURRING_KEY, JSON.stringify(rules));
            }

        } catch (e) {
            console.error('Failed to process recurring transactions', e);
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
    },

    /**
     * Clear ALL data (Reset App)
     */
    clearStorage: async (): Promise<void> => {
        try {
            await AsyncStorage.clear();
        } catch (e) {
            console.error('Failed to clear storage', e);
        }
    },

    /**
     * Clear ONLY transactions (keep budget and recurring rules)
     */
    clearTransactions: async (): Promise<void> => {
        try {
            const keys = await AsyncStorage.getAllKeys();
            // Filter keys that start with STORAGE_PREFIX but are NOT the recurring key
            const transactionKeys = keys.filter(key =>
                key.startsWith(STORAGE_PREFIX) &&
                key !== RECURRING_KEY &&
                !key.startsWith('budget_limit_') // Also prevent deleting budget limits, though they have different prefix
            );

            if (transactionKeys.length > 0) {
                await AsyncStorage.multiRemove(transactionKeys);
            }
        } catch (e) {
            console.error('Failed to clear transactions', e);
            throw new Error('Failed to clear transactions');
        }
    },

    /**
     * Delete ALL future transactions for a given rule (including the month of fromDate if date > fromDate)
     * @param ruleId ID of the recurring rule
     * @param fromDate ISO string (e.g. "2024-05-15T...") - Transactions AFTER this date will be deleted
     */
    deleteFutureTransactionsForRule: async (ruleId: string, fromDate: string): Promise<void> => {
        try {
            const keys = await AsyncStorage.getAllKeys();
            // Get all month keys: budget_app_YYYY-MM
            const monthKeys = keys.filter(k => k.startsWith(STORAGE_PREFIX) && k !== RECURRING_KEY && !k.startsWith('budget_limit_'));

            const fromMonth = fromDate.slice(0, 7); // YYYY-MM
            const fromTime = new Date(fromDate).getTime();

            for (const key of monthKeys) {
                // Key is budget_app_YYYY-MM, so slice(11) gets YYYY-MM
                const month = key.substring(11);

                // Only look at months >= current month
                if (month >= fromMonth) {
                    const jsonValue = await AsyncStorage.getItem(key);
                    if (!jsonValue) continue;

                    const transactions: Transaction[] = JSON.parse(jsonValue);
                    const originalLength = transactions.length;

                    // Filter out transactions that match the rule AND are strictly after the fromDate
                    const newTransactions = transactions.filter(t => {
                        if (t.recurringRuleId !== ruleId) return true;

                        // It is the rule, check date
                        // IF it's in a future month (month > fromMonth), delete it
                        if (month > fromMonth) return false;

                        // IF it's in the SAME month, delete only if date is AFTER fromDate
                        return new Date(t.date).getTime() <= fromTime;
                    });

                    if (newTransactions.length !== originalLength) {
                        await AsyncStorage.setItem(key, JSON.stringify(newTransactions));
                    }
                }
            }
        } catch (e) {
            console.error('Failed to delete future transactions', e);
        }
    },

    /**
     * Crypto Portfolio Logic
     */
    getCryptoPortfolio: async (): Promise<CryptoAsset[]> => {
        try {
            const jsonValue = await AsyncStorage.getItem(CRYPTO_KEY);
            return jsonValue != null ? JSON.parse(jsonValue) : [];
        } catch (e) {
            return [];
        }
    },

    saveCryptoPortfolio: async (portfolio: CryptoAsset[]): Promise<void> => {
        try {
            await AsyncStorage.setItem(CRYPTO_KEY, JSON.stringify(portfolio));
        } catch (e) {
            console.error('Failed to save crypto portfolio', e);
        }
    },

    saveCryptoAsset: async (asset: CryptoAsset): Promise<void> => {
        try {
            const portfolio = await Storage.getCryptoPortfolio();
            const index = portfolio.findIndex(p => p.id === asset.id);
            let newPortfolio;

            if (index >= 0) {
                newPortfolio = [...portfolio];
                newPortfolio[index] = asset;
            } else {
                newPortfolio = [...portfolio, asset];
            }
            await Storage.saveCryptoPortfolio(newPortfolio);
        } catch (e) {
            console.error('Failed to save crypto asset', e);
        }
    },

    deleteCryptoAsset: async (assetId: string): Promise<void> => {
        try {
            const portfolio = await Storage.getCryptoPortfolio();
            const newPortfolio = portfolio.filter(p => p.id !== assetId);
            await Storage.saveCryptoPortfolio(newPortfolio);
        } catch (e) {
            console.error('Failed to delete crypto asset', e);
        }
    },

    /**
     * Custom Categories Logic
     */
    getCustomCategories: async (): Promise<any[]> => {
        try {
            const jsonValue = await AsyncStorage.getItem(CUSTOM_CATEGORIES_KEY);
            return jsonValue != null ? JSON.parse(jsonValue) : [];
        } catch (e) {
            return [];
        }
    },

    saveCustomCategories: async (categories: any[]): Promise<void> => {
        try {
            await AsyncStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(categories));
        } catch (e) {
            console.error('Failed to save custom categories', e);
        }
    },

    deleteCustomCategories: async (categoryName: string): Promise<void> => {
        try {
            const categories = await Storage.getCustomCategories();
            const newCategories = categories.filter((c: any) => c.name !== categoryName);
            await AsyncStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(newCategories));
        } catch (e) {
            console.error('Failed to delete custom category', e);
        }
    }
};
