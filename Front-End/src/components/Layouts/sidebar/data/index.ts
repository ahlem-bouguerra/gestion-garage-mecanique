// src/data/garagiste-nav.ts
import * as Icons from "../icons";
import { FolderOpen, Car, Building, Users, FileText, Clipboard, Calendar } from 'lucide-react';

export const NAV_DATA = [
  {
    label: "GESTION GARAGE",
    items: [
      {
        title: "Dashboard",
        icon: Icons.HomeIcon,
        items: [
          {
            title: "Charge Réservations",
            url: "/dashboard-reservation"
          },
          {
            title: "Charge Atelier",
            url: "/dashboard",
          }
        ],
      },
      {
        title: "Clients & Véhicules",
        url: "/fiches",
        icon: FolderOpen,
        items: [
          {
            title: "Fiche Client",
            url: "/fiche-client",
            icon: Users,
          },
          {
            title: "Fiche Véhicule",
            url: "/fiche-voiture",
            icon: Car,
          },
        ],
      },
      {
        title: "Gestion des Devis",
        url: "/devis",
        icon: FileText,
        items: [],
      },
      {
        title: "Gestion Factures",
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
        title: "Ordres de Travail",
        url: "/gestion-ordres",
        icon: Clipboard,
        items: [],
      },
      {
        title: "Réservations Garage",
        url: "/reservation-cote-garage",
        icon: Calendar,
        items: [],
      },
    ],
  },
];