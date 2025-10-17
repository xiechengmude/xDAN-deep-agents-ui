import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/providers/Auth";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "xDAN-AI Deep Agents",
  description: "多智能体协作系统",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <NuqsAdapter>{children}</NuqsAdapter>
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
