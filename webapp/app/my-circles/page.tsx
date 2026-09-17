import type { Metadata } from "next";
import { MyCirclesPage } from "@/components/my-circles/my-circles-page";

export const metadata: Metadata = {
  title: "My Circles",
  description: "View and manage the GiftCircles you organize.",
};

export default function MyCirclesRoute() {
  return <MyCirclesPage />;
}
