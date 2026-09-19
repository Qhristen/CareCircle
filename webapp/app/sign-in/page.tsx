import type { Metadata } from "next";
import { SignInPageContent } from "@/components/auth/sign-in-page-content";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to manage your CareCircle account, circles, and contributions.",
};

export default function SignInPage() {
  return <SignInPageContent />;
}
