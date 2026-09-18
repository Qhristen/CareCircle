import type { Metadata } from "next";
import { OrganizerDashboardRoute } from "@/components/organizer/organizer-dashboard-route";

type OrganizerCirclePageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Organizer Dashboard",
  description: "Manage contributions, fulfillment, and updates for your CareCircle.",
};

export default async function OrganizerCirclePage({
  params,
}: OrganizerCirclePageProps) {
  const { id } = await params;
  return <OrganizerDashboardRoute circleId={id} />;
}
