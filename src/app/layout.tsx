import type { Metadata } from "next";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth/auth-context";
import { AppDataProvider } from "@/lib/data/app-data-context";

export const metadata: Metadata = {
  title: "DCA Case Management Platform | Enterprise Debt Recovery",
  description: "Centralized, intelligent debt recovery and governance platform for managing overdue accounts handled by external DCAs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Script
          id="orchids-browser-logs"
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/orchids-browser-logs.js"
          strategy="afterInteractive"
          data-orchids-project-id="81825f99-bcfa-47dc-b1de-3e5c843c24e6"
        />
        <ErrorReporter />
        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="true"
          data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
        />
        <AuthProvider>
          <AppDataProvider>
            {children}
          </AppDataProvider>
        </AuthProvider>
        <Toaster richColors position="top-right" />
        <VisualEditsMessenger />
      </body>
    </html>
  );
}
