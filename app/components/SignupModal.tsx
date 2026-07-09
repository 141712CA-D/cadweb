"use client";

import { useEffect } from "react";
import SignupForm from "./SignupForm";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignupModal({ isOpen, onClose }: SignupModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 pointer-events-none ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0"
        }`}
        onClick={onClose}
        style={{ zIndex: 60 }}
      />

      {/* Modal - overlays over DevBanner (z-60) */}
      <div
        className="fixed right-0 top-0 h-full w-full max-w-2xl bg-[#0f0f0f] border-l border-[#262626] overflow-y-auto transition-transform duration-500 ease-out"
        style={{
          zIndex: 70,
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Close button - sticky so it stays visible */}
        <div className="sticky top-0 flex items-center justify-end p-4 border-b border-[#262626] bg-[#0f0f0f]/95 backdrop-blur-sm z-10">
          <button
            onClick={onClose}
            className="cursor-pointer p-2 text-[#555] hover:text-[#00ff41] hover:bg-[#161616] transition-all duration-150"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="p-6 sm:p-8">
          <SignupForm isModal={true} onSuccess={onClose} />
        </div>
      </div>
    </>
  );
}
