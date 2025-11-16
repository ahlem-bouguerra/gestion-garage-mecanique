import { Car, Calendar, FileText, User, Settings, CreditCard, Clock, MapPin,LinkIcon } from 'lucide-react';

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
   
      /*{
        title: "Tableau de bord",
        url: "/client/dashboard",
        icon: User,
        items: [],
      },*/
      {
        title: "Les SuperAdmins",
        url: "/tableSuperAdmin",
        icon: User,
        items: [ ],
      },
      {
        title: "Gestion des Garages et des Garagistes Statut",
        url: "/table-garage-garagite-statut",
        icon: User,
        items: [ ],
      },
      {
        title: "Gestion des Rôles & Permissions",
        url: "/gestionRolesEtPermisions",
        icon: LinkIcon,
        items: [
        
        ],
      },
   
    /*  {
        title: "Historique Services",
        url: "/client/historique",
        icon: Clock,
        items: [],
      },*/
    ],
  },
  {
    label: "SERVICES",
    items: [
      {
        title: "Factures & Paiements",
        url: "/client-facture",
        icon: CreditCard,
        items: [],
      },
    ],
  },
  {
    label: "COMPTE",
    items: [
      {
        title: "Mon Profil",
        url: "/profil",
        icon: User,
        items: [],
      },

    ],
  },
];