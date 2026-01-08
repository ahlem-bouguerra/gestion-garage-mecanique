import { Metadata } from "next";
import OrdreDetailsPage from "@/components/mes-odres-id";

export const metadata: Metadata = {
  title: "Détails de l'ordre",
  description: "Informations détaillées sur votre ordre de travail"
};

type PropsType = {
  params: Promise<{
    id: string;
  }>;
};

export default async function Page(props: PropsType) {
  const { id } = await props.params;
  
  return <OrdreDetailsPage ordreId={id} />;
}