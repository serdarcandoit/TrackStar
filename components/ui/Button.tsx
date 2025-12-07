import React from 'react';
import { Text, Pressable, StyleSheet, ActivityIndicator, ViewStyle, StyleProp, TextStyle } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

interface ButtonProps {
    onPress: () => void;
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    loading?: boolean;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    onPress,
    title,
    variant = 'primary',
    loading = false,
    disabled = false,
    style,
    textStyle,
    icon
}) => {
    const getBackgroundColor = () => {
        if (disabled) return Colors.textTertiary;
        switch (variant) {
            case 'secondary': return Colors.background;
            case 'outline': return 'transparent';
            case 'danger': return Colors.danger;
            default: return Colors.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return Colors.surface; // Or maybe a lighter gray
        switch (variant) {
            case 'secondary': return Colors.primary;
            case 'outline': return Colors.primary;
            default: return Colors.surface;
        }
    };

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled || loading}
            style={({ pressed }) => [
                styles.container,
                {
                    backgroundColor: getBackgroundColor(),
                    opacity: pressed ? 0.8 : 1,
                    borderColor: variant === 'outline' ? Colors.primary : 'transparent',
                    borderWidth: variant === 'outline' ? 1 : 0
                },
                style
            ]}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <>
                    {icon}
                    <Text style={[
                        styles.text,
                        { color: getTextColor(), marginLeft: icon ? 8 : 0 },
                        textStyle
                    ]}>
                        {title}
                    </Text>
                </>
            )}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 50,
        borderRadius: Layout.borderRadius.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Layout.spacing.lg,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
    }
});
