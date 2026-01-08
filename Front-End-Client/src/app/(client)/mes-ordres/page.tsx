import { Metadata } from "next";
import MesOrdresPage from "@/components/mes-ordres";

export const metadata: Metadata = {
  title: "Mes Ordres de Travail",
  description: "Suivez l'avancement de vos réparations"
};

export default function Page() {
  return <MesOrdresPage />;
}