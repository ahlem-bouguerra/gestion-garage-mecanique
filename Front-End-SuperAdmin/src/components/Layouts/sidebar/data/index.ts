import { Car, Calendar, FileText, User, Settings2, Wrench, CreditCard, Clock, MapPin, LinkIcon, LucideIcon } from 'lucide-react';

// ✅ Types pour la navigation
interface SubMenuItem {
  title: string;
  url: string;
}

interface MenuItem {
  title: string;
  url?: string;
  icon: LucideIcon;
  items: SubMenuItem[];
}

interface NavSection {
  label: string;
  items: MenuItem[];
}

// ✅ Typage explicite de NAV_DATA
export const NAV_DATA: NavSection[] = [
  {
    label: "MON ESPACE",
    items: [
      {
        title: "Création Des Garages et Des Employés",
        url: "/createGarageForm",
        icon: FileText,
        items: [],
      },
      {
        title: "gestion-services",
        url: "/gestion-services",
        icon: Wrench,
        items: [],
      },
      {
        title: "Les SuperAdmins",
        url: "/tableSuperAdmin",
        icon: User,
        items: [],
      },
      {
        title: "Gestion des Rôles & Permissions",
        url: "/gestionRolesEtPermisions",
        icon: LinkIcon,
        items: [],
      },
      {
        title: "Gestion Des Garages",
        url: "/gestion-centrale",
        icon: Clock,
        items: [],
      },
      {
        title: "Gestion des Clients",
        url: "/gestion-clients",
        icon: Settings2,
        items: [],
      },
    ],
  },
  /*{
    label: "SERVICES",
    items: [
      {
        title: "Factures & Paiements",
        url: "/gestion-factures",
        icon: CreditCard,
        items: [],
      },
    ],
  },*/
];
