import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Smartphone, RotateCw, Landmark, Lightbulb } from 'lucide-react-native';

const actions = [
    { id: '1', title: 'Recargar\nCrédito', icon: Smartphone, color: 'bg-blue-100', iconColor: '#0066cc' },
    { id: '2', title: 'Enviar a\nBolito', icon: RotateCw, color: 'bg-green-100', iconColor: '#00D68F' },
    { id: '3', title: 'Transf.\nBancaria', icon: Landmark, color: 'bg-purple-100', iconColor: '#7c3aed' },
    { id: '4', title: 'Pago de\nServicios', icon: Lightbulb, color: 'bg-orange-100', iconColor: '#ea580c' },
];

export default function QuickActions() {
    return (
        <View className="px-6 mt-6">
            <Text className="text-gray-700 font-bold text-lg mb-4">Servicios Rápidos</Text>
            <View className="flex-row flex-wrap justify-between">
                {actions.map((action) => (
                    <TouchableOpacity
                        key={action.id}
                        className="w-[22%] items-center mb-4"
                    >
                        <View className={`w-14 h-14 ${action.color} rounded-2xl items-center justify-center mb-2 shadow-sm`}>
                            <action.icon size={24} color={action.iconColor} />
                        </View>
                        <Text className="text-xs text-center text-gray-600 font-medium leading-tight">{action.title}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}
