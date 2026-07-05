import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/shared/components/theme-provider";
import { QueryProvider } from "@/shared/components/query-provider";
import { ServiceWorkerRegister } from "@/shared/components/sw-register";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rise Foods ERP — Operating System",
  description: "FMCG manufacturing & distribution operating system for Rise Foods. Dashboard, CRM, Inventory, Procurement, Sales, Finance, Analytics.",
  keywords: ["ERP", "CRM", "FMCG", "Rise Foods", "Inventory", "Procurement", "Gorakhpur"],
  authors: [{ name: "Rise Foods" }],
  icons: { icon: "/icon.svg" },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Rise Foods ERP",
    statusBarStyle: "default",
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${mono.variable} antialiased bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <QueryProvider>
            {children}
            <Toaster />
            <SonnerToaster position="top-right" richColors closeButton />
            <ServiceWorkerRegister />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
