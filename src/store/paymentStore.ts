import { create } from 'zustand';

interface Card {
    id: string;
    type: string;
    brand: string;
    last4: string;
}

interface Account {
    id: string;
    bankName: string;
    accountType: string;
    accountNumber: string;
    accountHolder: string;
}

interface PaymentState {
    cards: Card[];
    accounts: Account[];
    addCard: (card: Omit<Card, 'id'>) => void;
    deleteCard: (id: string) => void;
    addAccount: (account: Omit<Account, 'id'>) => void;
    deleteAccount: (id: string) => void;
}

export const usePaymentStore = create<PaymentState>((set) => ({
    cards: [
        { id: '1', type: 'Visa', brand: 'Banco Union', last4: '4321' },
    ],
    accounts: [
        { id: '1', bankName: 'Banco Mercantil', accountType: 'Cuenta Ahorros', accountNumber: '...1092', accountHolder: 'Usuario Demo' },
    ],
    addCard: (card) => set((state) => ({
        cards: [...state.cards, { ...card, id: Math.random().toString(36).substr(2, 9) }]
    })),
    deleteCard: (id) => set((state) => ({
        cards: state.cards.filter((c) => c.id !== id)
    })),
    addAccount: (account) => set((state) => ({
        accounts: [...state.accounts, { ...account, id: Math.random().toString(36).substr(2, 9) }]
    })),
    deleteAccount: (id) => set((state) => ({
        accounts: state.accounts.filter((a) => a.id !== id)
    })),
}));
