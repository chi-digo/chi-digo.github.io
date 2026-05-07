import type { Metadata } from "next";
import Script from "next/script";
import { Fraunces, Source_Serif_4, Inter } from "next/font/google";
import { ClientShell } from "@/components/ClientShell";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz", "SOFT", "WONK"],
  adjustFontFallback: false,
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin", "latin-ext"],
  style: ["normal"],
  variable: "--font-source-serif",
  display: "swap",
  adjustFontFallback: false,
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "Chi-digo — Building the transmission tools for the Digo language",
  description:
    "Building the transmission tools for the Digo language — dictionary, proverbs, audio, and cultural resources for 600,000 speakers on the Kenya–Tanzania coast.",
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
    <html lang="en" className={`${fraunces.variable} ${sourceSerif.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <Script
          id="locale-blocking"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('chidigo-lang');if(s==='sw'||s==='dig'){document.documentElement.lang=s;document.documentElement.classList.add('lang-'+s)}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
