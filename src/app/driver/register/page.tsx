"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function DriverRegisterPage() {
    const router = useRouter();
    const { signup } = useAuth();
    const [step, setStep] = useState(1);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [licenseFile, setLicenseFile] = useState("");
    const [permitFile, setPermitFile] = useState("");
    const [formData, setFormData] = useState({
        fullName: "",
        phone: "",
        email: "",
        password: "",
        licenseNumber: "",
        vehiclePlate: "",
        vehicleModel: "Toyota Quantum",
        vehicleColor: "White",
    });

    const progressWidth = step === 1 ? "33%" : step === 2 ? "66%" : "100%";

    function handleNext() {
        if (step === 1) {
            if (!formData.fullName || !formData.phone || !formData.email || !formData.licenseNumber) {
                setError("Please fill in all personal information fields."); return;
            }
            if (!formData.password || formData.password.length < 8) {
                setError("Password must be at least 8 characters."); return;
            }
        }
        if (step === 2) {
            if (!formData.vehiclePlate) { setError("Please enter the registration plate."); return; }
        }
        setError("");
        setStep(s => s + 1);
    }

    async function handleSubmit() {
        if (!licenseFile || !permitFile) {
            setError("Please upload both required documents."); return;
        }
        setError("");
        setLoading(true);
        const result = signup({
            name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            role: "driver",
            licenseNumber: formData.licenseNumber,
            vehiclePlate: formData.vehiclePlate,
            vehicleModel: formData.vehicleModel,
            vehicleColor: formData.vehicleColor,
        });
        setLoading(false);
        if (!result.success) { setError(result.error || "Registration failed."); return; }
        router.push("/driver/status");
    }

    return (
        <main className="min-h-screen bg-q-bg-page pb-12">
            <div className="sticky top-0 z-50 flex items-center bg-white px-4 py-3 border-b border-q-stone-200 shadow-q-xs">
                <button onClick={() => step > 1 ? setStep(s => s - 1) : router.back()} className="flex w-10 h-10 shrink-0 items-center justify-center rounded-[10px] hover:bg-q-stone-100 transition-colors">
                    <span className="material-symbols-outlined text-q-stone-700">arrow_back</span>
                </button>
                <h2 className="font-display text-lg font-semibold text-q-stone-900 flex-1 text-center pr-10">Driver Registration</h2>
            </div>

            <div className="max-w-md mx-auto">
                {/* Progress */}
                <div className="flex flex-col gap-3 p-6 text-left">
                    <div className="flex gap-6 justify-between items-center">
                        <p className="font-sans text-sm font-semibold text-q-brown">Registration Progress</p>
                        <p className="font-sans text-sm text-q-stone-500">Step {step} of 3</p>
                    </div>
                    <div className="rounded-full bg-q-brown-100 h-2 overflow-hidden">
                        <div className="h-full rounded-full bg-q-brown transition-all duration-500" style={{ width: progressWidth }} />
                    </div>
                </div>

                {error && (
                    <div className="mx-6 mb-4 px-4 py-3 rounded-[10px] bg-red-50 border border-red-200 text-red-600 font-sans text-sm font-medium">
                        {error}
                    </div>
                )}

                <div className="space-y-8 px-6 text-left">
                    {/* Step 1 - Personal Info */}
                    {step === 1 && (
                        <section>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-8 h-8 rounded-lg bg-q-brown-100 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-q-brown text-sm">person</span>
                                </div>
                                <h3 className="font-display text-lg font-semibold text-q-stone-900">Personal Information</h3>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { label: "Full Name", key: "fullName", placeholder: "e.g. John Doe" },
                                    { label: "Email Address", key: "email", placeholder: "john@example.com" },
                                    { label: "Contact Number", key: "phone", placeholder: "+27 00 000 0000" },
                                    { label: "License Number", key: "licenseNumber", placeholder: "ABC-12345-6789" },
                                    { label: "Password", key: "password", placeholder: "Min. 8 characters" },
                                ].map(({ label, key, placeholder }) => (
                                    <div key={key} className="flex flex-col gap-1.5">
                                        <label className="q-label">{label}</label>
                                        <input
                                            className="q-input-lg"
                                            type={key === "password" ? "password" : "text"}
                                            placeholder={placeholder}
                                            value={formData[key as keyof typeof formData]}
                                            onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Step 2 - Vehicle Details */}
                    {step === 2 && (
                        <section>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-8 h-8 rounded-lg bg-q-brown-100 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-q-brown text-sm">directions_car</span>
                                </div>
                                <h3 className="font-display text-lg font-semibold text-q-stone-900">Vehicle Details</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5 col-span-2">
                                    <label className="q-label">Registration Plate</label>
                                    <input className="q-input-lg" placeholder="Enter plate number" value={formData.vehiclePlate} onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value })} />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="q-label">Model</label>
                                    <input className="q-input-lg" placeholder="Toyota Quantum" value={formData.vehicleModel} onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })} />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="q-label">Color</label>
                                    <input className="q-input-lg" placeholder="White" value={formData.vehicleColor} onChange={(e) => setFormData({ ...formData, vehicleColor: e.target.value })} />
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Step 3 - Document Upload */}
                    {step === 3 && (
                        <section>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-8 h-8 rounded-lg bg-q-brown-100 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-q-brown text-sm">description</span>
                                </div>
                                <h3 className="font-display text-lg font-semibold text-q-stone-900">Document Upload</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {[
                                    { label: "Driver's License (Front)", state: licenseFile, setter: setLicenseFile },
                                    { label: "Vehicle Permit", state: permitFile, setter: setPermitFile },
                                ].map(({ label, state, setter }) => (
                                    <div key={label} className="flex flex-col gap-1.5">
                                        <label className="q-label">{label}</label>
                                        <label className={`border-2 border-dashed rounded-[14px] p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${state ? 'border-green-400 bg-green-50' : 'border-q-brown-200 bg-q-brown-50 hover:bg-q-brown-100'}`}>
                                            <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => setter(e.target.files?.[0]?.name || "")} />
                                            {state ? (
                                                <>
                                                    <span className="material-symbols-outlined text-green-500 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                                    <span className="font-sans text-xs text-green-600 font-medium text-center break-all">{state}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined text-q-brown text-3xl">upload_file</span>
                                                    <span className="font-sans text-xs text-q-brown font-medium">Click to upload photo</span>
                                                </>
                                            )}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Action Button */}
                    <div className="pt-6 pb-10">
                        {step < 3 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="q-btn-primary-lg w-full justify-center"
                            >
                                Continue
                                <span className="material-symbols-outlined">arrow_forward</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="q-btn-primary-lg w-full justify-center disabled:opacity-70"
                            >
                                {loading ? "Submitting..." : "Submit for Verification"}
                                <span className="material-symbols-outlined">verified_user</span>
                            </button>
                        )}
                        <p className="font-sans text-center text-xs text-q-stone-500 mt-4 px-4">
                            By submitting, you agree to Quallor&apos;s Terms of Service and Privacy Policy.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
