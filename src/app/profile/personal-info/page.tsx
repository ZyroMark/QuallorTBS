"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/components/Toast";
import AuthGuard from "@/components/AuthGuard";
import { SettingsShell, SettingsGroup, Field } from "@/components/SettingsUI";

function PersonalInfoContent() {
    const router = useRouter();
    const { user, updateUser } = useAuth();
    const { toast } = useToast();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [licenseNumber, setLicenseNumber] = useState("");
    const [vehicleModel, setVehicleModel] = useState("");
    const [vehiclePlate, setVehiclePlate] = useState("");
    const [vehicleColor, setVehicleColor] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [fleetSize, setFleetSize] = useState("");

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [banner, setBanner] = useState("");
    const [saving, setSaving] = useState(false);

    // Seed the form once the stored user has loaded.
    useEffect(() => {
        if (!user) return;
        setName(user.name ?? "");
        setEmail(user.email ?? "");
        setPhone(user.phone ?? "");
        setLicenseNumber(user.licenseNumber ?? "");
        setVehicleModel(user.vehicleModel ?? "");
        setVehiclePlate(user.vehiclePlate ?? "");
        setVehicleColor(user.vehicleColor ?? "");
        setCompanyName(user.companyName ?? "");
        setFleetSize(user.fleetSize != null ? String(user.fleetSize) : "");
    }, [user]);

    const isDriver = user?.role === "driver";
    const isOperator = user?.role === "operator";

    function validate() {
        const next: Record<string, string> = {};
        if (!name.trim()) next.name = "Your name is required.";
        if (!email.trim()) next.email = "An email address is required.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "That does not look like a valid email address.";
        if (phone.trim()) {
            const digits = phone.replace(/[^\d+]/g, "");
            if (!/^(\+?27|0)\d{9}$/.test(digits)) next.phone = "Enter a South African number, for example 082 123 4567.";
        }
        if (isDriver && !vehiclePlate.trim()) next.vehiclePlate = "Your number plate identifies your taxi to passengers.";
        if (isOperator && fleetSize && Number.isNaN(Number(fleetSize))) next.fleetSize = "Fleet size must be a number.";
        setErrors(next);
        return Object.keys(next).length === 0;
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setBanner("");
        if (!validate()) return;

        setSaving(true);
        const result = updateUser({
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            ...(isDriver && {
                licenseNumber: licenseNumber.trim(),
                vehicleModel: vehicleModel.trim(),
                vehiclePlate: vehiclePlate.trim().toUpperCase(),
                vehicleColor: vehicleColor.trim(),
            }),
            ...(isOperator && {
                companyName: companyName.trim(),
                fleetSize: Number(fleetSize) || 0,
            }),
        });
        setSaving(false);

        if (!result.success) {
            setBanner(result.error || "Could not save your changes.");
            return;
        }
        toast("Profile updated", "success");
        router.push("/profile");
    }

    return (
        <SettingsShell title="Personal Info" subtitle="Edit your profile and data">
            <form onSubmit={handleSubmit}>
                {banner && (
                    <div
                        className="mb-5 px-4 py-3 rounded-[12px] font-sans text-sm font-semibold"
                        style={{ backgroundColor: "rgba(220,38,38,0.07)", border: "1.5px solid rgba(220,38,38,0.20)", color: "#DC2626" }}
                    >
                        {banner}
                    </div>
                )}

                <SettingsGroup label="About You">
                    <div className="p-4">
                        <Field label="Full Name" value={name} onChange={setName} placeholder="Your full name" error={errors.name} />
                        <Field label="Email Address" value={email} onChange={setEmail} type="email" placeholder="you@example.com" error={errors.email} hint="This is also your sign-in address." />
                        <Field label="Mobile Number" value={phone} onChange={setPhone} type="tel" placeholder="082 123 4567" error={errors.phone} />
                        <div className="mb-1">
                            <label className="q-label">Account Type</label>
                            <div
                                className="h-14 px-4 flex items-center rounded-[12px] font-sans font-semibold capitalize"
                                style={{ backgroundColor: "#EEF1EA", color: "#5C5A56" }}
                            >
                                {user?.role}
                            </div>
                            <p className="font-sans text-xs mt-1.5" style={{ color: "#8A8678" }}>
                                Your account type cannot be changed here. Contact support if you need a different role.
                            </p>
                        </div>
                    </div>
                </SettingsGroup>

                {isDriver && (
                    <SettingsGroup
                        label="Driver & Vehicle"
                        footnote="Passengers see your name and number plate so they can identify the right taxi. Your licence number stays private."
                    >
                        <div className="p-4">
                            <Field label="Drivers Licence Number" value={licenseNumber} onChange={setLicenseNumber} placeholder="e.g. DL1234567" />
                            <Field label="Vehicle Model" value={vehicleModel} onChange={setVehicleModel} placeholder="e.g. Toyota Quantum" />
                            <Field label="Number Plate" value={vehiclePlate} onChange={setVehiclePlate} placeholder="e.g. EC 123-456" error={errors.vehiclePlate} />
                            <Field label="Vehicle Colour" value={vehicleColor} onChange={setVehicleColor} placeholder="e.g. White" />
                        </div>
                    </SettingsGroup>
                )}

                {isOperator && (
                    <SettingsGroup label="Operation">
                        <div className="p-4">
                            <Field label="Company / Association Name" value={companyName} onChange={setCompanyName} placeholder="e.g. Border Alliance Taxi Association" />
                            <Field label="Fleet Size" value={fleetSize} onChange={setFleetSize} type="number" placeholder="Number of vehicles" error={errors.fleetSize} />
                        </div>
                    </SettingsGroup>
                )}

                <div className="flex gap-3">
                    <button type="button" onClick={() => router.back()} className="q-btn-outline flex-1 justify-center">
                        Cancel
                    </button>
                    <button type="submit" disabled={saving} className="q-btn-dark flex-1 justify-center">
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>
        </SettingsShell>
    );
}

export default function PersonalInfoPage() {
    return (
        <AuthGuard>
            <PersonalInfoContent />
        </AuthGuard>
    );
}
