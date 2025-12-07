import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, StyleProp, ViewStyle } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: StyleProp<ViewStyle>;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    containerStyle,
    style,
    ...props
}) => {
    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                style={[
                    styles.input,
                    error ? styles.inputError : null,
                    style
                ]}
                placeholderTextColor={Colors.textTertiary}
                {...props}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: Layout.spacing.md,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.textSecondary,
        marginBottom: Layout.spacing.xs,
    },
    input: {
        backgroundColor: Colors.background,
        borderRadius: Layout.borderRadius.md,
        paddingHorizontal: Layout.spacing.md,
        paddingVertical: 12, // Fixed height feel
        fontSize: 16,
        color: Colors.text,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    inputError: {
        borderColor: Colors.danger,
        backgroundColor: '#fff0f0'
    },
    errorText: {
        color: Colors.danger,
        fontSize: 12,
        marginTop: 4,
    }
});
