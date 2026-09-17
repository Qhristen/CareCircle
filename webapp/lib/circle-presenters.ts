import type { CircleCategory } from "@/lib/explore-data";

type OccasionPresentation = {
  category: CircleCategory;
  label: string;
  emoji: string;
  accent: "primary" | "secondary" | "tertiary";
};

const occasionPresentations: Record<string, OccasionPresentation> = {
  birthday: { category: "celebrations", label: "Celebration", emoji: "🎉", accent: "primary" },
  housewarming: { category: "celebrations", label: "Housewarming", emoji: "🏠", accent: "primary" },
  "community-support": { category: "celebrations", label: "Community Support", emoji: "🤝", accent: "secondary" },
  wedding: { category: "weddings", label: "Wedding", emoji: "💍", accent: "primary" },
  "new-baby": { category: "new-baby", label: "New Baby", emoji: "🍼", accent: "primary" },
  graduation: { category: "education", label: "Education", emoji: "🎓", accent: "tertiary" },
  bereavement: { category: "bereavement", label: "Bereavement & Care", emoji: "🕊️", accent: "tertiary" },
  health: { category: "health", label: "Health & Recovery", emoji: "🌿", accent: "secondary" },
  recovery: { category: "health", label: "Health & Recovery", emoji: "🌿", accent: "secondary" },
  emergency: { category: "emergency", label: "Emergency Aid", emoji: "🚨", accent: "tertiary" },
  "emergency-assistance": { category: "emergency", label: "Emergency Aid", emoji: "🚨", accent: "tertiary" },
};

export function presentOccasion(occasion: string): OccasionPresentation {
  return occasionPresentations[occasion] ?? {
    category: "celebrations",
    label: "Community Circle",
    emoji: "🎁",
    accent: "primary",
  };
}

export function daysUntil(value: string) {
  const milliseconds = new Date(value).getTime() - Date.now();
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return null;
  return Math.ceil(milliseconds / 86_400_000);
}

export function nairaFromKobo(value: number) {
  return `₦${new Intl.NumberFormat("en-NG").format(Math.round(value / 100))}`;
}
