import type { Metadata } from "next";
import { CircleDetailsPage } from "@/components/circle-detail/circle-details-page";

type CirclePageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Support a CareCircle",
  description: "View this circle's wishlist and contribute securely.",
};

export default async function CirclePage({ params }: CirclePageProps) {
  const { id } = await params;
  return <CircleDetailsPage circleId={id} />;
}
