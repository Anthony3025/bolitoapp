import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../store/authStore';

import WelcomeScreen from '../screens/WelcomeScreen';
import RegisterScreen from '../screens/RegisterScreen';
import LoginScreen from '../screens/LoginScreen';
import KYCScreen from '../screens/KYCScreen';
import MainTabNavigator from './MainTabNavigator';
import QRScannerScreen from '../screens/QRScannerScreen';
import MyQRScreen from '../screens/MyQRScreen';
import PaymentConfirmScreen from '../screens/PaymentConfirmScreen';
import CustomizeQRScreen from '../screens/CustomizeQRScreen';
import ProtectedOperationsScreen from '../screens/ProtectedOperationsScreen';
import SellerTransactionDetailScreen from '../screens/SellerTransactionDetailScreen';
import BuyerTransactionDetailScreen from '../screens/BuyerTransactionDetailScreen';
import CashierSetupScreen from '../screens/CashierSetupScreen';
import CashierBusinessHoursScreen from '../screens/CashierBusinessHoursScreen';
import LoadingScreen from '../screens/LoadingScreen';
import PointsMapScreen from '../screens/PointsMapScreen';
import CashierProcessScreen from '../screens/CashierProcessScreen';
import PointOperationSetupScreen from '../screens/PointOperationSetupScreen';
import CashierDashboardScreen from '../screens/CashierDashboardScreen';
import ATMTemporaryCodeScreen from '../screens/ATMTemporaryCodeScreen';
import BankCardAddScreen from '../screens/BankCardAddScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PersonalInfoScreen from '../screens/PersonalInfoScreen';
import CardsAccountsScreen from '../screens/CardsAccountsScreen';
import SecurityScreen from '../screens/SecurityScreen';
import NotificationsSettingsScreen from '../screens/NotificationsSettingsScreen';
import PreferencesScreen from '../screens/PreferencesScreen';
import HelpCenterScreen from '../screens/HelpCenterScreen';
import AddCardScreen from '../screens/AddCardScreen';
import AddAccountScreen from '../screens/AddAccountScreen';
import ChangePinScreen from '../screens/ChangePinScreen';
import SendMoneyScreen from '../screens/SendMoneyScreen';
import PayServicesScreen from '../screens/PayServicesScreen';
import PhoneRechargeScreen from '../screens/PhoneRechargeScreen';
import BankTransferScreen from '../screens/BankTransferScreen';
import TransactionHistoryScreen from '../screens/TransactionHistoryScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const isLoading = useAuthStore((state) => state.isLoading);
    const hasCompletedKyc = useAuthStore((state) => state.hasCompletedKyc);

    console.log('AppNavigator state:', { isAuthenticated, hasCompletedKyc, isLoading });

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* 1. Branch: Authenticated Users */}
            {isAuthenticated ? (
                hasCompletedKyc ? (
                    // Main App Flow
                    <>
                        <Stack.Screen name="Main" component={MainTabNavigator} />
                        <Stack.Screen name="QRScanner" component={QRScannerScreen} />
                        <Stack.Screen name="MyQR" component={MyQRScreen} />
                        <Stack.Screen name="PaymentConfirm" component={PaymentConfirmScreen} />
                        <Stack.Screen name="CustomizeQR" component={CustomizeQRScreen} />
                        <Stack.Screen name="ProtectedOperations" component={ProtectedOperationsScreen} />
                        <Stack.Screen name="SellerTransactionDetail" component={SellerTransactionDetailScreen} />
                        <Stack.Screen name="BuyerTransactionDetail" component={BuyerTransactionDetailScreen} />
                        <Stack.Screen name="CashierSetup" component={CashierSetupScreen} />
                        <Stack.Screen name="CashierBusinessHours" component={CashierBusinessHoursScreen} />
                        <Stack.Screen name="PointsMap" component={PointsMapScreen} />
                        <Stack.Screen name="CashierProcess" component={CashierProcessScreen} />
                        <Stack.Screen name="PointOperationSetup" component={PointOperationSetupScreen} />
                        <Stack.Screen name="CashierDashboard" component={CashierDashboardScreen} />
                        <Stack.Screen name="ATMTemporaryCode" component={ATMTemporaryCodeScreen} />
                        <Stack.Screen name="BankCardAdd" component={BankCardAddScreen} />
                        <Stack.Screen name="Profile" component={ProfileScreen} />
                        <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
                        <Stack.Screen name="CardsAccounts" component={CardsAccountsScreen} />
                        <Stack.Screen name="Security" component={SecurityScreen} />
                        <Stack.Screen name="NotificationsSettings" component={NotificationsSettingsScreen} />
                        <Stack.Screen name="Preferences" component={PreferencesScreen} />
                        <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
                        <Stack.Screen name="AddCard" component={AddCardScreen} />
                        <Stack.Screen name="AddAccount" component={AddAccountScreen} />
                        <Stack.Screen name="ChangePin" component={ChangePinScreen} />
                        <Stack.Screen name="SendMoney" component={SendMoneyScreen} />
                        <Stack.Screen name="PayServices" component={PayServicesScreen} />
                        <Stack.Screen name="PhoneRecharge" component={PhoneRechargeScreen} />
                        <Stack.Screen name="BankTransfer" component={BankTransferScreen} />
                        <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
                    </>
                ) : (
                    // Verification Flow for Authenticated users
                    <Stack.Screen name="KYC" component={KYCScreen} />
                )
            ) : (
                // 2. Branch: Unauthenticated Users
                <>
                    <Stack.Screen name="Welcome" component={WelcomeScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="KYC" component={KYCScreen} />
                </>
            )}
        </Stack.Navigator>
    );
}

