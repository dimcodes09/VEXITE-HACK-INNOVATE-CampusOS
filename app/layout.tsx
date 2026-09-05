import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Campus OS — Institutional Risk Intelligence & Policy Grounding",
  description: "Agentic academic risk investigation, policy-grounded citations, and live consequence simulation."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-600/20 selection:text-indigo-900 antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
