import type { Metadata } from "next";
import { LagerthaLab } from "@/components/characters/Lagertha/LagerthaLab";

export const metadata: Metadata = {
  title: "Lagertha · Laboratorio de animación | VALHALLA",
  description:
    "Entorno de desarrollo para probar el rig articulado y todas las animaciones de Lagertha: reposo, caminar, correr, atacar, daño, muerte y victoria.",
};

export default function LagerthaTestPage() {
  return <LagerthaLab />;
}
