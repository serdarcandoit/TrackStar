import { Utensils, Bus, ShoppingBag, Film, FileText, Heart, Wallet, Home, ShoppingCart, Coffee, MoreHorizontal, LucideIcon } from 'lucide-react-native';
import { Colors } from './Colors';

export const CategoryIcons: Record<string, LucideIcon> = {
    "Food": Utensils,
    "Transport": Bus,
    "Shopping": ShoppingBag,
    "Entertainment": Film,
    "Bills": FileText,
    "Health": Heart,
    "Salary": Wallet,
    "Rent": Home,
    "Groceries": ShoppingCart,
    "Dining Out": Coffee,
    "Other": MoreHorizontal
};

export const CategoryColors: Record<string, string> = {
    "Food": Colors.charts[0],
    "Transport": Colors.charts[1],
    "Shopping": Colors.charts[2],
    "Entertainment": Colors.charts[3],
    "Bills": Colors.charts[4],
    "Health": Colors.charts[0], // Cycle if needed
    "Salary": Colors.success,
    "Rent": Colors.charts[1],
    "Groceries": Colors.charts[2],
    "Dining Out": Colors.charts[3],
    "Other": Colors.textTertiary
};
