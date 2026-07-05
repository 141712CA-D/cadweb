"use client";

import Link from "next/link";
import ContactForm from "@/app/components/ContactForm";

export default function ContactPage() {
  return (
    <>
      <ContactForm />
      <footer className="bg-slate-50 border-t border-slate-200 py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">Copyright {new Date().getFullYear()} Parametra. All rights reserved.</p>
          <div className="grid grid-cols-3 gap-x-6 gap-y-3 sm:flex sm:items-center sm:gap-6">
            <Link href="/how-it-works" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">How It Works</Link>
            <Link href="/about" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">About</Link>
            <Link href="/signup" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">Join Waitlist</Link>
            <Link href="/terms" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">Terms</Link>
            <Link href="/privacy-policy" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
