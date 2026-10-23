import type { Metadata } from "next";
import { FenrirLab } from "@/components/characters/Fenrir/FenrirLab";

export const metadata: Metadata = {
  title: "Fenrir · Laboratorio de animación | VALHALLA",
  description:
    "Entorno de desarrollo para probar el rig articulado y todas las animaciones de Fenrir: reposo, caminar, correr, atacar, aullar, daño, muerte y salto.",
};

export default function FenrirTestPage() {
  return <FenrirLab />;
}
