import { CircleDiscovery } from "@/components/explore/circle-discovery";
import { ExploreHero } from "@/components/explore/explore-hero";
import { HowItWorks } from "@/components/explore/how-it-works";

export function ExplorePage({ initialQuery = "" }: { initialQuery?: string }) {
  return (
    <main className="min-h-screen bg-surface">
      <ExploreHero />
      <CircleDiscovery initialQuery={initialQuery} />
      <HowItWorks />
    </main>
  );
}
