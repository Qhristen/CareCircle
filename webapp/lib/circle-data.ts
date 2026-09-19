import type { Circle } from "@/types";

export type WishlistDetailItem = {
  id: string;
  emoji: string;
  name: string;
  description: string;
  goal: number;
  raised: number;
  accent: "primary" | "secondary" | "tertiary";
  completionNote?: string;
  suggestedAmount?: number;
};

export type Backer = {
  id: string;
  initials: string;
  name: string;
  amount: number;
  amountHidden?: boolean;
  time: string;
  message: string;
  item?: string;
  anonymous?: boolean;
  accent: "primary" | "secondary" | "tertiary" | "neutral";
};

export const sarahHeroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC8eWA9ffr6YbqPdhuwJzqfBhrPG2_abJQzE81-g2n6hGDI5Ff7i5lJSY0NjxsSI15kLHyju59rw5eifB_GUkqC7eg4yTCcrh3ZUjWl7yQR3B-b_4wEEkICFTgBGlSImgzys1VaowkOa3gHm_zEQJNKuxEIyszQ-kfqo-t52Fw9pab8v1kOVrJrZKKfBNT6Qnu9oxggMuF2AhCmNWxhXomX5i4mg1jxiXYwKcmAQIaUzCMPSJ-ppyNuRA";

export const sarahWishlist: WishlistDetailItem[] = [
  {
    id: "diapers",
    emoji: "🧷",
    name: "Premium Diapers & Eco Wipes Supply (3 Months)",
    description:
      "Huggies Pure Newborn and WaterWipes reserve with direct wholesale fulfillment.",
    goal: 45000,
    raised: 45000,
    accent: "secondary",
    completionNote: "Completed by 4 friends",
  },
  {
    id: "carrier",
    emoji: "👶🏽",
    name: "Ergonomic Baby Carrier & Wrap",
    description:
      "Breathable orthopedic newborn sling for hands-free skin-to-skin bonding.",
    goal: 50000,
    raised: 35000,
    accent: "primary",
    suggestedAmount: 15000,
  },
  {
    id: "clothes",
    emoji: "🧸",
    name: "Organic Baby Clothing Set & Swaddles",
    description:
      "Organic cotton sleepsuits, scratch mittens, and temperature-regulating muslin swaddles.",
    goal: 30000,
    raised: 30000,
    accent: "secondary",
    completionNote: "Generously supported by David O.",
  },
  {
    id: "meals",
    emoji: "🍲",
    name: "Nutritious Postpartum Mommy Meals & Grocery Care Pack",
    description:
      "Pre-cooked soups, healing broths, lactation teas, and wholesome groceries.",
    goal: 60000,
    raised: 40000,
    accent: "tertiary",
    suggestedAmount: 5000,
  },
  {
    id: "rocker",
    emoji: "🪁",
    name: "Baby Nursery Rocker & Playmat",
    description: "Sensory arch activity mat and cushioned nursing soothing seat.",
    goal: 35000,
    raised: 10000,
    accent: "primary",
    suggestedAmount: 5000,
  },
];

export const initialSarahBackers: Backer[] = [
  {
    id: "amaka",
    initials: "AK",
    name: "Amaka K.",
    amount: 10000,
    time: "14 mins ago",
    message:
      "Congratulations Sarah! So excited to meet baby Noah ❤️ Rest well mama, you did marvelously!",
    accent: "primary",
  },
  {
    id: "david",
    initials: "DO",
    name: "David O.",
    amount: 30000,
    time: "1 hour ago",
    item: "Organic Baby Clothing Set & Swaddles",
    message:
      "God bless the new arrival! Wishing baby Noah abundant joy and good health always.",
    accent: "secondary",
  },
  {
    id: "anonymous",
    initials: "?",
    name: "Anonymous Colleague",
    amount: 5000,
    time: "3 hours ago",
    message:
      "Sending you all the love and restful sleep! You've got an army backing you.",
    anonymous: true,
    accent: "neutral",
  },
  {
    id: "grace",
    initials: "GF",
    name: "Grace & Family",
    amount: 20000,
    time: "5 hours ago",
    message:
      "Warmest congratulations to the entire family! Take all the time you need to heal.",
    accent: "tertiary",
  },
  {
    id: "tobi",
    initials: "TA",
    name: "Tobi A.",
    amount: 5000,
    time: "Yesterday",
    message: "Welcome to the world, Noah. Your village is already here for you!",
    accent: "secondary",
  },
  {
    id: "ledger",
    initials: "KM",
    name: "Kemi M.",
    amount: 10000,
    time: "Yesterday",
    message: "",
    accent: "primary",
  },
];

const detailAccents: WishlistDetailItem["accent"][] = [
  "primary",
  "secondary",
  "tertiary",
];

export function getCircleWishlist(circle: Circle): WishlistDetailItem[] {
  if (circle.id === "sarah-new-baby") {
    return sarahWishlist.map((item) => ({ ...item }));
  }

  const wishlistPreview =
    circle.wishlistPreview ??
    circle.wishlist?.map((item) => ({
      id: item.id,
      name: item.name,
      emoji: item.emoji,
    })) ??
    circle.items?.map((item) => ({
      id: item.id,
      name: item.name,
      emoji: item.emoji,
    })) ??
    [];
  if (!wishlistPreview.length) return [];

  const circleGoal = circle.funding
    ? circle.funding.goalKobo / 100
    : Number(circle.targetAmount ?? 0);
  const circleRaised = circle.funding
    ? circle.funding.raisedKobo / 100
    : Number(circle.amountRaised ?? 0);
  const fundingRatio = Math.min(circleRaised / Math.max(circleGoal, 1), 1);
  const averageGoal =
    Math.round(circleGoal / wishlistPreview.length / 500) * 500;
  let assignedGoal = 0;

  return wishlistPreview.map((item, index) => {
    const isLast = index === wishlistPreview.length - 1;
    const goal = isLast ? circleGoal - assignedGoal : averageGoal;
    assignedGoal += goal;
    const raised = Math.min(
      goal,
      Math.round((goal * fundingRatio) / 500) * 500,
    );

    return {
      id: item.id,
      emoji: item.emoji || "🎁",
      name: item.name,
      description: `A verified ${item.name.toLowerCase()} priority selected by the circle organizer.`,
      goal,
      raised,
      accent: detailAccents[index % detailAccents.length],
      completionNote: raised >= goal ? "Secured by the community" : undefined,
      suggestedAmount: Math.min(5000, Math.max(goal - raised, 500)),
    };
  });
}

export function getCircleBackers(circle: Circle): Backer[] {
  if (circle.id === "sarah-new-baby") {
    return initialSarahBackers.map((backer) => ({ ...backer }));
  }

  return [
    {
      id: `${circle.id}-community-friend`,
      initials: "CF",
      name: "Community Friend",
      amount: 10000,
      time: "18 mins ago",
      message: "Proud to be part of this circle. Sending love and strength!",
      accent: "primary",
    },
    {
      id: `${circle.id}-anonymous`,
      initials: "?",
      name: "Anonymous Supporter",
      amount: 5000,
      time: "1 hour ago",
      message: "May every contribution bring this beautiful goal closer.",
      anonymous: true,
      accent: "neutral",
    },
    {
      id: `${circle.id}-family`,
      initials: "FF",
      name: "Family & Friends",
      amount: 15000,
      time: "3 hours ago",
      message: "Your whole community is cheering you on!",
      accent: "secondary",
    },
    {
      id: `${circle.id}-well-wisher`,
      initials: "AW",
      name: "A Well-Wisher",
      amount: 5000,
      time: "Yesterday",
      message: "Warm wishes from one village to another.",
      accent: "tertiary",
    },
  ];
}
