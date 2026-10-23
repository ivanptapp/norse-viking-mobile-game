import type { Metadata } from "next";
import { RagnarLab } from "@/components/characters/Ragnar/RagnarLab";

export const metadata: Metadata = {
  title: "Ragnar · Laboratorio de animación",
  description:
    "Personaje vikingo articulado dibujado por código: jerarquía humana, clips de animación y previsualización en vivo.",
};

export default function RagnarTestPage() {
  return <RagnarLab />;
}
