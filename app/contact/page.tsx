"use client";

import ContactForm from "@/app/components/ContactForm";
import Footer from "@/app/components/Footer";

export default function ContactPage() {
  return (
    <>
      <ContactForm />
      <Footer currentPage="contact" />
    </>
  );
}
