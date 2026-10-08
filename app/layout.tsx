import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";

export const metadata: Metadata = {
  title: "FluentWEB — AI Interview Coach",
  description: "Latih kemampuan wawancara kerjamu dengan AI. Analisis kelancaran bicara, kontak mata, dan ekspresi wajah secara real-time.",
  keywords: ["interview", "wawancara", "AI", "latihan", "karir", "FluentWEB"],
  openGraph: {
    title: "FluentWEB — AI Interview Coach",
    description: "Platform latihan wawancara kerja berbasis AI dengan analisis bicara dan wajah real-time",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
