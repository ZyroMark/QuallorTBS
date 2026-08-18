"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

/**
 * Safety, sharing and app preferences.
 *
 * Everything is stored per user id so a passenger, a driver and an operator
 * signed in on the same device keep their own emergency contacts and settings.
 */

export interface TrustedContact {
    id: string;
    name: string;
    phone: string;
    relationship: string;
    /** Whether this person receives live trip location. */
    canSeeLocation: boolean;
}

export interface SafetySettings {
    sosEnabled: boolean;
    /** Seconds the SOS button holds before it fires, so a misfire can be cancelled. */
    sosCountdown: number;
    sosCallsEmergencyServices: boolean;
    shareTripAutomatically: boolean;
    shareRouteDeviations: boolean;
    biometricEnabled: boolean;
    passwordChangedAt: string | null;
}

export interface AppPreferences {
    pushNotifications: boolean;
    smsNotifications: boolean;
    tripReminders: boolean;
    language: "English" | "isiXhosa" | "Afrikaans";
    reduceMotion: boolean;
}

export interface SosEvent {
    id: string;
    triggeredAt: string;
    location: string;
    notified: string[];
    resolved: boolean;
}

export interface PaymentMethod {
    id: string;
    kind: "card" | "cash";
    label: string;
    /** Last four digits for a card, blank for cash. */
    last4: string;
    isDefault: boolean;
}

export interface WalletTransaction {
    id: string;
    at: string;
    description: string;
    /** Positive for a top up, negative for a fare. */
    amount: number;
    method: string;
}

export interface Wallet {
    balance: number;
    methods: PaymentMethod[];
    transactions: WalletTransaction[];
}

/** An approved route this operator runs. */
export interface OperatorRoute {
    id: string;
    from: string;
    to: string;
    fare: number;
    active: boolean;
}

export interface DriverInvite {
    id: string;
    name: string;
    phone: string;
    sentAt: string;
    status: "invited" | "joined";
}

export interface OperatorSettings {
    /** Trading details shown to passengers and on invoices. */
    tradingName: string;
    registrationNumber: string;
    vatNumber: string;
    contactEmail: string;
    contactPhone: string;
    operatingRegion: string;

    routes: OperatorRoute[];

    /**
     * Payout destination. Only the bank and the last four digits are kept here:
     * the full account number is held by the payment provider, never in the app.
     */
    payout: { bankName: string; accountLast4: string; accountHolder: string; schedule: "daily" | "weekly" | "monthly" };

    policies: {
        maxSpeed: number;
        nightDriving: boolean;
        sosAutoEscalate: boolean;
        seatbeltCheckRequired: boolean;
        maxShiftHours: number;
    };

    notifications: {
        dailyDigest: boolean;
        incidentAlerts: boolean;
        complianceAlerts: boolean;
        payoutAlerts: boolean;
    };

    driverInvites: DriverInvite[];
}

interface SettingsState {
    contacts: TrustedContact[];
    safety: SafetySettings;
    preferences: AppPreferences;
    sosHistory: SosEvent[];
    wallet: Wallet;
    operator: OperatorSettings;
}

const DEFAULT_SAFETY: SafetySettings = {
    sosEnabled: true,
    sosCountdown: 5,
    sosCallsEmergencyServices: false,
    shareTripAutomatically: false,
    shareRouteDeviations: true,
    biometricEnabled: false,
    passwordChangedAt: null,
};

const DEFAULT_PREFERENCES: AppPreferences = {
    pushNotifications: true,
    smsNotifications: true,
    tripReminders: true,
    language: "English",
    reduceMotion: false,
};

const DEFAULT_WALLET: Wallet = {
    balance: 142.5,
    methods: [{ id: "PM-CASH", kind: "cash", label: "Cash on board", last4: "", isDefault: true }],
    transactions: [],
};

const DEFAULT_OPERATOR: OperatorSettings = {
    tradingName: "",
    registrationNumber: "",
    vatNumber: "",
    contactEmail: "",
    contactPhone: "",
    operatingRegion: "Buffalo City Metro",
    routes: [
        { id: "RT-1", from: "Beacon Bay", to: "Mdantsane", fare: 22, active: true },
        { id: "RT-2", from: "East London", to: "King William's Town", fare: 60, active: true },
    ],
    payout: { bankName: "", accountLast4: "", accountHolder: "", schedule: "weekly" },
    policies: {
        maxSpeed: 100,
        nightDriving: true,
        sosAutoEscalate: true,
        seatbeltCheckRequired: true,
        maxShiftHours: 12,
    },
    notifications: {
        dailyDigest: true,
        incidentAlerts: true,
        complianceAlerts: true,
        payoutAlerts: true,
    },
    driverInvites: [],
};

const DEFAULT_STATE: SettingsState = {
    contacts: [],
    safety: DEFAULT_SAFETY,
    preferences: DEFAULT_PREFERENCES,
    sosHistory: [],
    wallet: DEFAULT_WALLET,
    operator: DEFAULT_OPERATOR,
};

interface SettingsContextType extends SettingsState {
    addContact: (c: Omit<TrustedContact, "id">) => void;
    updateContact: (id: string, patch: Partial<TrustedContact>) => void;
    removeContact: (id: string) => void;
    updateSafety: (patch: Partial<SafetySettings>) => void;
    updatePreferences: (patch: Partial<AppPreferences>) => void;
    triggerSos: (location: string) => SosEvent;
    resolveSos: (id: string) => void;
    topUp: (amount: number, method: string) => void;
    chargeWallet: (amount: number, description: string) => boolean;
    addPaymentMethod: (m: Omit<PaymentMethod, "id">) => void;
    removePaymentMethod: (id: string) => void;
    setDefaultPaymentMethod: (id: string) => void;
    updateOperator: (patch: Partial<OperatorSettings>) => void;
    addRoute: (r: Omit<OperatorRoute, "id">) => void;
    updateRoute: (id: string, patch: Partial<OperatorRoute>) => void;
    removeRoute: (id: string) => void;
    inviteDriver: (name: string, phone: string) => DriverInvite;
    /** How many of the recommended safety steps are done, out of the total. */
    checkupScore: () => { done: number; total: number; items: { label: string; done: boolean; href?: string }[] };
}

const SettingsContext = createContext<SettingsContextType | null>(null);

const STORAGE_KEY = "quallor_settings";

function readAll(): Record<string, SettingsState> {
    if (typeof window === "undefined") return {};
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
        return {};
    }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    // The settings provider sits above AuthContext in some trees, so it reads the
    // current user id straight from storage rather than through the auth hook.
    const [userKey, setUserKey] = useState<string>("guest");
    const [state, setState] = useState<SettingsState>(DEFAULT_STATE);

    useEffect(() => {
        function load() {
            let key = "guest";
            try {
                const raw = localStorage.getItem("quallor_current_user");
                if (raw) key = JSON.parse(raw).id || "guest";
            } catch {
                key = "guest";
            }
            setUserKey(key);
            const all = readAll();
            const stored = all[key] ?? {};
            // Merge one level deep so a record written before a field existed
            // still picks up the new defaults instead of rendering undefined.
            setState({
                ...DEFAULT_STATE,
                ...stored,
                safety: { ...DEFAULT_SAFETY, ...(stored.safety ?? {}) },
                preferences: { ...DEFAULT_PREFERENCES, ...(stored.preferences ?? {}) },
                wallet: { ...DEFAULT_WALLET, ...(stored.wallet ?? {}) },
                operator: { ...DEFAULT_OPERATOR, ...(stored.operator ?? {}) },
            });
        }
        load();
        window.addEventListener("storage", load);
        return () => window.removeEventListener("storage", load);
    }, []);

    function persist(next: SettingsState) {
        setState(next);
        const all = readAll();
        all[userKey] = next;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    }

    function addContact(c: Omit<TrustedContact, "id">) {
        persist({
            ...state,
            contacts: [...state.contacts, { ...c, id: `TC-${Date.now()}` }],
        });
    }

    function updateContact(id: string, patch: Partial<TrustedContact>) {
        persist({
            ...state,
            contacts: state.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        });
    }

    function removeContact(id: string) {
        persist({ ...state, contacts: state.contacts.filter((c) => c.id !== id) });
    }

    function updateSafety(patch: Partial<SafetySettings>) {
        persist({ ...state, safety: { ...state.safety, ...patch } });
    }

    function updatePreferences(patch: Partial<AppPreferences>) {
        persist({ ...state, preferences: { ...state.preferences, ...patch } });
    }

    function triggerSos(location: string): SosEvent {
        const event: SosEvent = {
            id: `SOS-${Date.now()}`,
            triggeredAt: new Date().toISOString(),
            location,
            notified: state.contacts.filter((c) => c.canSeeLocation).map((c) => c.name),
            resolved: false,
        };
        persist({ ...state, sosHistory: [event, ...state.sosHistory].slice(0, 20) });
        return event;
    }

    function resolveSos(id: string) {
        persist({
            ...state,
            sosHistory: state.sosHistory.map((e) => (e.id === id ? { ...e, resolved: true } : e)),
        });
    }

    function pushTransaction(w: Wallet, tx: Omit<WalletTransaction, "id" | "at">): Wallet {
        return {
            ...w,
            transactions: [
                { ...tx, id: `TX-${Date.now().toString(36).toUpperCase()}`, at: new Date().toISOString() },
                ...w.transactions,
            ].slice(0, 50),
        };
    }

    function topUp(amount: number, method: string) {
        const w = pushTransaction(state.wallet, { description: "Top up", amount, method });
        persist({ ...state, wallet: { ...w, balance: Number((state.wallet.balance + amount).toFixed(2)) } });
    }

    /** Returns false when there is not enough credit, leaving the balance untouched. */
    function chargeWallet(amount: number, description: string): boolean {
        if (state.wallet.balance < amount) return false;
        const w = pushTransaction(state.wallet, { description, amount: -amount, method: "Quallor credits" });
        persist({ ...state, wallet: { ...w, balance: Number((state.wallet.balance - amount).toFixed(2)) } });
        return true;
    }

    function addPaymentMethod(m: Omit<PaymentMethod, "id">) {
        const method: PaymentMethod = { ...m, id: `PM-${Date.now().toString(36).toUpperCase()}` };
        const methods = m.isDefault
            ? [...state.wallet.methods.map((x) => ({ ...x, isDefault: false })), method]
            : [...state.wallet.methods, method];
        persist({ ...state, wallet: { ...state.wallet, methods } });
    }

    function removePaymentMethod(id: string) {
        persist({ ...state, wallet: { ...state.wallet, methods: state.wallet.methods.filter((m) => m.id !== id) } });
    }

    function setDefaultPaymentMethod(id: string) {
        persist({
            ...state,
            wallet: { ...state.wallet, methods: state.wallet.methods.map((m) => ({ ...m, isDefault: m.id === id })) },
        });
    }

    function updateOperator(patch: Partial<OperatorSettings>) {
        persist({ ...state, operator: { ...state.operator, ...patch } });
    }

    function addRoute(r: Omit<OperatorRoute, "id">) {
        const route: OperatorRoute = { ...r, id: `RT-${Date.now().toString(36).toUpperCase()}` };
        updateOperator({ routes: [...state.operator.routes, route] });
    }

    function updateRoute(id: string, patch: Partial<OperatorRoute>) {
        updateOperator({ routes: state.operator.routes.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
    }

    function removeRoute(id: string) {
        updateOperator({ routes: state.operator.routes.filter((r) => r.id !== id) });
    }

    function inviteDriver(name: string, phone: string): DriverInvite {
        const invite: DriverInvite = {
            id: `INV-${Date.now().toString(36).toUpperCase()}`,
            name,
            phone,
            sentAt: new Date().toISOString(),
            status: "invited",
        };
        updateOperator({ driverInvites: [invite, ...state.operator.driverInvites] });
        return invite;
    }

    function checkupScore() {
        const items = [
            { label: "Emergency SOS is switched on",        done: state.safety.sosEnabled,                    href: "/safety/sos" },
            { label: "At least one trusted contact added",  done: state.contacts.length > 0,                  href: "/safety/contacts" },
            { label: "A contact can see your live trip",    done: state.contacts.some((c) => c.canSeeLocation), href: "/safety/contacts" },
            { label: "Trip sharing preference reviewed",    done: state.safety.shareTripAutomatically || state.safety.shareRouteDeviations, href: "/safety/sharing" },
            { label: "Password changed in the last year",   done: Boolean(state.safety.passwordChangedAt),    href: "/safety/password" },
        ];
        return { done: items.filter((i) => i.done).length, total: items.length, items };
    }

    return (
        <SettingsContext.Provider
            value={{
                ...state,
                addContact,
                updateContact,
                removeContact,
                updateSafety,
                updatePreferences,
                triggerSos,
                resolveSos,
                topUp,
                chargeWallet,
                addPaymentMethod,
                removePaymentMethod,
                setDefaultPaymentMethod,
                updateOperator,
                addRoute,
                updateRoute,
                removeRoute,
                inviteDriver,
                checkupScore,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const ctx = useContext(SettingsContext);
    if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
    return ctx;
}
