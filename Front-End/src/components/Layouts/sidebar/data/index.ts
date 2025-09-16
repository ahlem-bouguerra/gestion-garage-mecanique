import { title } from "process";
import * as Icons from "../icons";
import { FolderOpen,Car,Settings, Building,Plus, Edit, Trash2, User, Users,Building2, Calendar, Phone, UserCheck, AlertTriangle, CheckCircle ,FileText,FileCheck,Clipboard} from 'lucide-react';


export const NAV_DATA = [
  {
    label: "MAIN MENU",
    items: [
      {
        title: "Dashboard",
        icon: Icons.HomeIcon,
        items: [
          {
            title:"Charge Résèrevations",
            url:"/dashboard-reservation"
          },
          {
            title: "Charge Atelier",
            url: "/dashboard",
          }
        ],
      },
     {
  title: "CLients & Véhicules",
  url: "/fiches", // lien général, tu peux soit mettre un onglet parent vide ou rediriger vers une page résumé
  icon: FolderOpen, // ou une icône générique pour les fiches
  items: [
    {
      title: "Fiche Client",
      url: "/fiche-client",
      icon: User, // icône spécifique
    },
    {
      title: "Fiche Véhicule",
      url: "/fiche-voiture",
      icon: Car, // icône spécifique
    },
  ],
},

      {
        title: "Géstion des Devis",
        url: "/devis",
        icon: FileText,
        items: [],
      },
         {
        title: "gestion-factures",
        url: "/gestion-factures",
        icon: Icons.FourCircle,
        items: [],
      },
      {
  title: "Gestion Garage",
  url: "/gestion-mecanicien",
  icon: Building,
  items: [
    {
      title: "Mécaniciens | Ateliers | Services",
      url: "/gestion-mecanicien",
      icon: Users,
    },
  ],
},

      {
        title: "Gestion des Ordres de travail  ",
        url: "/gestion-ordres",
        icon: Clipboard,
        items: [],
      },
       {
        title: "demande reservation  ",
        url: "/demande-reservation",
        icon: Clipboard,
        items: [],
      },
      {
        title: "chercher garage  ",
        url: "/chercher-garage",
        icon: Clipboard,
        items: [],
      },
             {
        title: "gestion des reservation par client ",
        url: "/reservation-cote-client",
        icon: Clipboard,
        items: [],
      },
                   {
        title: "gestion des reservation par garagiste ",
        url: "/reservation-cote-garage",
        icon: Clipboard,
        items: [],
      },
      
    ],
  },

];
