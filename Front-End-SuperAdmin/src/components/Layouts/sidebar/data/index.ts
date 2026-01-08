import { Car, Calendar, FileText, User, Settings2,Wrench, CreditCard, Clock, MapPin,LinkIcon } from 'lucide-react';

export const NAV_DATA = [
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
        title: "Gestion Des Garages",
        url: "/gestion-centrale",
        icon: Clock,
        items: [],
      },
          {
        title: "Gestion des Clients",
        url: "/gestion-clients",
        icon: Settings2,
        items: [ ],
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