import type { Metadata } from "next";
import { ExplorePage } from "@/components/explore/explore-page";

export const metadata: Metadata = {
  title: "Explore Community Circles",
  description:
    "Discover active GiftCircles for celebrations, care, education, and community support across Nigeria.",
};

export default async function ExploreCirclesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const query = (await searchParams).q;
  const initialQuery = Array.isArray(query) ? query[0] : query;

  return <ExplorePage initialQuery={initialQuery ?? ""} />;
}
