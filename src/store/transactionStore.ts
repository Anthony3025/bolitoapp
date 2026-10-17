import { create } from 'zustand';

interface TransactionState {
    // Ya no guardamos el status globalmente porque causaba que todas las 
    // pantallas de detalle se sincronizaran erróneamente.
    // Ahora cada pantalla maneja su estado local.
    lastRefresh: number;
    triggerRefresh: () => void;
}

export const useTransactionStore = create<TransactionState>((set) => ({
    lastRefresh: Date.now(),
    triggerRefresh: () => set({ lastRefresh: Date.now() }),
}));
