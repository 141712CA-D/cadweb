"use client";

import { useEffect, useRef } from "react";
import SignupForm from "./SignupForm";
import { lockScroll, unlockScroll } from "@/lib/scrollLock";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignupModal({ isOpen, onClose }: SignupModalProps) {
  const lockedRef = useRef(false);

  useEffect(() => {
    if (isOpen && !lockedRef.current) {
      lockedRef.current = true;
      lockScroll();
    } else if (!isOpen && lockedRef.current) {
      lockedRef.current = false;
      unlockScroll();
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (lockedRef.current) {
        lockedRef.current = false;
        unlockScroll();
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // Mac keyboards label their backspace key "delete" — support it (and
      // the separate forward-delete "Delete" key) as a close shortcut too,
      // but only when focus isn't in a text field, so deleting a character
      // while typing in the form doesn't accidentally close the modal.
      if (e.key === "Backspace" || e.key === "Delete") {
        const target = e.target as HTMLElement | null;
        const isEditable =
          target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.tagName === "SELECT" || target?.isContentEditable;
        if (!isEditable) onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

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
        className="fixed right-0 top-0 h-full w-full max-w-2xl bg-[#f8fafc] border-l border-[#dbe6f5] overflow-y-auto transition-transform duration-500 ease-out"
        style={{
          zIndex: 70,
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Close button - sticky so it stays visible */}
        <div className="sticky top-0 flex items-center justify-end p-4 border-b border-[#dbe6f5] bg-[#f8fafc]/95 backdrop-blur-sm z-10">
          <button
            onClick={onClose}
            className="cursor-pointer p-2 text-[#64748b] hover:text-[#3b82f6] hover:bg-[#eef2f9] transition-all duration-150"
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
