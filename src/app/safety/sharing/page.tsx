"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/app/context/SettingsContext";
import { useBooking } from "@/app/context/BookingContext";
import { useToast } from "@/components/Toast";
import { SettingsShell, SettingsGroup, SettingsRow, Toggle } from "@/components/SettingsUI";
import ShareButton from "@/components/ShareButton";
import { absoluteUrl, bookingShareText } from "@/lib/share";

export default function TripSharingPage() {
    const router = useRouter();
    const { safety, updateSafety, contacts } = useSettings();
    const { currentBooking } = useBooking();
    const { toast } = useToast();

    const sharers = contacts.filter((c) => c.canSeeLocation);

    return (
        <SettingsShell title="Trip Sharing" subtitle="Automate sharing with your circle">
            <SettingsGroup
                label="Automatic Sharing"
                footnote="Automatic sharing starts when you board and stops when the trip completes. Your contacts never see your location between trips."
            >
                <SettingsRow
                    first
                    icon="share_location"
                    label="Share every trip automatically"
                    sub={sharers.length ? `${sharers.map((c) => c.name).join(", ")} will be sent a live link` : "Add a trusted contact first"}
                    right={
                        <Toggle
                            label="Share every trip automatically"
                            checked={safety.shareTripAutomatically}
                            onChange={(next) => {
                                if (next && sharers.length === 0) {
                                    toast("Add a trusted contact who can see your location first", "error");
                                    return;
                                }
                                updateSafety({ shareTripAutomatically: next });
                                toast(next ? "Trips will be shared automatically" : "Automatic sharing turned off", "success");
                            }}
                        />
                    }
                />
                <SettingsRow
                    icon="alt_route"
                    label="Alert on route deviation"
                    sub="Notify contacts if the taxi leaves the expected route"
                    right={
                        <Toggle
                            label="Alert on route deviation"
                            checked={safety.shareRouteDeviations}
                            onChange={(next) => {
                                updateSafety({ shareRouteDeviations: next });
                                toast(next ? "Deviation alerts turned on" : "Deviation alerts turned off", "success");
                            }}
                        />
                    }
                />
            </SettingsGroup>

            {/* ── Share the trip you are on right now ── */}
            <SettingsGroup label="Share Right Now">
                {currentBooking && currentBooking.status !== "cancelled" ? (
                    <div className="p-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div
                                className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: "#CDDFF6", color: "#111111" }}
                            >
                                <span className="material-symbols-outlined">directions_bus</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-sans font-semibold truncate" style={{ color: "#111111" }}>
                                    {currentBooking.from} to {currentBooking.to}
                                </p>
                                <p className="font-sans text-xs" style={{ color: "#8A8678" }}>
                                    {currentBooking.taxiName} · Seat {currentBooking.seatNumber}
                                </p>
                            </div>
                        </div>
                        <ShareButton
                            variant="pill"
                            label="Share this trip"
                            className="w-full justify-center"
                            title="My Quallor trip"
                            text={bookingShareText(currentBooking)}
                            url={absoluteUrl("/commute/tracking")}
                        />
                    </div>
                ) : (
                    <SettingsRow
                        first
                        icon="info"
                        label="No active trip"
                        sub="Book a seat and the share link appears here"
                        onClick={() => router.push("/commute")}
                    />
                )}
            </SettingsGroup>

            <SettingsGroup label="Who Can See Your Trips">
                {sharers.length === 0 ? (
                    <SettingsRow
                        first
                        icon="person_alert"
                        label="Nobody yet"
                        sub="Add a trusted contact to start sharing"
                        onClick={() => router.push("/safety/contacts")}
                    />
                ) : (
                    sharers.map((c, i) => (
                        <SettingsRow key={c.id} first={i === 0} icon="person" label={c.name} sub={`${c.relationship} · ${c.phone}`} />
                    ))
                )}
            </SettingsGroup>
        </SettingsShell>
    );
}
