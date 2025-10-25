// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Poppins, Nunito } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-heading", // exposes a CSS var
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-body", // exposes a CSS var
});

export const metadata: Metadata = {
  title: "Beyond Speech",
  description: "Culturally responsive speech therapy — remote or in person.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${nunito.variable}`}>
      <body>{children}</body>
    </html>
  );
}
