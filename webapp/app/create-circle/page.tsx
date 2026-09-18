import type { Metadata } from "next";
import { CreateCircleAccess } from "@/components/create-circle/create-circle-access";

export const metadata: Metadata = {
  title: "Create a CareCircle",
  description:
    "Build a transparent, itemized CareCircle for someone special and invite your community to contribute.",
};

export default function CreateCirclePage() {
  return <CreateCircleAccess />;
}
