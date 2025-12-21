import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { format } from 'date-fns';

interface MonthPickerModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (date: Date) => void;
    currentDate: Date;
}

const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export default function MonthPickerModal({ visible, onClose, onSelect, currentDate }: MonthPickerModalProps) {
    const [year, setYear] = useState(currentDate.getFullYear());

    const handleMonthSelect = (monthIndex: number) => {
        const newDate = new Date(year, monthIndex, 1);
        onSelect(newDate);
        onClose();
    };

    const handlePrevYear = () => setYear(year - 1);
    const handleNextYear = () => setYear(year + 1);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContent}>
                            {/* Header */}
                            <View style={styles.header}>
                                <Text style={styles.title}>Select Month</Text>
                                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                    <X size={20} color={Colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            {/* Year Selector */}
                            <View style={styles.yearSelector}>
                                <TouchableOpacity onPress={handlePrevYear} style={styles.yearArrow}>
                                    <ChevronLeft size={24} color={Colors.text} />
                                </TouchableOpacity>
                                <Text style={styles.yearText}>{year}</Text>
                                <TouchableOpacity onPress={handleNextYear} style={styles.yearArrow}>
                                    <ChevronRight size={24} color={Colors.text} />
                                </TouchableOpacity>
                            </View>

                            {/* Month Grid */}
                            <View style={styles.monthGrid}>
                                {MONTHS.map((month, index) => {
                                    const isSelected = year === currentDate.getFullYear() && index === currentDate.getMonth();
                                    return (
                                        <TouchableOpacity
                                            key={month}
                                            style={[
                                                styles.monthButton,
                                                isSelected && styles.selectedMonthButton
                                            ]}
                                            onPress={() => handleMonthSelect(index)}
                                        >
                                            <Text style={[
                                                styles.monthText,
                                                isSelected && styles.selectedMonthText
                                            ]}>
                                                {month}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: Colors.background,
        borderRadius: 24,
        padding: 20,
        ...Layout.shadows.medium,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    closeButton: {
        padding: 4,
    },
    yearSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 10,
    },
    yearArrow: {
        padding: 8,
    },
    yearText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
    },
    monthGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    monthButton: {
        width: '30%',
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        marginBottom: 8,
    },
    selectedMonthButton: {
        backgroundColor: Colors.primary,
    },
    monthText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    selectedMonthText: {
        color: '#FFF',
    },
});
