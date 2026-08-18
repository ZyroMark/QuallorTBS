"use client";

import React from "react";
import LegalPage, { type LegalSection } from "@/components/LegalPage";

const SECTIONS: LegalSection[] = [
    {
        heading: "Scope",
        blocks: [
            "This policy explains what personal information Quallor collects, why we collect it, who we share it with and what you can do about it. It covers passengers, drivers, gaatjies and operators, and it applies to the passenger app, the driver and gaatjie tools, the operator console and the fleet register.",
            "Quallor is the responsible party for this information under the Protection of Personal Information Act 4 of 2013.",
        ],
    },
    {
        heading: "What we collect",
        blocks: [
            "From passengers:",
            [
                "Account details: name, email address, mobile number and password.",
                "Booking records: route, seat, fare, payment method, date and time, and the digital ticket reference.",
                "Trip location while a trip is being tracked, and only while the trip is active.",
                "Safety settings: trusted contacts you add, and the sharing preferences you choose.",
                "Support messages and complaints you send us.",
            ],
            "From drivers and gaatjies:",
            [
                "Account details as above, plus driving licence number, professional driving permit details, and vehicle registration.",
                "Vehicle location while a shift is active, so passengers can track the taxi they have booked.",
                "Boarding records: which passenger boarded which vehicle, at what time, in which seat.",
                "Fare records for walk-up passengers, including whether the fare was cash or card.",
            ],
            "From operators:",
            [
                "Company or association name, contact details, fleet size and operating licence numbers.",
                "Fleet records: vehicle details, assessment results, maintenance status and suspension history.",
            ],
            "Technical information is collected from every device: device type, browser, app version, and error reports. This is used to keep the service working, not to profile you.",
        ],
    },
    {
        heading: "Why we use it",
        blocks: [
            "We use personal information to:",
            [
                "Take a booking, hold a seat and issue a ticket that a driver can verify.",
                "Show a passenger where their taxi is, and show a driver who is due to board.",
                "Process fares and refunds, and keep the financial records the law requires.",
                "Run the safety features you have switched on, including SOS alerts and trip sharing.",
                "Keep the fleet register, so vehicles carrying passengers are known to be assessed and roadworthy.",
                "Investigate incidents, complaints and fraud.",
                "Send you service messages about your trips. Marketing messages are only sent if you opt in, and you can opt out at any time.",
            ],
        ],
    },
    {
        heading: "Our lawful basis",
        blocks: [
            "We process personal information because it is necessary to perform the booking contract with you, because we have a legitimate interest in operating a safe transport network, because certain records are required by transport and tax law, and, for optional features such as marketing and biometric sign-in, because you have consented. Where processing rests on consent you may withdraw that consent at any time.",
        ],
    },
    {
        heading: "Who we share it with",
        blocks: [
            "We share only what each party needs:",
            [
                "The operator and crew of the vehicle you booked receive your name, seat, boarding point and ticket reference. They do not receive your email address, your home address or your payment details.",
                "Passengers see the driver's first name and surname initial, the vehicle registration and the vehicle's live position during their trip. They do not see the driver's licence number or personal contact details.",
                "Trusted contacts you have added receive your live trip location only when you share a trip or trigger an SOS.",
                "Our payment processor receives the amount and reference needed to take a payment. Quallor does not store full card numbers.",
                "Law enforcement and regulators receive information where we are legally required to provide it, or where it is needed to investigate a serious incident.",
            ],
            "We do not sell personal information, and we do not share it with advertisers.",
        ],
    },
    {
        heading: "Location information",
        blocks: [
            "Passenger location is collected only while a trip is being tracked, and stops when the trip ends. Driver and vehicle location is collected while a shift is on duty, because passengers who have paid for a seat need to see where the vehicle is.",
            "You can switch location off in your device settings. Live tracking and some safety features will not work if you do.",
        ],
    },
    {
        heading: "How long we keep it",
        blocks: [
            [
                "Account details: for as long as your account is open, then 12 months after closure.",
                "Booking and fare records: five years, as required by South African tax law.",
                "Trip location traces: 90 days, then deleted, unless they are part of an open incident investigation.",
                "Boarding manifests: 12 months, so a manifest can be produced if an incident is reported late.",
                "Fleet assessment records: five years, so a vehicle's safety history stays auditable.",
                "SOS alert records: 24 months.",
            ],
        ],
    },
    {
        heading: "Security",
        blocks: [
            "Account credentials, booking records and fleet records are protected by access controls, and access is limited to the role that needs it. A gaatjie sees only the manifest for their own vehicle. An operator sees only their own fleet.",
            "No system is perfectly secure. If a breach affects your personal information we will notify you and the Information Regulator as the Protection of Personal Information Act requires.",
        ],
    },
    {
        heading: "Your rights",
        blocks: [
            "You have the right to:",
            [
                "Ask what personal information we hold about you, and get a copy of it.",
                "Have information corrected if it is wrong, which you can do yourself for most fields on the personal info screen.",
                "Ask us to delete information we no longer have a lawful reason to keep.",
                "Object to processing based on legitimate interest.",
                "Withdraw consent for optional features at any time.",
                "Complain to the Information Regulator of South Africa if you believe we have handled your information unlawfully.",
            ],
            "To exercise any of these rights, email privacy@quallor.co.za. We respond within 30 days.",
        ],
    },
    {
        heading: "Children",
        blocks: [
            "Quallor accounts are for people aged 16 and over. A parent or guardian may book a seat for a younger passenger, in which case we hold only the seat record and the child's first name, which the crew needs in order to board them.",
        ],
    },
    {
        heading: "Changes and contact",
        blocks: [
            "We will post any change to this policy in the app. Where a change materially affects how your information is used we will notify you at least 14 days before it takes effect.",
            "Information officer, Quallor, East London, Eastern Cape. Email privacy@quallor.co.za.",
            "This document is a plain-language privacy notice prepared for the Quallor platform. It should be reviewed by a qualified South African attorney before the service goes live commercially.",
        ],
    },
];

export default function PrivacyPage() {
    return (
        <LegalPage
            title="Privacy Policy"
            subtitle="What Quallor collects from passengers, drivers, gaatjies and operators, why we collect it, and the control you keep over it."
            effective="17 August 2026"
            sections={SECTIONS}
            sibling={{ label: "Read the Terms of Service", href: "/terms" }}
        />
    );
}
