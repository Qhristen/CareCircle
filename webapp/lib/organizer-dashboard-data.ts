import {
  getCircleBackers,
  getCircleWishlist,
  type Backer,
} from "@/lib/circle-data";
import { presentOccasion } from "@/lib/circle-presenters";
import type { Circle } from "@/types";

export type DashboardPaymentFilter = "All" | "Bank Transfer" | "Card";

export type DashboardContributor = {
  id: string;
  initials: string;
  name: string;
  meta: string;
  amount: number;
  allocation: string;
  rail: string;
  note: string;
  accent: "primary" | "secondary" | "tertiary" | "neutral";
  method: Exclude<DashboardPaymentFilter, "All">;
  anonymous?: boolean;
};

export type DashboardWishlistItem = {
  id: string;
  emoji: string;
  name: string;
  description: string;
  raised: number;
  goal: number;
  complete: boolean;
};

export type OrganizerDashboardData = {
  circleCode: string;
  createdAt: string;
  recipientName: string;
  summary: string;
  fundedPercent: number;
  remaining: number;
  averageContribution: number;
  claimedItems: number;
  blessingCount: number;
  vendorName: string;
  bundleName: string;
  contributors: DashboardContributor[];
  wishlist: DashboardWishlistItem[];
};

const knownRecipients: Record<string, string> = {
  "sarah-new-baby": "Sarah & Baby",
  "david-birthday": "David",
  "daniel-recovery": "Brother Daniel",
  "amaka-tunde-wedding": "Amaka & Tunde",
  "blessing-bar-exam": "Blessing",
  "mama-ronke-jubilee": "Mama Ronke",
};

const supporterNames = [
  "Amaka Kalu",
  "Tolu Babatunde",
  "Chidinma Okafor",
  "John Eze",
  "David Nwachukwu",
  "Kemi Afolayan",
  "Ifeoma Okoro",
  "Femi Balogun",
  "Amina Yusuf",
  "Tunde Bello",
  "Nneka Obi",
  "Chidi Eze",
  "Yetunde Lawal",
  "Bola Adeyemi",
  "Ngozi Nwosu",
  "Musa Ibrahim",
];

const rails = [
  {
    label: "GTBank Transfer",
    badge: "Direct Escrow NGN",
    method: "Bank Transfer" as const,
  },
  {
    label: "Paystack (Mastercard)",
    badge: "Card Instant",
    method: "Card" as const,
  },
  {
    label: "Zenith USSD",
    badge: "USSD Cleared",
    method: "Bank Transfer" as const,
  },
  {
    label: "Access Bank",
    badge: "Direct Escrow NGN",
    method: "Bank Transfer" as const,
  },
  {
    label: "Kuda Bank",
    badge: "Instant EFT",
    method: "Bank Transfer" as const,
  },
  {
    label: "Flutterwave (Visa)",
    badge: "Card Instant",
    method: "Card" as const,
  },
];

const accents: DashboardContributor["accent"][] = [
  "primary",
  "secondary",
  "tertiary",
  "neutral",
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function stableCode(value: string) {
  let hash = 0;
  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) % 10000;
  }
  return String(hash).padStart(4, "0");
}

function backerToContributor(
  backer: Backer,
  index: number,
  wishlist: DashboardWishlistItem[],
): DashboardContributor {
  const rail = rails[index % rails.length];
  return {
    id: backer.id,
    initials: backer.initials,
    name: backer.name,
    meta: `${index === 0 ? "Today, 2:14 PM" : index < 3 ? "Today, 11:40 AM" : "Yesterday, 4:05 PM"} • ${rail.label}`,
    amount: backer.amount,
    allocation:
      backer.item ??
      (index % 3 === 0 && wishlist.length
        ? wishlist[index % wishlist.length].name
        : "General Support Fund"),
    rail: rail.badge,
    note:
      backer.message ||
      "Proud to be part of this circle and its community of care.",
    accent: backer.accent,
    method: rail.method,
    anonymous: backer.anonymous,
  };
}

function buildContributorRoster(
  circle: Circle,
  wishlist: DashboardWishlistItem[],
) {
  const initial = getCircleBackers(circle).map((backer, index) =>
    backerToContributor(backer, index, wishlist),
  );

  const supporterCount =
    circle.funding?.supporterCount ?? circle.supporterCount ?? 0;

  return Array.from({ length: supporterCount }, (_, index) => {
    if (initial[index]) return initial[index];

    const name = supporterNames[index % supporterNames.length];
    const rail = rails[index % rails.length];
    const amountOptions = [2500, 5000, 7500, 10000, 15000];
    return {
      id: `${circle.id}-supporter-${index + 1}`,
      initials: initials(name),
      name,
      meta: `${index < 9 ? "May 19" : "May 18"}, ${8 + (index % 10)}:${index % 2 ? "40" : "15"} ${index % 3 ? "AM" : "PM"} • ${rail.label}`,
      amount: amountOptions[index % amountOptions.length],
      allocation:
        index % 3 === 0 && wishlist.length
          ? wishlist[index % wishlist.length].name
          : "General Support Fund",
      rail: rail.badge,
      note: `Sending warm wishes and practical support to ${knownRecipients[circle.id] ?? circle.title}.`,
      accent: accents[index % accents.length],
      method: rail.method,
    } satisfies DashboardContributor;
  });
}

export function getOrganizerDashboardData(
  circle: Circle,
): OrganizerDashboardData {
  const wishlist = getCircleWishlist(circle).map((item) => ({
    id: item.id,
    emoji: item.emoji,
    name: item.name,
    description: item.description,
    raised: item.raised,
    goal: item.goal,
    complete: item.raised >= item.goal,
  }));
  const recipientName = knownRecipients[circle.id] ?? circle.title;
  const presentation = presentOccasion(circle.occasion);
  const raised = circle.funding
    ? circle.funding.raisedKobo / 100
    : Number(circle.amountRaised ?? 0);
  const goal = circle.funding
    ? circle.funding.goalKobo / 100
    : Number(circle.targetAmount ?? 0);
  const supporterCount =
    circle.funding?.supporterCount ?? circle.supporterCount ?? 0;
  const city =
    circle.city ||
    circle.recipient?.city ||
    circle.recipientCity ||
    circle.countryCode ||
    circle.recipient?.countryCode ||
    circle.recipientCountryCode ||
    "Nigeria";
  const fundedPercent =
    circle.funding?.percent ??
    (goal > 0 ? Math.round((raised / goal) * 100) : 0);

  return {
    circleCode: `GC-${city.toUpperCase().replace(/\s+/g, "-")}-${stableCode(circle.id)}`,
    createdAt: "Recently created",
    recipientName,
    summary: `Managing ${presentation.label.toLowerCase()} support for ${recipientName} with transparent contributions, item fulfillment, and community updates from ${city}.`,
    fundedPercent,
    remaining: Math.max(goal - raised, 0),
    averageContribution: Math.round(raised / Math.max(supporterCount, 1)),
    claimedItems: wishlist.filter((item) => item.complete).length,
    blessingCount: Math.max(supporterCount - 4, 0),
    vendorName: `CareCircle Verified Vendor (${city} Hub)`,
    bundleName: `${recipientName}'s ${presentation.label} Care Bundle`,
    contributors: buildContributorRoster(circle, wishlist),
    wishlist,
  };
}
