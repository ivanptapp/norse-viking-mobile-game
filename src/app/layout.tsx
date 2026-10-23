import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "VALHALLA: Leyendas Nórdicas — RPG de héroes vikingos",
  description:
    "Reúne a Ragnar Lodbrok, Lagertha, Thor, Odín, Ivar el Deshuesado y Uhtred de Bebbanburg. Campaña, arena Holmgang, Torre de Yggdrasil e invocaciones en un RPG idle para móvil.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0b100d",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-[#070a09] text-stone-100 antialiased">
        {children}
      </body>
    </html>
  );
}
