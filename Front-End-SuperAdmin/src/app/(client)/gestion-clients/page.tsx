import SuperAdminClientsPage from "@/components/gestion-clients";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gestion Centrale - Garages",
};

export default function Page() {
  return (
    <SuperAdminClientsPage
    />
  );
}
