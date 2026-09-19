import type { Metadata } from "next";
import { SignUpPageContent } from "@/components/auth/sign-up-page-content";

export const metadata: Metadata = {
  title: "Create Your Account",
  description: "Join CareCircle and start supporting the people and moments that matter.",
};

export default function SignUpPage() {
  return <SignUpPageContent />;
}
