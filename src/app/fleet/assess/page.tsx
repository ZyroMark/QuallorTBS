"use client";

import React, { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    useFleet,
    resultForScore,
    ASSESSMENT_CHECKLISTS,
    ASSESSMENT_LABELS,
    type AssessmentType,
    type AssessmentItem,
} from "@/app/context/FleetContext";
import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/components/Toast";
import OperatorGate from "@/components/OperatorGate";

/**
 * Record a vehicle assessment.
 *
 * The score is derived from the checklist rather than typed in, so a result
 * cannot contradict the items ticked. Everything saved here lands in the fleet
 * register permanently.
 */

const TYPES: AssessmentType[] = ["roadworthy", "safety", "cleanliness", "driver-conduct"];

/** How long until this kind of check is due again. */
const REASSESS_DAYS: Record<AssessmentType, number> = {
    roadworthy: 180,
    safety: 90,
    cleanliness: 30,
    "driver-conduct": 90,
};

const RESULT_COLORS = { pass: "#16A34A", conditional: "#D97706", fail: "#DC2626" } as const;

function AssessForm() {
    const router = useRouter();
    const params = useSearchParams();
    const { vehicles, addAssessment } = useFleet();
    const { user } = useAuth();
    const { toast } = useToast();

    const [vehicleId, setVehicleId] = useState(params.get("vehicle") || "");
    const [type, setType] = useState<AssessmentType>("roadworthy");
    const [assessor, setAssessor] = useState(user?.name || "");
    const [assessedAt, setAssessedAt] = useState(new Date().toISOString().slice(0, 10));
    const [notes, setNotes] = useState("");
    const [error, setError] = useState("");

    // Checklist state, reset whenever the assessment type changes.
    const [statuses, setStatuses] = useState<Record<string, AssessmentItem["status"]>>({});
    const [itemNotes, setItemNotes] = useState<Record<string, string>>({});

    const checklist = ASSESSMENT_CHECKLISTS[type];
    const vehicle = vehicles.find((v) => v.id === vehicleId);

    const { score, result, answered } = useMemo(() => {
        const scored = checklist.filter((label) => statuses[label] && statuses[label] !== "na");
        const passed = scored.filter((label) => statuses[label] === "pass").length;
        const value = scored.length === 0 ? 0 : Math.round((passed / scored.length) * 100);
        return { score: value, result: resultForScore(value), answered: scored.length };
    }, [checklist, statuses]);

    function changeType(next: AssessmentType) {
        setType(next);
        setStatuses({});
        setItemNotes({});
    }

    function markAll(status: AssessmentItem["status"]) {
        setStatuses(Object.fromEntries(checklist.map((l) => [l, status])));
    }

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (!vehicle) { setError("Choose the vehicle being assessed."); return; }
        if (!assessor.trim()) { setError("Record who carried out the assessment."); return; }
        if (answered === 0) { setError("Mark at least one checklist item before saving."); return; }

        const items: AssessmentItem[] = checklist.map((label) => ({
            label,
            status: statuses[label] ?? "na",
            ...(itemNotes[label]?.trim() ? { note: itemNotes[label].trim() } : {}),
        }));

        const due = new Date(assessedAt);
        due.setDate(due.getDate() + REASSESS_DAYS[type]);

        const saved = await addAssessment({
            vehicleId: vehicle.id,
            plate: vehicle.plate,
            type,
            assessedAt,
            assessor: assessor.trim(),
            score,
            result,
            items,
            notes: notes.trim(),
            nextDue: due.toISOString().slice(0, 10),
        });

        if (!saved) {
            toast("Could not save the assessment. Only the fleet office can record one.", "error");
            return;
        }

        toast(`${ASSESSMENT_LABELS[type]} saved as ${saved.id} · ${result}`, result === "fail" ? "error" : "success");
        router.push("/fleet");
    }

    return (
        <main className="min-h-screen" style={{ backgroundColor: "#FFFCF9" }}>
            <header
                className="sticky top-0 z-20"
                style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid rgba(17,17,17,0.08)" }}
            >
                <div className="max-w-2xl mx-auto w-full flex items-center gap-2 px-4 py-3">
                    <button
                        onClick={() => router.push("/fleet")}
                        aria-label="Back to fleet"
                        className="flex w-10 h-10 items-center justify-center rounded-[10px] hover:bg-q-stone-100 transition-colors flex-shrink-0"
                    >
                        <span className="material-symbols-outlined" style={{ color: "#111111" }}>arrow_back</span>
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="font-sans font-black text-base truncate" style={{ color: "#111111", letterSpacing: "-0.02em" }}>
                            New Assessment
                        </h1>
                        <p className="font-mono text-[10px] font-bold uppercase tracking-wider" style={{ color: "#1D3686" }}>
                            {vehicle ? vehicle.plate : "No vehicle selected"}
                        </p>
                    </div>
                </div>
            </header>

            <form onSubmit={submit} className="max-w-2xl mx-auto w-full px-4 py-6 pb-28">
                {error && (
                    <div
                        className="mb-5 px-4 py-3 rounded-[12px] font-sans text-sm font-semibold"
                        style={{ backgroundColor: "rgba(220,38,38,0.07)", border: "1.5px solid rgba(220,38,38,0.20)", color: "#DC2626" }}
                    >
                        {error}
                    </div>
                )}

                {/* Vehicle and type */}
                <div
                    className="rounded-[16px] p-5 mb-5"
                    style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(17,17,17,0.07)" }}
                >
                    <div className="mb-4">
                        <label className="q-label">Vehicle</label>
                        <select className="q-input-lg" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                            <option value="">Choose a vehicle</option>
                            {vehicles.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.plate} · {v.model} · {v.driverName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="q-label">Assessment Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {TYPES.map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => changeType(t)}
                                    className="py-3 px-3 rounded-[12px] font-sans text-xs font-bold text-left transition-all"
                                    style={type === t
                                        ? { backgroundColor: "#111111", color: "#FFFFFF" }
                                        : { backgroundColor: "#EEF1EA", color: "#5C5A56" }}
                                >
                                    {ASSESSMENT_LABELS[t]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="q-label">Assessed By</label>
                            <input
                                className="q-input"
                                placeholder="Inspector name"
                                value={assessor}
                                onChange={(e) => setAssessor(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="q-label">Date</label>
                            <input
                                type="date"
                                className="q-input"
                                value={assessedAt}
                                onChange={(e) => setAssessedAt(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Live score */}
                <div
                    className="rounded-[16px] p-5 mb-5 flex items-center gap-4"
                    style={{ backgroundColor: "#111111" }}
                >
                    <div
                        className="w-20 h-20 rounded-full flex flex-col items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: answered ? RESULT_COLORS[result] : "rgba(255,252,249,0.14)" }}
                    >
                        <span className="font-sans font-black text-2xl leading-none" style={{ color: "#FFFFFF" }}>
                            {answered ? score : "-"}
                        </span>
                        <span className="font-mono text-[9px] font-bold uppercase" style={{ color: "rgba(255,255,255,0.75)" }}>
                            score
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-sans font-black text-lg" style={{ color: "#FFFCF9", letterSpacing: "-0.02em" }}>
                            {answered === 0
                                ? "Not scored yet"
                                : result === "pass" ? "Pass" : result === "conditional" ? "Conditional pass" : "Fail"}
                        </p>
                        <p className="font-sans text-xs mt-1" style={{ color: "rgba(255,252,249,0.65)", lineHeight: 1.6 }}>
                            {answered === 0
                                ? "Mark the checklist below and the score is worked out for you."
                                : result === "fail"
                                ? "Below 65. The vehicle should be pulled from service until the failures are corrected."
                                : result === "conditional"
                                ? "Between 65 and 84. The vehicle may run while the noted items are corrected."
                                : "85 or above. The vehicle is cleared for service."}
                        </p>
                        <p className="font-mono text-[10px] uppercase tracking-wider mt-2" style={{ color: "rgba(255,252,249,0.45)" }}>
                            {answered} of {checklist.length} items scored
                        </p>
                    </div>
                </div>

                {/* Checklist */}
                <div className="flex items-center justify-between mb-2 px-1">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: "#AEA89C" }}>
                        Checklist
                    </p>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => markAll("pass")}
                            className="font-mono text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full"
                            style={{ backgroundColor: "rgba(22,163,74,0.10)", color: "#16A34A" }}
                        >
                            All pass
                        </button>
                        <button
                            type="button"
                            onClick={() => { setStatuses({}); setItemNotes({}); }}
                            className="font-mono text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full"
                            style={{ backgroundColor: "#EEF1EA", color: "#5C5A56" }}
                        >
                            Clear
                        </button>
                    </div>
                </div>

                <div
                    className="rounded-[16px] overflow-hidden mb-5"
                    style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(17,17,17,0.07)" }}
                >
                    {checklist.map((label, i) => {
                        const current = statuses[label];
                        return (
                            <div key={label} style={{ borderTop: i === 0 ? undefined : "1px solid rgba(17,17,17,0.06)" }}>
                                <div className="flex items-center gap-3 p-4">
                                    <p className="flex-1 font-sans text-sm font-semibold" style={{ color: "#111111" }}>{label}</p>
                                    <div className="flex gap-1 flex-shrink-0">
                                        {([
                                            { id: "pass" as const, icon: "check",  color: "#16A34A" },
                                            { id: "fail" as const, icon: "close",  color: "#DC2626" },
                                            { id: "na"   as const, icon: "remove", color: "#8A8678" },
                                        ]).map((opt) => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                aria-label={`${label}: ${opt.id}`}
                                                onClick={() => setStatuses({ ...statuses, [label]: opt.id })}
                                                className="w-9 h-9 rounded-[10px] flex items-center justify-center transition-all"
                                                style={current === opt.id
                                                    ? { backgroundColor: opt.color, color: "#FFFFFF" }
                                                    : { backgroundColor: "#EEF1EA", color: "#AEA89C" }}
                                            >
                                                <span className="material-symbols-outlined text-lg">{opt.icon}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {current === "fail" && (
                                    <div className="px-4 pb-4">
                                        <input
                                            className="q-input w-full"
                                            placeholder="What is wrong with it?"
                                            value={itemNotes[label] ?? ""}
                                            onChange={(e) => setItemNotes({ ...itemNotes, [label]: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Notes */}
                <div className="mb-6">
                    <label className="q-label">Assessor Notes</label>
                    <textarea
                        className="q-input-lg"
                        style={{ height: "7rem", paddingTop: "0.9rem", resize: "vertical" }}
                        placeholder="Anything the operator needs to act on"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>

                <div className="flex gap-3">
                    <button type="button" onClick={() => router.push("/fleet")} className="q-btn-outline flex-1 justify-center">
                        Cancel
                    </button>
                    <button type="submit" className="q-btn-dark flex-1 justify-center">
                        Save Assessment
                    </button>
                </div>
            </form>
        </main>
    );
}

export default function AssessPage() {
    return (
        <OperatorGate area="fleet">
            <Suspense>
                <AssessForm />
            </Suspense>
        </OperatorGate>
    );
}
