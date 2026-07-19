"use client";

import Link from "next/link";
import ContactForm from "@/app/components/ContactForm";

export default function ContactPage() {
  return (
    <>
      <ContactForm />
      <footer className="bg-[#0f0f0f] border-t border-[#262626] py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono text-xs text-[#555]">© {new Date().getFullYear()} Parametra</p>
          <div className="grid grid-cols-3 gap-x-6 gap-y-3 sm:flex sm:items-center sm:gap-6">
            <Link href="/how-it-works" className="font-mono text-xs text-[#555] hover:text-[#00ff41] transition-colors">How It Works</Link>
            <Link href="/signup" className="font-mono text-xs text-[#555] hover:text-[#00ff41] transition-colors">Join Waitlist</Link>
            <Link href="/terms" className="font-mono text-xs text-[#555] hover:text-[#00ff41] transition-colors">Terms</Link>
            <Link href="/privacy-policy" className="font-mono text-xs text-[#555] hover:text-[#00ff41] transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
