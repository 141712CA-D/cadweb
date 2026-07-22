"use client";

import Link from "next/link";
import ContactForm from "@/app/components/ContactForm";
import SocialLinks from "@/app/components/SocialLinks";

export default function ContactPage() {
  return (
    <>
      <ContactForm />
      <footer className="bg-[#0f0f0f] border-t border-[#262626] py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <p className="font-mono text-xs text-[#555]">© {new Date().getFullYear()} Parametra</p>
            <SocialLinks />
          </div>
          <div className="grid grid-cols-3 gap-x-6 gap-y-3 sm:flex sm:items-center sm:gap-6">
            <Link href="/how-it-works" className="font-mono text-xs text-[#555] hover:text-[#00ff41] transition-colors">How It Works</Link>
            <a href="https://discord.gg/4CDr6ZyFd" target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-[#555] hover:text-[#00ff41] transition-colors">Join Discord</a>
            <Link href="/signup" className="font-mono text-xs text-[#555] hover:text-[#00ff41] transition-colors">Join Waitlist</Link>
            <Link href="/terms" className="font-mono text-xs text-[#555] hover:text-[#00ff41] transition-colors">Terms</Link>
            <Link href="/privacy-policy" className="font-mono text-xs text-[#555] hover:text-[#00ff41] transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
