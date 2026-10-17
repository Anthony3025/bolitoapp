import React from 'react';
import { View } from 'react-native';
import Button from '../../components/Button';
import { useNavigation } from '@react-navigation/native';

export default function ActionButtons() {
    const navigation = useNavigation<any>();

    return (
        <View className="flex-row px-6 -mt-8 justify-between">
            <View className="w-[48%]">
                <Button
                    title="+ AGREGAR"
                    variant="giant-blue"
                    onPress={() => navigation.navigate('TransactionMethod')}
                    className="shadow-xl shadow-blue-900/30"
                />
            </View>
            <View className="w-[48%]">
                <Button
                    title="- RETIRAR"
                    variant="giant-orange"
                    onPress={() => navigation.navigate('Cashout')}
                    className="shadow-xl shadow-orange-900/30"
                />
            </View>
        </View>
    );
}
