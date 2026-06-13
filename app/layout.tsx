import type { Metadata } from "next";
import { Geist_Mono, Lato } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Parametra — AI-Powered CAD Design",
  description: "AI agents that design and build your CAD models in Onshape from a single prompt.",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${lato.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body tabIndex={-1} className="min-h-full flex flex-col bg-[#F5F0E8] text-[#1E293B]">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
