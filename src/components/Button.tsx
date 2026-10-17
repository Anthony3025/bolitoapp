import React from 'react';
import { Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { styled } from 'nativewind';

interface ButtonProps {
    onPress: () => void;
    title: string;
    variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'giant-blue' | 'giant-orange';
    loading?: boolean;
    disabled?: boolean;
    className?: string;
}

export default function Button({ onPress, title, variant = 'primary', loading, disabled, className }: ButtonProps) {

    const getBaseStyles = () => {
        switch (variant) {
            case 'primary': return 'bg-primary';
            case 'secondary': return 'bg-tech-card border border-gray-600';
            case 'danger': return 'bg-panic';
            case 'outline': return 'bg-transparent border border-primary';
            case 'giant-blue': return 'bg-primary h-40 justify-center items-center rounded-3xl';
            case 'giant-orange': return 'bg-orange-500 h-40 justify-center items-center rounded-3xl';
            default: return 'bg-primary';
        }
    };

    const getTextStyles = () => {
        switch (variant) {
            case 'outline': return 'text-primary';
            case 'giant-blue':
            case 'giant-orange': return 'text-white text-3xl font-bold uppercase tracking-wider';
            default: return 'text-white text-lg font-bold';
        }
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            className={`${getBaseStyles()} p-4 rounded-xl items-center flex-row justify-center ${disabled ? 'opacity-50' : ''} ${className}`}
        >
            {loading ? (
                <ActivityIndicator color="white" />
            ) : (
                <Text className={`${getTextStyles()}`}>{title}</Text>
            )}
        </TouchableOpacity>
    );
}
