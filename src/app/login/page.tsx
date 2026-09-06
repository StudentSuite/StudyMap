import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in · StudyMap",
  description:
    "Sign in to StudyMap to save places and manage your student map preferences.",
  robots: {
    index: false,
  },
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
