export type TransactionType = 'expense' | 'income';

export interface Category {
    id: string; // name is unique id for simplicity in this app context
    name: string;
    color: string;
    icon: string; // name of the lucide icon or 'default'
    isCustom: boolean;
}

export interface Transaction {
    id: string;
    amount: number;
    category: string;
    date: string; // ISO String
    note?: string;
    type: TransactionType;
    recurringRuleId?: string;
}

export interface MonthData {
    monthKey: string; // "YYYY-MM"
    transactions: Transaction[];
    income: number;
    expenses: number;
    budget?: number; // Optional monthly budget limit
}

export interface CategoryTotal {
    category: string;
    total: number;
    color: string;
    percentage: number;
}

export interface RecurringTransaction {
    id: string;
    amount: number;
    category: string;
    note?: string;
    type: TransactionType;
    dayOfMonth: number;
    lastGeneratedMonth: string; // "YYYY-MM"
}

export interface CryptoAsset {
    id: string;
    symbol: string; // e.g. 'bitcoin'
    name: string; // e.g. 'Bitcoin'
    amount: number;
    averageBuyPrice: number;
}
