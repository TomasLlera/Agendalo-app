import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Agendalo — Tu agenda online, en menos de 5 minutos",
    template: "%s · Agendalo",
  },
  description:
    "SaaS de agenda para profesionales independientes en LATAM. Reservas online, recordatorios por WhatsApp y cobros con Mercado Pago.",
  applicationName: "Agendalo",
  keywords: [
    "agenda online",
    "turnos",
    "reservas",
    "WhatsApp",
    "Mercado Pago",
    "profesionales",
    "LATAM",
    "Argentina",
  ],
  authors: [{ name: "Agendalo" }],
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: APP_URL,
    siteName: "Agendalo",
    title: "Agendalo — Tu agenda online, en menos de 5 minutos",
    description:
      "Reservas, recordatorios por WhatsApp y cobros con Mercado Pago. Sin contrato, sin tarjeta para empezar.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Agendalo — Tu agenda online, en menos de 5 minutos",
    description:
      "Reservas, recordatorios por WhatsApp y cobros con Mercado Pago.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="es" className={`${inter.variable} h-full antialiased`}>
        <body className="flex min-h-full flex-col">{children}</body>
      </html>
    </ClerkProvider>
  );
}
