import { create } from 'zustand';

interface SettingsState {
    notifications: {
        push: boolean;
        email: boolean;
        transactions: boolean;
        offers: boolean;
    };
    language: 'es' | 'en';
    theme: 'light' | 'dark' | 'system';
    biometricsEnabled: boolean;
    twoFactorEnabled: boolean;

    toggleNotification: (key: keyof SettingsState['notifications']) => void;
    setLanguage: (lang: 'es' | 'en') => void;
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    toggleBiometrics: () => void;
    toggleTwoFactor: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
    notifications: {
        push: true,
        email: false,
        transactions: true,
        offers: false,
    },
    language: 'es',
    theme: 'system',
    biometricsEnabled: true,
    twoFactorEnabled: false,

    toggleNotification: (key) => set((state) => ({
        notifications: {
            ...state.notifications,
            [key]: !state.notifications[key]
        }
    })),
    setLanguage: (language) => set({ language }),
    setTheme: (theme) => set({ theme }),
    toggleBiometrics: () => set((state) => ({ biometricsEnabled: !state.biometricsEnabled })),
    toggleTwoFactor: () => set((state) => ({ twoFactorEnabled: !state.twoFactorEnabled })),
}));
