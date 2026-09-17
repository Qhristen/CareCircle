export type Occasion = {
  id: string;
  emoji: string;
  label: string;
  note: string;
};

export type WishlistItem = {
  id: number;
  emoji: string;
  name: string;
  category: string;
  description: string;
  price: number;
  priceNote: string;
  accent: "primary" | "secondary" | "tertiary";
};

export const wizardSteps = [
  "Recipient & Occasion",
  "Story & Motivation",
  "Bundle & Wishlist",
  "Privacy & Logistics",
  "Review & Publish",
];

export const occasions: Occasion[] = [
  { id: "birthday", emoji: "🎉", label: "Birthday", note: "Celebration" },
  { id: "baby", emoji: "🍼", label: "New Baby", note: "Blessing" },
  { id: "wedding", emoji: "💍", label: "Wedding", note: "Union" },
  { id: "recovery", emoji: "🌿", label: "Recovery", note: "Wellness" },
  { id: "bereavement", emoji: "🕊️", label: "Bereavement", note: "Solidarity" },
  { id: "graduation", emoji: "🎓", label: "Graduation", note: "Achievement" },
  { id: "housewarming", emoji: "🏠", label: "Housewarming", note: "New Nest" },
  // { id: "aid", emoji: "🤝", label: "Harambee Aid", note: "Community" },
  { id: "other", emoji: "✍️", label: "Other", note: "Custom occasion" },
];
