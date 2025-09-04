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
            title: "eCommerce",
            url: "/",
          },
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
        title: "Calendar",
        url: "/calendar",
        icon: Icons.Calendar,
        items: [],
      },
      {
        title: "Profile",
        url: "/profile",
        icon: Icons.User,
        items: [],
      },
      {
        title: "Forms",
        icon: Icons.Alphabet,
        items: [
          {
            title: "Form Elements",
            url: "/forms/form-elements",
          },
          {
            title: "Form Layout",
            url: "/forms/form-layout",
          },
        ],
      },
      {
        title: "Tables",
        url: "/tables",
        icon: Icons.Table,
        items: [
          {
            title: "Tables",
            url: "/tables",
          },
        ],
      },
      {
        title: "Pages",
        icon: Icons.Alphabet,
        items: [
          {
            title: "Settings",
            url: "/pages/settings",
          },
        ],
      },
    ],
  },
  {
    label: "OTHERS",
    items: [
      {
        title: "Charts",
        icon: Icons.PieChart,
        items: [
          {
            title: "Basic Chart",
            url: "/charts/basic-chart",
          },
        ],
      },
      {
        title: "UI Elements",
        icon: Icons.FourCircle,
        items: [
          {
            title: "Alerts",
            url: "/ui-elements/alerts",
          },
          {
            title: "Buttons",
            url: "/ui-elements/buttons",
          },
        ],
      },
      {
        title: "Authentication",
        icon: Icons.Authentication,
        items: [
          {
            title: "Sign In",
            url: "/auth/sign-in",
          },
        ],
      },
    ],
  },
];
