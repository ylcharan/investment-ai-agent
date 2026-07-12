import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Investment Research Agent",
  description:
    "LangGraph-powered investment research agent that analyzes companies and delivers invest or pass verdicts with reasoning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
