import UnifiedGarageDashboard from "@/components/gestion-garage";
import GarageQuoteSystem from "@/components/devis";
import SuperAdminDashboard from "@/components/gestion-ordres";
import GestionFacturesSuperAdmin from "@/components/gestion-factures";
import GarageEtGaragiteTableStatus from "@/components/TableGarageEtGaragiteStatus";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gestion Centrale - Garages",
};

export default function Page() {
  return (
    <UnifiedGarageDashboard 
      DevisComponent={GarageQuoteSystem}
      OrdresComponent={SuperAdminDashboard}
      FactureComponent={GestionFacturesSuperAdmin}
      GarageEtGaragiteTableStatusComponent={GarageEtGaragiteTableStatus}
    />
  );
}