export type CircleCategory =
  | "celebrations"
  | "new-baby"
  | "weddings"
  | "health"
  | "bereavement"
  | "education"
  | "emergency";

export type Circle = {
  id: string;
  title: string;
  category: CircleCategory;
  categoryLabel: string;
  categoryEmoji: string;
  city: string;
  organizer: string;
  image: string;
  imageAlt: string;
  wishlist: Array<{ label: string; emoji: string }>;
  raised: number;
  goal: number;
  contributors: number;
  daysLeft: number | null;
  actionLabel: string;
  accent: "primary" | "secondary" | "tertiary";
  createdOrder: number;
};

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

export const circles: Circle[] = [
  {
    id: "sarah-new-baby",
    title: "Sarah's New Baby Welcome Circle",
    category: "new-baby",
    categoryLabel: "New Baby",
    categoryEmoji: "🍼",
    city: "Lagos, NG",
    organizer: "Chioma Adeyemi",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCDtxQvfp4Hvae4fKYGlNqHvkK-x0Asb761kPAG9EQpptXFvfKzoSreU5POzev7RbfE0V9_3_c0fSaP93Gv0VBw_czlYCEnu8l0FgPh9PMNrSJL3l6QA5eLUBwfrM7OqjUkQjWlleXjG6OkYqJWLLNgyAzup6wKR64PYFbPEpn_991PmQIf5RuWABcMc3IIFforNqm-wmrZaN2QEnW4xlTmwaICwrsChdmiARQES2uFA9nQ1j7oE_3BdA",
    imageAlt: "A newborn baby sleeping peacefully in warm sunlight",
    wishlist: [
      { label: "Diapers (6mo)", emoji: "📦" },
      { label: "Stroller", emoji: "🛒" },
      { label: "Mama Meal Kit", emoji: "🥣" },
    ],
    raised: 185000,
    goal: 220000,
    contributors: 42,
    daysLeft: 4,
    actionLabel: "Chip In Now",
    accent: "primary",
    createdOrder: 3,
  },
  {
    id: "david-birthday",
    title: "David's 30th Birthday Surprise",
    category: "celebrations",
    categoryLabel: "30th Birthday",
    categoryEmoji: "🎂",
    city: "Abuja, NG",
    organizer: "Kemi & Femi",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC2Z-uZhGSPuXsLD9CxAfeBRDHaUJHEq9nfxxw0WE13hkICVztg5QjrIylIOu3Hepdb77ytg38KVqsFQ8z_EMevAVyVfz6knWcYfh_99RrHxtbnYewZSf6DqEZE3P7uk5doP78wxkrKyHkNde0fYiwTCVIV724L6NfbuRvBtRdazQZ4RZg0y_KAnMBMfM3u55EidTHWyzvrF-MzbtLTqIy7VbMnadq3BN6_ADCpIlypnUAaHuwsvPj0Lw",
    imageAlt: "Close friends celebrating a birthday together in Abuja",
    wishlist: [
      { label: "Studio Monitors", emoji: "🎧" },
      { label: "Weekend Getaway", emoji: "✈️" },
      { label: "Leather Journal", emoji: "📔" },
    ],
    raised: 132000,
    goal: 150000,
    contributors: 21,
    daysLeft: 2,
    actionLabel: "Chip In Now",
    accent: "tertiary",
    createdOrder: 5,
  },
  {
    id: "daniel-recovery",
    title: "Support Brother Daniel's Recovery",
    category: "health",
    categoryLabel: "Health & Care",
    categoryEmoji: "🌿",
    city: "Ibadan, NG",
    organizer: "Ibadan Alumni Union",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAu64NHlQ-RTWRZzwMWsJwu1U332WtvxWxHYBjYI5P2hqEFtKPfETwdZ_ALh8izROGjGSb7iCHVMxXEuuYL82HU-5pUeJWZQppXDCmr7nJXU83yTHfM45jhBksjisGQB9_9wb3ow1bWkZ9kjbUSQQ4VkxAAsEcbFoI95sbtiwZNmRjwQVnHNZDptObUsxKUofLG3eZAYoiXZ5xMu0VvxYHDPACXtOjJgE3gxhJbhg41rTInVqCn7CHw7g",
    imageAlt: "Two hands held together in a gesture of care and support",
    wishlist: [
      { label: "Physio & Meds", emoji: "💊" },
      { label: "Grocery Care Basket", emoji: "🥘" },
    ],
    raised: 380000,
    goal: 500000,
    contributors: 54,
    daysLeft: 6,
    actionLabel: "Contribute Aid",
    accent: "secondary",
    createdOrder: 2,
  },
  {
    id: "amaka-tunde-wedding",
    title: "Amaka & Tunde's Honeymoon & Kitchen",
    category: "weddings",
    categoryLabel: "Wedding",
    categoryEmoji: "💍",
    city: "Enugu, NG",
    organizer: "Bridal Train 2025",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAGCJzBmOeViLlKGr0719EmQemTmnF2z6kbr1nb5t-9vAt8lGRPPofmlF1KxTSTjjxkZOZZ40VBGJAsOL0ACm1R4LtzDsl0_W2hEkOW_KUl7kuZz0web3g_lvQuqVO7NsXj4J8R2EG6pt9EOUxTv5glQXPfD3lrU0yb0EdLRR0TPuL2qBKnGab5iMKadzo1sKcCnENymJ0Hw-IqBWLHvLtga1QoZE8dGceRezDdXxq1KM2d8-J3KmXRTQ",
    imageAlt: "A joyful Nigerian newlywed couple in gold and coral attire",
    wishlist: [
      { label: "Air Fryer & Blender", emoji: "🍳" },
      { label: "Zanzibar Stay", emoji: "🏝️" },
    ],
    raised: 410000,
    goal: 450000,
    contributors: 38,
    daysLeft: 3,
    actionLabel: "Chip In Now",
    accent: "primary",
    createdOrder: 4,
  },
  {
    id: "blessing-bar-exam",
    title: "Blessing's Bar Exam Prep & Laptop",
    category: "education",
    categoryLabel: "Education",
    categoryEmoji: "🎓",
    city: "Port Harcourt, NG",
    organizer: "Law Class of '24",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCrSYttjH4RY79L3MNoEZqednuolKsCaxeZXXqRA7JuRV8cmzecqEDtoGMOf_CFCnMPJkF_O9F4fS7IWvpE4eNkrHnKYgwXwKqUOfVadI9X8xuc-kF9K0bsm0sz5vz323fPQooRQg89G9vxCUHotaAhHkq9xVb610loimp_Coqk-QEfBdmI1H1M_VrQ-jUeMGJwlTvHDdaYcR6w2RIVc8BWzixxffGZQKMrgkWmVR3axUOMQDbRH6iwBA",
    imageAlt: "A law student studying in a sunlit university library",
    wishlist: [
      { label: "Refurbished MacBook", emoji: "💻" },
      { label: "Law Compendium", emoji: "📚" },
    ],
    raised: 240000,
    goal: 280000,
    contributors: 29,
    daysLeft: 8,
    actionLabel: "Support Blessing",
    accent: "tertiary",
    createdOrder: 6,
  },
  {
    id: "mama-ronke-jubilee",
    title: "Mama Ronke's 70th Milestone Jubilee",
    category: "celebrations",
    categoryLabel: "103% Funded!",
    categoryEmoji: "🎊",
    city: "Lagos, NG",
    organizer: "The Balogun Grandchildren",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDIz5A-PbHg-nirbvLB1tomiiKdnpayW_7_Yn-b1onb7RENov6s0qt236fGBLYOGrW4uLcHwHBplSPh1jnYfhFDWs6kIfZoYIKwOblm1W0DruDz2AXeJrZmng_FfaexKfG9pX0jYxlrAGMPhvVzXl4IJXelJyMKC0GEBM9ezkyKg46LuJvVO4AgXJOmUMUG9O2KS8F2xQ1t77LEAC7myN75aSq6Jiwamwj6lkB2oUVJozmPIfXlyRhmDg",
    imageAlt: "A Nigerian matriarch celebrating her birthday with family",
    wishlist: [
      { label: "Family Portrait Canvas", emoji: "🖼️" },
      { label: "Wellness Retreat", emoji: "🌸" },
    ],
    raised: 620000,
    goal: 600000,
    contributors: 68,
    daysLeft: null,
    actionLabel: "Send a Blessing Note",
    accent: "secondary",
    createdOrder: 1,
  },
];

export const spotlightImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAu64NHlQ-RTWRZzwMWsJwu1U332WtvxWxHYBjYI5P2hqEFtKPfETwdZ_ALh8izROGjGSb7iCHVMxXEuuYL82HU-5pUeJWZQppXDCmr7nJXU83yTHfM45jhBksjisGQB9_9wb3ow1bWkZ9kjbUSQQ4VkxAAsEcbFoI95sbtiwZNmRjwQVnHNZDptObUsxKUofLG3eZAYoiXZ5xMu0VvxYHDPACXtOjJgE3gxhJbhg41rTInVqCn7CHw7g";
