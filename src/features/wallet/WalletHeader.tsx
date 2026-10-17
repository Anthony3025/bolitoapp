import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Eye, EyeOff, Bell, User } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';

export default function WalletHeader() {
    const user = useAuthStore((state) => state.user);
    const [showBalance, setShowBalance] = useState(true);

    return (
        <View className="bg-tech-dark pt-12 pb-6 px-6 rounded-b-3xl">
            {/* Top Row: Greeting & Icons */}
            <View className="flex-row justify-between items-center mb-6">
                <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-gray-700 rounded-full items-center justify-center mr-3">
                        <User size={20} color="white" />
                    </View>
                    <View>
                        <Text className="text-gray-400 text-xs">Hola,</Text>
                        <Text className="text-white font-bold text-lg">{user?.name || 'Bolitero'}</Text>
                    </View>
                </View>
                <TouchableOpacity className="relative">
                    <Bell size={24} color="white" />
                    <View className="absolute top-0 right-0 w-3 h-3 bg-panic rounded-full border-2 border-tech-dark" />
                </TouchableOpacity>
            </View>

            {/* Balance Section */}
            <View className="items-center">
                <View className="flex-row items-center mb-2">
                    <Text className="text-gray-400 mr-2">Saldo Disponible</Text>
                    <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
                        {showBalance ? <Eye size={18} color="#9ca3af" /> : <EyeOff size={18} color="#9ca3af" />}
                    </TouchableOpacity>
                </View>

                {showBalance ? (
                    <Text className="text-5xl font-bold text-white tracking-tighter">
                        Bs. <Text className="text-success">2.450</Text><Text className="text-2xl text-gray-400">.50</Text>
                    </Text>
                ) : (
                    <Text className="text-5xl font-bold text-gray-600 tracking-widest">••••••</Text>
                )}
            </View>
        </View>
    );
}
