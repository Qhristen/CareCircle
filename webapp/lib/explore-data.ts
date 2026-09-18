export type CircleCategory =
  | "celebrations"
  | "new-baby"
  | "weddings"
  | "health"
  | "bereavement"
  | "education"
  | "emergency";

export const categories: Array<{
  value: "all" | CircleCategory;
  label: string;
}> = [
  { value: "all", label: "All Circles" },
  { value: "celebrations", label: "🎉 Celebrations & Birthdays" },
  { value: "new-baby", label: "🍼 New Baby" },
  { value: "weddings", label: "💍 Weddings" },
  { value: "health", label: "🌿 Health & Recovery" },
  { value: "bereavement", label: "🕊️ Bereavement & Care" },
  { value: "education", label: "🎓 Education" },
  { value: "emergency", label: "🚨 Emergency Aid" },
];

export const spotlightImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAu64NHlQ-RTWRZzwMWsJwu1U332WtvxWxHYBjYI5P2hqEFtKPfETwdZ_ALh8izROGjGSb7iCHVMxXEuuYL82HU-5pUeJWZQppXDCmr7nJXU83yTHfM45jhBksjisGQB9_9wb3ow1bWkZ9kjbUSQQ4VkxAAsEcbFoI95sbtiwZNmRjwQVnHNZDptObUsxKUofLG3eZAYoiXZ5xMu0VvxYHDPACXtOjJgE3gxhJbhg41rTInVqCn7CHw7g";
