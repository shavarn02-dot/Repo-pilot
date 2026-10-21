import "./globals.css";
import React from "react";
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata = {
  title: "RepoPilot — AI GitHub Maintainer",
  description:
    "Understand your codebase. Review pull requests. Catch issues earlier. Evidence-linked repository health, powered by Gemma 4 via OpenRouter.",
};

// Apply the saved theme before first paint (light-first; no flash).
const themeScript = `try{var t=localStorage.getItem("rp-theme");if(t==="dark"){document.documentElement.classList.add("dark")}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-canvas font-sans text-primary antialiased">{children}</body>
    </html>
  );
}
