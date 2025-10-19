import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../styles/print.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ContractorApp - Gestión Profesional para Contratistas",
  description: "Sistema integral de gestión para contratistas. Maneja proyectos, presupuestos, facturas y más.",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ProfileProvider>
            <LanguageProvider>
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                }}
              />
            </LanguageProvider>
          </ProfileProvider>
        </AuthProvider>
      </body>
    </html>
  );
}