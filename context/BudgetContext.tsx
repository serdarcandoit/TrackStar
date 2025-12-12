import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Category, Transaction, RecurringTransaction } from '../types';
import { Storage } from '../utils/storage';
import { Alert } from 'react-native';
import { DEFAULT_CATEGORIES, CategoryColors, CategoryIcons } from '../constants/CategoryIcons';
import { Colors } from '../constants/Colors';
import { Tag } from 'lucide-react-native';

interface BudgetContextType {
    transactions: Transaction[];
    recurringRules: RecurringTransaction[];
    currentMonth: string; // "YYYY-MM"
    loading: boolean;
    totalSpent: number;
    remainingBalance: number;
    monthlyBudget: number;

    // Category Stuff
    categories: string[];
    addCustomCategory: (name: string) => Promise<void>;
    deleteCustomCategory: (name: string) => Promise<void>;
    getCategoryColor: (categoryName: string) => string;
    getCategoryIcon: (categoryName: string) => any;

    switchMonth: (month: string) => void;
    addTransaction: (transaction: Transaction, isRecurring?: boolean) => Promise<void>;
    updateTransaction: (transaction: Transaction, oldDate?: string, isRecurring?: boolean) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
    deleteRecurringRule: (id: string, currentTransactionDate?: string) => Promise<void>;
    setBudget: (amount: number) => Promise<void>;
    clearAllData: () => Promise<void>;
    clearTransactions: () => Promise<void>;
    refresh: () => void;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const useBudget = () => {
    const context = useContext(BudgetContext);
    if (!context) {
        throw new Error('useBudget must be used within a BudgetProvider');
    }
    return context;
};

interface BudgetProviderProps {
    children: ReactNode;
}

export const BudgetProvider: React.FC<BudgetProviderProps> = ({ children }) => {
    const [currentMonth, setCurrentMonth] = useState<string>(new Date().toISOString().slice(0, 7));
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [recurringRules, setRecurringRules] = useState<RecurringTransaction[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [monthlyBudget, setMonthlyBudget] = useState<number>(5000);
    const [customCategories, setCustomCategories] = useState<Category[]>([]);

    const loadData = async () => {
        try {
            setLoading(true);
            // Check for recurring transactions to generate before loading
            await Storage.processRecurringTransactions(currentMonth);

            const data = await Storage.getTransactions(currentMonth);
            const budget = await Storage.getBudget(currentMonth);
            const rules = await Storage.getRecurringRules();
            const customs = await Storage.getCustomCategories();

            setTransactions(data);
            setMonthlyBudget(budget);
            setRecurringRules(rules);
            setCustomCategories(customs);
        } catch (error) {
            Alert.alert('Error', 'Failed to load transactions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentMonth]);

    const switchMonth = (month: string) => {
        setCurrentMonth(month);
    };

    const setBudget = async (amount: number) => {
        await Storage.saveBudget(currentMonth, amount);
        setMonthlyBudget(amount);
    };

    const addTransaction = async (transaction: Transaction, isRecurring: boolean = false) => {
        const transMonth = transaction.date.slice(0, 7);
        await Storage.saveTransaction(transMonth, transaction);

        if (isRecurring) {
            await Storage.saveRecurringRule({
                id: Date.now().toString(), // New ID for the rule
                amount: transaction.amount,
                category: transaction.category,
                note: transaction.note,
                type: transaction.type,
                dayOfMonth: new Date(transaction.date).getDate(),
                lastGeneratedMonth: transMonth // Mark as generated for this month
            });
        }

        if (transMonth === currentMonth) {
            await loadData();
        }
    };

    const updateTransaction = async (transaction: Transaction, oldDate?: string, isRecurring: boolean = false) => {
        const transMonth = transaction.date.slice(0, 7);
        let oldMonth = transMonth;
        if (oldDate) {
            oldMonth = oldDate.slice(0, 7);
        }

        // If month changed, remove from old month first
        if (oldMonth !== transMonth) {
            await Storage.deleteTransaction(oldMonth, transaction.id);
        }

        await Storage.saveTransaction(transMonth, transaction);

        if (isRecurring) {
            await Storage.saveRecurringRule({
                id: Date.now().toString(),
                amount: transaction.amount,
                category: transaction.category,
                note: transaction.note,
                type: transaction.type,
                dayOfMonth: new Date(transaction.date).getDate(),
                lastGeneratedMonth: transMonth
            });
        }

        // Reload if we touched the current month (either as old or new source)
        if (transMonth === currentMonth || oldMonth === currentMonth) {
            await loadData();
        }
    };

    const deleteTransaction = async (id: string) => {
        await Storage.deleteTransaction(currentMonth, id);
        await loadData();
    };

    const deleteRecurringRule = async (id: string, currentTransactionDate?: string) => {
        await Storage.deleteRecurringRule(id);
        if (currentTransactionDate) {
            await Storage.deleteFutureTransactionsForRule(id, currentTransactionDate);
            // If we deleted future transactions from CURRENT month, we must reload
            // Check if currentTransactionDate is in current month or before
            const transMonth = currentTransactionDate.slice(0, 7);
            if (transMonth <= currentMonth) {
                await loadData();
            }
        }
    };

    const clearAllData = async () => {
        await Storage.clearStorage();
        await loadData(); // Reload (should be empty)
    };

    const clearTransactions = async () => {
        await Storage.clearTransactions();
        await loadData();
    };

    // Category Logic
    const addCustomCategory = async (name: string) => {
        const trimmed = name.trim();
        if (!trimmed) return;

        // Prevent duplicates (simple check)
        const exists = customCategories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())
            || DEFAULT_CATEGORIES.some(c => c.toLowerCase() === trimmed.toLowerCase());

        if (exists) {
            Alert.alert('Error', 'Category already exists');
            return;
        }

        // Random color assignment from palette
        const randomColor = Colors.charts[Math.floor(Math.random() * Colors.charts.length)];

        const newCat: Category = {
            id: Date.now().toString(),
            name: trimmed,
            color: randomColor,
            icon: 'Default',
            isCustom: true
        };

        const newCustoms = [...customCategories, newCat];
        await Storage.saveCustomCategories(newCustoms);
        setCustomCategories(newCustoms);
    };

    const deleteCustomCategory = async (name: string) => {
        await Storage.deleteCustomCategories(name);
        const newCustoms = customCategories.filter(c => c.name !== name);
        setCustomCategories(newCustoms);
    };

    const getCategoryColor = (categoryName: string) => {
        // 1. Check default constants
        if (CategoryColors[categoryName]) return CategoryColors[categoryName];
        // 2. Check custom
        const custom = customCategories.find(c => c.name === categoryName);
        if (custom) return custom.color;
        // 3. Fallback
        return CategoryColors['Default'] || '#ccc';
    };

    const getCategoryIcon = (categoryName: string) => {
        // 1. Check default constants
        if (CategoryIcons[categoryName]) return CategoryIcons[categoryName];
        // 2. Custom categories use default Tag icon for now
        return CategoryIcons['Default'] || Tag;
    };

    const categories = [...DEFAULT_CATEGORIES, ...customCategories.map(c => c.name)];

    const totalSpent = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, curr) => acc + curr.amount, 0);

    const remainingBalance = monthlyBudget - totalSpent;

    return (
        <BudgetContext.Provider
            value={{
                transactions,
                recurringRules,
                currentMonth,
                loading,
                totalSpent,
                remainingBalance,
                monthlyBudget,

                categories,
                addCustomCategory,
                deleteCustomCategory,
                getCategoryColor,
                getCategoryIcon,

                switchMonth,
                addTransaction,
                updateTransaction,
                deleteTransaction,
                deleteRecurringRule,
                setBudget,
                clearAllData,
                clearTransactions,
                refresh: loadData
            }}
        >
            {children}
        </BudgetContext.Provider>
    );
};
