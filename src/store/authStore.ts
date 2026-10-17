import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { useCashierStore } from './cashierStore';

interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    hasCompletedKyc: boolean;
    user: { id: string; name: string; phone: string; email?: string; balance?: number } | null;
    session: Session | null;
    setSession: (session: Session | null) => Promise<void>;
    login: (name: string, phone: string, email?: string) => void;
    logout: () => Promise<void>;
    updateUser: (updates: Partial<{ name: string; phone: string; email: string }>) => void;
    setLoading: (loading: boolean) => void;
    setHasCompletedKyc: (completed: boolean) => void;
    initialize: () => Promise<void>;
    fetchProfile: (userId: string) => Promise<void>;
}



export const useAuthStore = create<AuthState>((set, get) => ({
    isAuthenticated: false,
    isLoading: true,
    hasCompletedKyc: false,
    user: null,
    session: null,


    fetchProfile: async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (data && !error) {
                set({
                    user: {
                        id: userId,
                        name: data.full_name || 'Usuario',
                        phone: data.phone || '',
                        balance: data.balance || 0,
                    },
                    hasCompletedKyc: data.kyc_verified || false,
                });

                // --- SINCRONIZACIÓN CON CASHIER STORE ---
                if (data.is_cashier) {
                    useCashierStore.getState().setRegistrationStatus('active');
                    // No forzamos isCashierMode = true para respetar la preferencia del usuario,
                    // pero aseguramos que el estatus de registro sea 'active'.
                } else {
                    // Si en la DB es false, reseteamos el estado local de registro y LIMPIAMOS FOTOS STALE
                    useCashierStore.getState().setRegistrationStatus('none');
                    useCashierStore.getState().setIsCashierMode(false);
                    useCashierStore.getState().updateBusinessData({
                        selfieUri: undefined,
                        idFrontUri: undefined,
                        idBackUri: undefined,
                        businessPhotoUri: undefined
                    });
                }
            } else if (error && error.code === 'PGRST116') {
                // Perfil no encontrado (Usuario eliminado en DB)
                console.log('Profile not found, logging out...');
                get().logout();
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        }
    },



    setSession: async (session) => {
        console.log('authStore: setSession called', { hasSession: !!session });
        if (session) {
            const user = session.user;
            console.log('authStore: session user', { id: user.id, email: user.email, phone: user.phone });

            set({
                session,
                isAuthenticated: true,
                user: {
                    id: user.id,
                    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
                    phone: user.user_metadata?.phone || user.phone || user.email?.split('@')[0] || '',

                    email: user.email,
                    balance: 0,
                },

                isLoading: true, // Mantener en true hasta cargar perfil real
            });
            // Fetch real data from profile table
            await get().fetchProfile(user.id);
            set({ isLoading: false }); // Fin de la carga
        } else {
            console.log('authStore: clearing session');
            set({ session: null, isAuthenticated: false, user: null, isLoading: false });
        }
    },

    login: (name, phone, email) => set({ isAuthenticated: true, user: { id: 'local', name, phone, email, balance: 0 } }),

    logout: async () => {
        console.log('authStore: logging out');
        await supabase.auth.signOut();
        set({ isAuthenticated: false, user: null, session: null });
    },

    updateUser: (updates) =>
        set((state) => ({
            user: state.user ? { ...state.user, ...updates } : null
        })),

    setLoading: (loading) => set({ isLoading: loading }),

    setHasCompletedKyc: (completed) => set({ hasCompletedKyc: completed }),


    initialize: async () => {
        console.log('authStore: initialize started');
        const { data: { session } } = await supabase.auth.getSession();
        await get().setSession(session);

        supabase.auth.onAuthStateChange(async (_event, session) => {
            console.log('authStore: onAuthStateChange event', _event);
            await get().setSession(session);
        });
    },
}));



