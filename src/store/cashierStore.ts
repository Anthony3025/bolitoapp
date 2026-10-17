import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BusinessHours {
    day: string;
    enabled: boolean;
    open: string;
    close: string;
}

interface BusinessData {
    name: string;
    category: string;
    address: string;
    coords: { latitude: number; longitude: number };
    hours: BusinessHours[];
    selfieUri?: string;
    idFrontUri?: string;
    idBackUri?: string;
    businessPhotoUri?: string;
}

interface CashierState {
    isCashierMode: boolean;
    setIsCashierMode: (val: boolean) => void;
    registrationStatus: 'none' | 'pending' | 'active';
    setRegistrationStatus: (status: 'none' | 'pending' | 'active') => void;
    businessData: BusinessData;
    updateBusinessData: (data: Partial<BusinessData>) => void;
}

const defaultHours: BusinessHours[] = [
    { day: 'Lunes', enabled: true, open: '09:00', close: '18:00' },
    { day: 'Martes', enabled: true, open: '09:00', close: '18:00' },
    { day: 'Miércoles', enabled: true, open: '09:00', close: '18:00' },
    { day: 'Jueves', enabled: true, open: '09:00', close: '18:00' },
    { day: 'Viernes', enabled: true, open: '09:00', close: '18:00' },
    { day: 'Sábado', enabled: false, open: '09:00', close: '14:00' },
    { day: 'Domingo', enabled: false, open: '09:00', close: '14:00' },
];

export const useCashierStore = create<CashierState>()(
    persist(
        (set) => ({
            isCashierMode: false,
            setIsCashierMode: (val) => set({ isCashierMode: val }),
            registrationStatus: 'none',
            setRegistrationStatus: (status) => set({ registrationStatus: status }),
            businessData: {
                name: '',
                category: '',
                address: '',
                coords: { latitude: -16.5000, longitude: -68.1500 }, // La Paz default
                hours: defaultHours,
            },
            updateBusinessData: (data) => set((state) => ({
                businessData: { ...state.businessData, ...data }
            })),
        }),
        {
            name: 'cashier-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
