import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "AI Job Market Intelligence",
  description:
    "Interactive dashboard tracking hiring trends, trending skills, active employers, and forecasts across the AI-driven job market.",
  metadataBase: new URL("https://ai-job-market-dashboard.vercel.app"),
  openGraph: {
    title: "AI Job Market Intelligence",
    description:
      "Hiring trends, skills, and forecasts across the AI-driven job market.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
