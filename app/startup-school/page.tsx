import type { Metadata } from "next";
import StartupSchoolForm from "@/app/components/StartupSchoolForm";
import Footer from "@/app/components/Footer";

// Hidden page — not linked from anywhere and kept out of search indexes. Reached only via the
// direct /startup-school URL. Same waitlist experience as the modal, but the reason/usage is
// locked to "Startup School" and the submit is gated by the server-only JWT_STARTUP_SCHOOL_TOKEN.
export const metadata: Metadata = {
  title: "Startup School — Parametra",
  robots: { index: false, follow: false },
};

export default function StartupSchoolPage() {
  return (
    <>
      <StartupSchoolForm />
      <Footer currentPage="signup" />
    </>
  );
}
