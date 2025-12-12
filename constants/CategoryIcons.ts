// Basic icons for default categories
import { Utensils, Bus, ShoppingBag, Film, FileText, Heart, Wallet, Home, ShoppingCart, Coffee, MoreHorizontal, User, Tag, LucideIcon } from 'lucide-react-native';
import { Colors } from './Colors';

export const CategoryIcons: Record<string, LucideIcon> = {
    "Food": Utensils,
    "Transport": Bus,
    "Shopping": ShoppingBag,
    "Entertainment": Film,
    "Bills": FileText,
    "Health": Heart,
    //"Salary": Wallet, // REMOVED
    "Rent": Home,
    "Groceries": ShoppingCart,
    //"Dining Out": Coffee, // REMOVED
    "Other": MoreHorizontal,
    "Default": Tag // Fallback for custom
};

export const CategoryColors: Record<string, string> = {
    "Food": Colors.charts[0],
    "Transport": Colors.charts[1],
    "Shopping": Colors.charts[2],
    "Entertainment": Colors.charts[3],
    "Bills": Colors.charts[4],
    "Health": Colors.charts[0],
    //"Salary": Colors.success, // REMOVED
    "Rent": Colors.charts[1],
    "Groceries": Colors.charts[2],
    //"Dining Out": Colors.charts[3], // REMOVED
    "Other": Colors.textTertiary,
    "Default": Colors.textSecondary
};

export const DEFAULT_CATEGORIES = [
    "Food", "Transport", "Shopping", "Entertainment", "Bills", "Health", "Rent", "Groceries", "Other"
];
