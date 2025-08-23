import * as Icons from "../icons";
import { Car, Plus, Edit, Trash2, User, Users,Building2, Calendar, Phone, UserCheck, AlertTriangle, CheckCircle ,FileText,FileCheck,Clipboard} from 'lucide-react';


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
        title: "Fiche Client",
        url: "/fiche-client",
        icon: Icons.User,
        items: [],
      },
      {
        title: "Fiche  Véhicule",
        url: "/fiche-voiture",
        icon: Car,
        items: [],
      },
      {
        title: "Géstion des Devis",
        url: "/devis",
        icon: FileText,
        items: [],
      },
      {
        title: "Gestion des Mécanicien",
        url: "/gestion-mecanicien",
        icon: Users,
        items: [],
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
