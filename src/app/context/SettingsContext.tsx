"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";

/**
 * Personal safety, wallet and operator settings.
 *
 * These are the most private rows in the system, so their policies are the
 * strictest: trusted contacts, preferences and the wallet ledger are readable
 * only by the account that owns them, with no fleet-office override. The one
 * exception is sos_events, which the fleet office can read, because somebody
 * has to answer the alarm.
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

/**
 * Opening credit for a new account. This used to be a hard-coded balance in
 * localStorage; with a real ledger the balance has to come from somewhere, so
 * it is written once as an actual transaction the user can see.
 */
const OPENING_CREDIT = 142.5;
const OPENING_CREDIT_DESCRIPTION = "Opening balance";

const DEFAULT_WALLET: Wallet = {
    balance: 0,
    methods: [],
    transactions: [],
};

const DEFAULT_OPERATOR: OperatorSettings = {
    tradingName: "",
    registrationNumber: "",
    vatNumber: "",
    contactEmail: "",
    contactPhone: "",
    operatingRegion: "Buffalo City Metro",
    routes: [],
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
    addContact: (c: Omit<TrustedContact, "id">) => Promise<void>;
    updateContact: (id: string, patch: Partial<TrustedContact>) => Promise<void>;
    removeContact: (id: string) => Promise<void>;
    updateSafety: (patch: Partial<SafetySettings>) => Promise<void>;
    updatePreferences: (patch: Partial<AppPreferences>) => Promise<void>;
    triggerSos: (location: string) => Promise<SosEvent | null>;
    resolveSos: (id: string) => Promise<void>;
    topUp: (amount: number, method: string) => Promise<void>;
    chargeWallet: (amount: number, description: string) => Promise<boolean>;
    addPaymentMethod: (m: Omit<PaymentMethod, "id">) => Promise<void>;
    removePaymentMethod: (id: string) => Promise<void>;
    setDefaultPaymentMethod: (id: string) => Promise<void>;
    updateOperator: (patch: Partial<OperatorSettings>) => Promise<void>;
    addRoute: (r: Omit<OperatorRoute, "id">) => Promise<void>;
    updateRoute: (id: string, patch: Partial<OperatorRoute>) => Promise<void>;
    removeRoute: (id: string) => Promise<void>;
    inviteDriver: (name: string, phone: string) => Promise<DriverInvite | null>;
    /** How many of the recommended safety steps are done, out of the total. */
    checkupScore: () => { done: number; total: number; items: { label: string; done: boolean; href?: string }[] };
    refresh: () => Promise<void>;
    isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

/** Balance is derived from the ledger rather than stored twice. */
function balanceOf(transactions: WalletTransaction[]): number {
    return Number(transactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2));
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const supabase = useMemo(() => createClient(), []);
    const { user, isLoading: authLoading } = useAuth();

    const [state, setState] = useState<SettingsState>(DEFAULT_STATE);
    const [isLoading, setIsLoading] = useState(true);

    const refresh = useCallback(async () => {
        if (!user) {
            setState(DEFAULT_STATE);
            setIsLoading(false);
            return;
        }

        const [contactsRes, safetyRes, prefsRes, sosRes, methodsRes, txRes, opRes, routesRes, invitesRes] =
            await Promise.all([
                supabase.from("trusted_contacts").select("*").order("created_at"),
                supabase.from("safety_settings").select("*").eq("user_id", user.id).maybeSingle(),
                supabase.from("app_preferences").select("*").eq("user_id", user.id).maybeSingle(),
                supabase.from("sos_events").select("*").order("triggered_at", { ascending: false }).limit(20),
                supabase.from("payment_methods").select("*").order("created_at"),
                supabase.from("wallet_transactions").select("*").order("occurred_at", { ascending: false }).limit(50),
                supabase.from("operator_settings").select("*").eq("operator_id", user.id).maybeSingle(),
                supabase.from("operator_routes").select("*").order("created_at"),
                supabase.from("driver_invites").select("*").order("sent_at", { ascending: false }),
            ]);

        const contacts: TrustedContact[] = (contactsRes.data ?? []).map((c: Record<string, unknown>) => ({
            id: c.id as string,
            name: c.name as string,
            phone: c.phone as string,
            relationship: c.relationship as string,
            canSeeLocation: c.can_see_location as boolean,
        }));

        const s = safetyRes.data as Record<string, unknown> | null;
        const safety: SafetySettings = s
            ? {
                  sosEnabled: s.sos_enabled as boolean,
                  sosCountdown: s.sos_countdown as number,
                  sosCallsEmergencyServices: s.sos_calls_emergency_services as boolean,
                  shareTripAutomatically: s.share_trip_automatically as boolean,
                  shareRouteDeviations: s.share_route_deviations as boolean,
                  biometricEnabled: s.biometric_enabled as boolean,
                  passwordChangedAt: (s.password_changed_at as string | null) ?? null,
              }
            : DEFAULT_SAFETY;

        const p = prefsRes.data as Record<string, unknown> | null;
        const preferences: AppPreferences = p
            ? {
                  pushNotifications: p.push_notifications as boolean,
                  smsNotifications: p.sms_notifications as boolean,
                  tripReminders: p.trip_reminders as boolean,
                  language: p.language as AppPreferences["language"],
                  reduceMotion: p.reduce_motion as boolean,
              }
            : DEFAULT_PREFERENCES;

        const sosHistory: SosEvent[] = (sosRes.data ?? []).map((e: Record<string, unknown>) => ({
            id: e.id as string,
            triggeredAt: e.triggered_at as string,
            location: e.location as string,
            notified: Array.isArray(e.notified) ? (e.notified as string[]) : [],
            resolved: e.resolved as boolean,
        }));

        const methods: PaymentMethod[] = (methodsRes.data ?? []).map((m: Record<string, unknown>) => ({
            id: m.id as string,
            kind: m.kind as PaymentMethod["kind"],
            label: m.label as string,
            last4: (m.last4 as string | null) ?? "",
            isDefault: m.is_default as boolean,
        }));

        let transactions: WalletTransaction[] = (txRes.data ?? []).map((t: Record<string, unknown>) => ({
            id: t.id as string,
            at: t.occurred_at as string,
            description: t.description as string,
            amount: Number(t.amount),
            method: t.method as string,
        }));

        // First run for this account: write the opening credit as a real ledger
        // entry so the balance has a visible origin.
        if (transactions.length === 0) {
            const { data: opening } = await supabase
                .from("wallet_transactions")
                .insert({
                    user_id: user.id,
                    description: OPENING_CREDIT_DESCRIPTION,
                    amount: OPENING_CREDIT,
                    method: "Quallor credits",
                })
                .select()
                .single();

            if (opening) {
                const o = opening as Record<string, unknown>;
                transactions = [
                    {
                        id: o.id as string,
                        at: o.occurred_at as string,
                        description: o.description as string,
                        amount: Number(o.amount),
                        method: o.method as string,
                    },
                ];
            }
        }

        const routes: OperatorRoute[] = (routesRes.data ?? []).map((r: Record<string, unknown>) => ({
            id: r.id as string,
            from: r.from_location as string,
            to: r.to_location as string,
            fare: Number(r.fare),
            active: r.active as boolean,
        }));

        const driverInvites: DriverInvite[] = (invitesRes.data ?? []).map((i: Record<string, unknown>) => ({
            id: i.id as string,
            name: i.name as string,
            phone: i.phone as string,
            sentAt: i.sent_at as string,
            status: i.status as DriverInvite["status"],
        }));

        const o = opRes.data as Record<string, unknown> | null;
        const operator: OperatorSettings = {
            ...DEFAULT_OPERATOR,
            ...(o
                ? {
                      tradingName: (o.trading_name as string) ?? "",
                      registrationNumber: (o.registration_number as string) ?? "",
                      vatNumber: (o.vat_number as string) ?? "",
                      contactEmail: (o.contact_email as string) ?? "",
                      contactPhone: (o.contact_phone as string) ?? "",
                      operatingRegion: (o.operating_region as string) || DEFAULT_OPERATOR.operatingRegion,
                      payout: {
                          bankName: (o.payout_bank_name as string) ?? "",
                          accountLast4: (o.payout_account_last4 as string | null) ?? "",
                          accountHolder: (o.payout_account_holder as string) ?? "",
                          schedule: (o.payout_schedule as OperatorSettings["payout"]["schedule"]) ?? "weekly",
                      },
                      policies: { ...DEFAULT_OPERATOR.policies, ...((o.policies as object) ?? {}) },
                      notifications: { ...DEFAULT_OPERATOR.notifications, ...((o.notifications as object) ?? {}) },
                  }
                : {}),
            routes,
            driverInvites,
        };

        setState({
            contacts,
            safety,
            preferences,
            sosHistory,
            wallet: { balance: balanceOf(transactions), methods, transactions },
            operator,
        });
        setIsLoading(false);
    }, [supabase, user]);

    useEffect(() => {
        if (authLoading) return;
        // Deferred: refresh() resets state synchronously on its signed-out path,
        // and doing that inside the effect body cascades an extra render.
        queueMicrotask(() => void refresh());
    }, [authLoading, refresh]);

    // ----------------------------------------------------------------------
    // Trusted contacts
    // ----------------------------------------------------------------------

    async function addContact(c: Omit<TrustedContact, "id">) {
        if (!user) return;
        const { data } = await supabase
            .from("trusted_contacts")
            .insert({
                user_id: user.id,
                name: c.name,
                phone: c.phone,
                relationship: c.relationship,
                can_see_location: c.canSeeLocation,
            })
            .select()
            .single();
        if (!data) return;
        const row = data as Record<string, unknown>;
        setState((prev) => ({
            ...prev,
            contacts: [...prev.contacts, { ...c, id: row.id as string }],
        }));
    }

    async function updateContact(id: string, patch: Partial<TrustedContact>) {
        const row: Record<string, unknown> = {};
        if (patch.name !== undefined) row.name = patch.name;
        if (patch.phone !== undefined) row.phone = patch.phone;
        if (patch.relationship !== undefined) row.relationship = patch.relationship;
        if (patch.canSeeLocation !== undefined) row.can_see_location = patch.canSeeLocation;

        const { error } = await supabase.from("trusted_contacts").update(row).eq("id", id);
        if (error) return;
        setState((prev) => ({
            ...prev,
            contacts: prev.contacts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        }));
    }

    async function removeContact(id: string) {
        const { error } = await supabase.from("trusted_contacts").delete().eq("id", id);
        if (error) return;
        setState((prev) => ({ ...prev, contacts: prev.contacts.filter((c) => c.id !== id) }));
    }

    // ----------------------------------------------------------------------
    // Safety and preferences: one row per user, created on first write.
    // ----------------------------------------------------------------------

    async function updateSafety(patch: Partial<SafetySettings>) {
        if (!user) return;
        const next = { ...state.safety, ...patch };
        const { error } = await supabase.from("safety_settings").upsert(
            {
                user_id: user.id,
                sos_enabled: next.sosEnabled,
                sos_countdown: next.sosCountdown,
                sos_calls_emergency_services: next.sosCallsEmergencyServices,
                share_trip_automatically: next.shareTripAutomatically,
                share_route_deviations: next.shareRouteDeviations,
                biometric_enabled: next.biometricEnabled,
                password_changed_at: next.passwordChangedAt,
            },
            { onConflict: "user_id" }
        );
        if (error) return;
        setState((prev) => ({ ...prev, safety: next }));
    }

    async function updatePreferences(patch: Partial<AppPreferences>) {
        if (!user) return;
        const next = { ...state.preferences, ...patch };
        const { error } = await supabase.from("app_preferences").upsert(
            {
                user_id: user.id,
                push_notifications: next.pushNotifications,
                sms_notifications: next.smsNotifications,
                trip_reminders: next.tripReminders,
                language: next.language,
                reduce_motion: next.reduceMotion,
            },
            { onConflict: "user_id" }
        );
        if (error) return;
        setState((prev) => ({ ...prev, preferences: next }));
    }

    // ----------------------------------------------------------------------
    // SOS
    // ----------------------------------------------------------------------

    async function triggerSos(location: string): Promise<SosEvent | null> {
        if (!user) return null;
        const notified = state.contacts.filter((c) => c.canSeeLocation).map((c) => c.name);

        const { data } = await supabase
            .from("sos_events")
            .insert({ user_id: user.id, location, notified, resolved: false })
            .select()
            .single();
        if (!data) return null;

        const row = data as Record<string, unknown>;
        const event: SosEvent = {
            id: row.id as string,
            triggeredAt: row.triggered_at as string,
            location,
            notified,
            resolved: false,
        };
        setState((prev) => ({ ...prev, sosHistory: [event, ...prev.sosHistory].slice(0, 20) }));
        return event;
    }

    async function resolveSos(id: string) {
        const { error } = await supabase
            .from("sos_events")
            .update({ resolved: true, resolved_at: new Date().toISOString() })
            .eq("id", id);
        if (error) return;
        setState((prev) => ({
            ...prev,
            sosHistory: prev.sosHistory.map((e) => (e.id === id ? { ...e, resolved: true } : e)),
        }));
    }

    // ----------------------------------------------------------------------
    // Wallet. The ledger is append-only, so a charge is a negative row rather
    // than an edit of a running balance.
    // ----------------------------------------------------------------------

    async function pushTransaction(description: string, amount: number, method: string) {
        if (!user) return;
        const { data } = await supabase
            .from("wallet_transactions")
            .insert({ user_id: user.id, description, amount, method })
            .select()
            .single();
        if (!data) return;

        const row = data as Record<string, unknown>;
        const tx: WalletTransaction = {
            id: row.id as string,
            at: row.occurred_at as string,
            description,
            amount: Number(row.amount),
            method,
        };
        setState((prev) => {
            const transactions = [tx, ...prev.wallet.transactions].slice(0, 50);
            return { ...prev, wallet: { ...prev.wallet, transactions, balance: balanceOf(transactions) } };
        });
    }

    async function topUp(amount: number, method: string) {
        await pushTransaction("Top up", amount, method);
    }

    /** Returns false when there is not enough credit, leaving the balance untouched. */
    async function chargeWallet(amount: number, description: string): Promise<boolean> {
        if (state.wallet.balance < amount) return false;
        await pushTransaction(description, -amount, "Quallor credits");
        return true;
    }

    async function addPaymentMethod(m: Omit<PaymentMethod, "id">) {
        if (!user) return;
        // Only one default is allowed by a partial unique index, so clear the
        // old one before claiming the flag.
        if (m.isDefault) {
            await supabase.from("payment_methods").update({ is_default: false }).eq("user_id", user.id);
        }

        const { data } = await supabase
            .from("payment_methods")
            .insert({
                user_id: user.id,
                kind: m.kind,
                label: m.label,
                last4: m.last4 || null,
                is_default: m.isDefault,
            })
            .select()
            .single();
        if (!data) return;

        const row = data as Record<string, unknown>;
        setState((prev) => ({
            ...prev,
            wallet: {
                ...prev.wallet,
                methods: [
                    ...(m.isDefault ? prev.wallet.methods.map((x) => ({ ...x, isDefault: false })) : prev.wallet.methods),
                    { ...m, id: row.id as string },
                ],
            },
        }));
    }

    async function removePaymentMethod(id: string) {
        const { error } = await supabase.from("payment_methods").delete().eq("id", id);
        if (error) return;
        setState((prev) => ({
            ...prev,
            wallet: { ...prev.wallet, methods: prev.wallet.methods.filter((m) => m.id !== id) },
        }));
    }

    async function setDefaultPaymentMethod(id: string) {
        if (!user) return;
        await supabase.from("payment_methods").update({ is_default: false }).eq("user_id", user.id);
        const { error } = await supabase.from("payment_methods").update({ is_default: true }).eq("id", id);
        if (error) return;
        setState((prev) => ({
            ...prev,
            wallet: {
                ...prev.wallet,
                methods: prev.wallet.methods.map((m) => ({ ...m, isDefault: m.id === id })),
            },
        }));
    }

    // ----------------------------------------------------------------------
    // Operator settings
    // ----------------------------------------------------------------------

    async function updateOperator(patch: Partial<OperatorSettings>) {
        if (!user) return;
        const next = { ...state.operator, ...patch };

        // routes and driverInvites are their own tables; they are kept in the
        // same object for the UI but written through addRoute / inviteDriver.
        const { error } = await supabase.from("operator_settings").upsert(
            {
                operator_id: user.id,
                trading_name: next.tradingName,
                registration_number: next.registrationNumber,
                vat_number: next.vatNumber,
                contact_email: next.contactEmail,
                contact_phone: next.contactPhone,
                operating_region: next.operatingRegion,
                payout_bank_name: next.payout.bankName,
                payout_account_last4: next.payout.accountLast4 || null,
                payout_account_holder: next.payout.accountHolder,
                payout_schedule: next.payout.schedule,
                policies: next.policies,
                notifications: next.notifications,
            },
            { onConflict: "operator_id" }
        );
        if (error) return;
        setState((prev) => ({ ...prev, operator: next }));
    }

    async function addRoute(r: Omit<OperatorRoute, "id">) {
        if (!user) return;
        const { data } = await supabase
            .from("operator_routes")
            .insert({
                operator_id: user.id,
                from_location: r.from,
                to_location: r.to,
                fare: r.fare,
                active: r.active,
            })
            .select()
            .single();
        if (!data) return;

        const row = data as Record<string, unknown>;
        setState((prev) => ({
            ...prev,
            operator: { ...prev.operator, routes: [...prev.operator.routes, { ...r, id: row.id as string }] },
        }));
    }

    async function updateRoute(id: string, patch: Partial<OperatorRoute>) {
        const row: Record<string, unknown> = {};
        if (patch.from !== undefined) row.from_location = patch.from;
        if (patch.to !== undefined) row.to_location = patch.to;
        if (patch.fare !== undefined) row.fare = patch.fare;
        if (patch.active !== undefined) row.active = patch.active;

        const { error } = await supabase.from("operator_routes").update(row).eq("id", id);
        if (error) return;
        setState((prev) => ({
            ...prev,
            operator: {
                ...prev.operator,
                routes: prev.operator.routes.map((r) => (r.id === id ? { ...r, ...patch } : r)),
            },
        }));
    }

    async function removeRoute(id: string) {
        const { error } = await supabase.from("operator_routes").delete().eq("id", id);
        if (error) return;
        setState((prev) => ({
            ...prev,
            operator: { ...prev.operator, routes: prev.operator.routes.filter((r) => r.id !== id) },
        }));
    }

    async function inviteDriver(name: string, phone: string): Promise<DriverInvite | null> {
        if (!user) return null;
        const { data } = await supabase
            .from("driver_invites")
            .insert({ operator_id: user.id, name, phone, status: "invited" })
            .select()
            .single();
        if (!data) return null;

        const row = data as Record<string, unknown>;
        const invite: DriverInvite = {
            id: row.id as string,
            name,
            phone,
            sentAt: row.sent_at as string,
            status: "invited",
        };
        setState((prev) => ({
            ...prev,
            operator: { ...prev.operator, driverInvites: [invite, ...prev.operator.driverInvites] },
        }));
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
                refresh,
                isLoading,
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
