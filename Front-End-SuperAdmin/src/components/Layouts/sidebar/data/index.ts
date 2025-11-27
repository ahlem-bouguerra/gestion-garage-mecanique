import { Car, Calendar, FileText, User, Settings2,Wrench, CreditCard, Clock, MapPin,LinkIcon } from 'lucide-react';

export const NAV_DATA = [
  {
    label: "MON ESPACE",
    items: [
         {
        title: "Gestion Des Garages et Des Clients",
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
        items: [ ],
      },
      {
        title: "Gestion des Garages et des Garagistes Statut",
        url: "/table-garage-garagite-statut",
        icon: Settings2,
        items: [ ],
      },
      {
        title: "Gestion des Rôles & Permissions",
        url: "/gestionRolesEtPermisions",
        icon: LinkIcon,
        items: [
        
        ],
      },
      {
        title: "Gestion des Devis",
        url: "/devis",
        icon: FileText,
        items: [],
      },
   
      {
        title: "Gestion Des Ordres",
        url: "/gestion-ordres",
        icon: Clock,
        items: [],
      },
    ],
  },
  {
    label: "SERVICES",
    items: [
      {
        title: "Factures & Paiements",
        url: "/gestion-factures",
        icon: CreditCard,
        items: [],
      },
    ],
  },

];