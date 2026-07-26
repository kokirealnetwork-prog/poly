import type { Metadata } from "next";
import { Caveat, Figtree } from "next/font/google";
import "./globals.css";

const display = Caveat({
  variable: "--font-script",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const sans = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "OWN",
  description: "A digital CD you can hold and spin.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ background: "#ffffff" }}>
        {children}
      </body>
    </html>
  );
}
