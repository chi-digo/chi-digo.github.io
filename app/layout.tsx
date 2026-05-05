import type { Metadata } from "next";
import { Fraunces, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz", "SOFT", "WONK"],
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin", "latin-ext"],
  style: ["normal"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chi-digo — Building the transmission tools for the Digo language",
  description:
    "Building the transmission tools for the Digo language — dictionary, proverbs, audio, and cultural resources for 360,000 speakers on the Kenya–Tanzania coast.",
  openGraph: {
    title: "Chi-digo",
    description:
      "Building the transmission tools for the Digo language.",
    siteName: "Chi-digo",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chi-digo",
    description:
      "Building the transmission tools for the Digo language.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${sourceSerif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
