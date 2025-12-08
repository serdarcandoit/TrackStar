import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction, RecurringTransaction } from '../types';
import { Storage } from '../utils/storage';
import { Alert } from 'react-native';

interface BudgetContextType {
    transactions: Transaction[];
    recurringRules: RecurringTransaction[];
    currentMonth: string; // "YYYY-MM"
    loading: boolean;
    totalSpent: number;
    remainingBalance: number;
    monthlyBudget: number;
    switchMonth: (month: string) => void;
    addTransaction: (transaction: Transaction, isRecurring?: boolean) => Promise<void>;
    updateTransaction: (transaction: Transaction) => Promise<void>;
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

    const loadData = async () => {
        try {
            setLoading(true);
            // Check for recurring transactions to generate before loading
            await Storage.processRecurringTransactions(currentMonth);

            const data = await Storage.getTransactions(currentMonth);
            const budget = await Storage.getBudget(currentMonth);
            const rules = await Storage.getRecurringRules();

            setTransactions(data);
            setMonthlyBudget(budget);
            setRecurringRules(rules);
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

    const updateTransaction = async (transaction: Transaction) => {
        const transMonth = transaction.date.slice(0, 7);
        await Storage.saveTransaction(transMonth, transaction);
        if (transMonth === currentMonth) {
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
