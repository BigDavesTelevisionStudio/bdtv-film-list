import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "BigDaveTV — The Curated List",
  description:
    "BigDave's personal film and TV tracking hub. The definitive curated watchlist.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full dark">
        <body
          className="min-h-full flex flex-col"
          style={{
            backgroundColor: "#000",
            color: "#f5f5f7",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif",
          }}
        >
          {children}
          <Toaster
            theme="dark"
            toastOptions={{
              style: {
                background: "#1c1c1e",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#f5f5f7",
                fontFamily:
                  "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
                fontSize: "14px",
                borderRadius: "12px",
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
