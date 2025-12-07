import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction } from '../types';
import { Storage } from '../utils/storage';
import { Alert } from 'react-native';

interface BudgetContextType {
    transactions: Transaction[];
    currentMonth: string; // "YYYY-MM"
    loading: boolean;
    totalSpent: number;
    remainingBalance: number;
    monthlyBudget: number;
    switchMonth: (month: string) => void;
    addTransaction: (transaction: Transaction) => Promise<void>;
    updateTransaction: (transaction: Transaction) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
    setBudget: (amount: number) => Promise<void>;
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
    const [loading, setLoading] = useState<boolean>(true);
    const [monthlyBudget, setMonthlyBudget] = useState<number>(5000);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await Storage.getTransactions(currentMonth);
            const budget = await Storage.getBudget(currentMonth);
            setTransactions(data);
            setMonthlyBudget(budget);
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

    const addTransaction = async (transaction: Transaction) => {
        const transMonth = transaction.date.slice(0, 7);
        await Storage.saveTransaction(transMonth, transaction);
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

    const totalSpent = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, curr) => acc + curr.amount, 0);

    const remainingBalance = monthlyBudget - totalSpent;

    return (
        <BudgetContext.Provider
            value={{
                transactions,
                currentMonth,
                loading,
                totalSpent,
                remainingBalance,
                monthlyBudget,
                switchMonth,
                addTransaction,
                updateTransaction,
                deleteTransaction,
                setBudget,
                refresh: loadData
            }}
        >
            {children}
        </BudgetContext.Provider>
    );
};
