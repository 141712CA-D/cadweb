"use client";

import SignupForm from "@/app/components/SignupForm";
import Footer from "@/app/components/Footer";

export default function SignupPage() {
  return (
    <>
      <SignupForm />
      <Footer currentPage="signup" />
    </>
  );
}
