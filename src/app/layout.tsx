import type { Metadata } from "next";
import { Figtree, Zen_Kurenaido } from "next/font/google";
import "./globals.css";

const display = Zen_Kurenaido({
  variable: "--font-zen",
  subsets: ["latin"],
  weight: "400",
});

const sans = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "OWN — 所持盤",
  description:
    "CDのモデリングをデジタル上で触って回せる。アナログな所有感を残したWeb体験。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${display.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ background: "#ffffff" }}>
        {children}
      </body>
    </html>
  );
}
