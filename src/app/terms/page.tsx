"use client";

import React from "react";
import LegalPage, { type LegalSection } from "@/components/LegalPage";

const SECTIONS: LegalSection[] = [
    {
        heading: "Who these terms apply to",
        blocks: [
            "These terms govern every use of the Quallor platform: the passenger app, the driver and gaatjie tools, the operator console and the fleet register. By creating an account, booking a seat, boarding a taxi booked through Quallor, or operating a vehicle listed on the network, you accept these terms.",
            "Three kinds of user are covered, and each has obligations of their own:",
            [
                "Passengers, meaning anyone who books or occupies a seat through Quallor, including walk-up passengers booked on board by a gaatjie.",
                "Drivers and gaatjies, meaning the person driving a listed vehicle and the conductor who manages boarding and fare collection on that vehicle.",
                "Operators and associations, meaning the owner or association responsible for one or more vehicles listed on the network.",
            ],
            "If you use Quallor on behalf of an association or a business, you confirm that you are authorised to bind that organisation to these terms.",
        ],
    },
    {
        heading: "What Quallor is and is not",
        blocks: [
            "Quallor is a booking and coordination platform. We list routes, hold seat reservations, issue digital tickets, and give drivers and gaatjies the tools to confirm boarding. We do not own the vehicles, we do not employ the drivers, and we do not carry passengers ourselves.",
            "The transport contract is between the passenger and the operator of the vehicle. Quallor is not a party to that contract and is not a public carrier. Where these terms limit our responsibility, that limit applies to the booking service, not to the operator's own duties under South African road transport law.",
        ],
    },
    {
        heading: "Accounts",
        blocks: [
            "You must be 16 or older to hold a Quallor account. Passengers under 16 may travel on a seat booked by a parent or guardian.",
            "You are responsible for the accuracy of the details on your account and for keeping your sign-in credentials private. Tell us immediately if you believe someone else has access to your account.",
            "Driver and operator accounts carry additional requirements. Before a driver account is verified you must supply a valid driving licence, a valid professional driving permit where the law requires one, and the registration details of the vehicle you drive. Before an operator account is verified you must supply your association details and your operating licence numbers. We may suspend a driver or operator account where these documents lapse, are withdrawn, or cannot be verified.",
        ],
    },
    {
        heading: "Bookings, seats and connecting trips",
        blocks: [
            "A booking reserves a specific seat on a specific vehicle for a specific departure. Your digital ticket carries a QR code that the driver or gaatjie scans at boarding. Present the ticket on screen when you board.",
            "Some journeys are made up of two legs, where a second taxi carries you onward from the first taxi's endpoint. Each leg is a separate seat on a separate vehicle with its own ticket, grouped under one journey reference. A delay on the first leg does not guarantee that the second vehicle will wait, and Quallor does not warrant connection times.",
            "Many Eastern Cape routes depart when the vehicle is full rather than at a fixed time. Where a route is marked as leaving when full, the departure time shown is an estimate only.",
        ],
    },
    {
        heading: "Fares, payment and refunds",
        blocks: [
            "Fares shown in the app are the fares agreed with the operator or association for that route. The fare you see at the moment of booking is the fare you pay for that seat.",
            "Passengers may pay in the app, or in cash or by card on board where the gaatjie records a walk-up booking. Cash fares are collected by the gaatjie and are the operator's responsibility to account for.",
            "Refunds are handled as follows:",
            [
                "Cancel more than 30 minutes before the scheduled departure and the fare is refunded in full to your Quallor credits.",
                "Cancel within 30 minutes of departure and the fare is not refunded, because the seat is unlikely to be resold.",
                "If the operator cancels the trip, the vehicle does not arrive, or the vehicle is withdrawn on safety grounds, the fare is refunded in full regardless of timing.",
            ],
            "Quallor credits can be used against future bookings. They are not transferable and are not redeemable for cash.",
        ],
    },
    {
        heading: "Passenger conduct",
        blocks: [
            "While travelling on a Quallor booking you must:",
            [
                "Wear a seatbelt where one is fitted.",
                "Occupy only the seat shown on your ticket unless the gaatjie moves you.",
                "Follow reasonable instructions from the driver and gaatjie.",
                "Refrain from smoking, from carrying alcohol open for consumption, and from carrying anything unlawful or dangerous.",
                "Treat other passengers and crew without abuse, harassment or discrimination.",
            ],
            "A driver or gaatjie may refuse to carry a passenger, or may ask a passenger to leave the vehicle at a safe place, where that passenger's behaviour puts other people at risk. Repeated breaches may lead to your account being suspended.",
        ],
    },
    {
        heading: "Driver and gaatjie obligations",
        blocks: [
            "If you drive or conduct a vehicle on the Quallor network you agree to:",
            [
                "Hold and maintain a valid licence, a valid professional driving permit where required, and valid vehicle registration and operating authority.",
                "Keep the vehicle roadworthy and present it for every assessment scheduled in the fleet register.",
                "Carry only as many passengers as the vehicle is licensed to carry, and never oversell a seat that Quallor has already reserved.",
                "Scan or confirm each passenger on boarding, so the manifest is accurate if there is an incident.",
                "Record walk-up fares honestly, whether taken in cash or by card.",
                "Never operate a vehicle while under the influence of alcohol or any substance that impairs driving.",
            ],
            "The device supplied for gaatjie mode stays the property of Quallor and must be used only for Quallor operations on the vehicle it is assigned to.",
        ],
    },
    {
        heading: "Operator obligations",
        blocks: [
            "Operators and associations listing vehicles on Quallor are responsible for the vehicles and the crews they list. You agree to:",
            [
                "Keep insurance in place that covers passengers carried for reward.",
                "Ensure every vehicle listed holds a valid operating licence for the routes it runs.",
                "Present each vehicle for roadworthy, safety, cleanliness and driver conduct assessment on the schedule kept in the fleet register.",
                "Withdraw any vehicle that fails an assessment until the failure is corrected and the vehicle is re-assessed.",
                "Respond to passenger complaints referred to you within seven days.",
            ],
            "Quallor may suspend a vehicle or an operator from the network where a safety assessment is failed, where an operating licence lapses, or where complaints indicate a risk to passengers. A suspension notice states the reason and the period, which is ordinarily 28 days pending correction.",
        ],
    },
    {
        heading: "Safety features",
        blocks: [
            "The app includes an emergency SOS button, trusted contact sharing and live trip sharing. These features send alerts to the contacts you have chosen and, where you have enabled it, prompt a call to emergency services.",
            "These are assistance tools, not an emergency response service. Quallor does not operate an emergency control room and cannot guarantee that an alert will be delivered, that a contact will act on it, or that mobile coverage will be available. In a genuine emergency, call 10111 or 112 directly.",
        ],
    },
    {
        heading: "Availability and offline use",
        blocks: [
            "Parts of Quallor work offline so that a ticket can still be shown and a boarding still recorded where there is no signal. Records created offline sync when the device reconnects.",
            "We do not promise uninterrupted availability. We may suspend the service for maintenance, and we may change or withdraw features. Where a change materially reduces what you have already paid for, we will refund the affected booking.",
        ],
    },
    {
        heading: "Liability",
        blocks: [
            "Nothing in these terms excludes liability that cannot lawfully be excluded, including liability for death or personal injury caused by negligence, and nothing limits your rights under the Consumer Protection Act 68 of 2008.",
            "Subject to that, Quallor is not liable for the acts or omissions of an operator, driver or gaatjie, for delays or cancellations caused by traffic, weather, road closures, protest action or vehicle breakdown, or for indirect loss such as missed appointments or lost earnings.",
            "Where we are found liable in connection with a booking, our liability is limited to the fare paid for that booking.",
        ],
    },
    {
        heading: "Suspending or closing an account",
        blocks: [
            "You may close your account at any time from the profile screen. Bookings already paid for remain valid until they are used or cancelled.",
            "We may suspend or close an account where these terms are breached, where documents required for a driver or operator account lapse, where we are required to do so by law, or where an account is used fraudulently. Where we suspend an account we tell you why, and you may respond by writing to the address below.",
        ],
    },
    {
        heading: "Changes to these terms",
        blocks: [
            "We may update these terms. Where a change materially affects your rights we will notify you in the app at least 14 days before it takes effect. Continuing to use Quallor after that date means you accept the updated terms.",
        ],
    },
    {
        heading: "Governing law and contact",
        blocks: [
            "These terms are governed by the law of the Republic of South Africa, and the courts of the Eastern Cape have jurisdiction.",
            "Quallor, East London, Eastern Cape. Email legal@quallor.co.za for legal notices and support@quallor.co.za for everything else.",
            "This document is a plain-language operating agreement prepared for the Quallor platform. It should be reviewed by a qualified South African attorney before the service goes live commercially.",
        ],
    },
];

export default function TermsPage() {
    return (
        <LegalPage
            title="Terms of Service"
            subtitle="The agreement between Quallor and everyone who uses the network: passengers, drivers, gaatjies and operators."
            effective="17 August 2026"
            sections={SECTIONS}
            sibling={{ label: "Read the Privacy Policy", href: "/privacy" }}
        />
    );
}
