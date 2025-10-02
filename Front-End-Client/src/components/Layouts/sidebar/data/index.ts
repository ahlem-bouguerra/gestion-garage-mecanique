import { Car, Calendar, FileText, User, Settings, CreditCard, Clock, MapPin } from 'lucide-react';

export const NAV_DATA = [
  {
    label: "MON ESPACE",
    items: [
      {
        title: "Tableau de bord",
        url: "/client/dashboard",
        icon: User,
        items: [],
      },
      {
        title: "Mes Réservations",
        url: "/client/reservations",
        icon: Calendar,
        items: [
          {
            title: "Réservations en cours",
            url: "/client/reservations/en-cours",
          },
          {
            title: "Historique",
            url: "/client/reservations/historique",
          },
          {
            title: "Nouvelle réservation",
            url: "/reservation-cote-client",
          },
        ],
      },
      {
        title: "Mes Véhicules",
        url: "/vehicules",
        icon: Car,
        items: [
          {
            title: "Liste véhicules",
            url: "/client/vehicules/liste",
          },
          {
            title: "Ajouter véhicule",
            url: "/Voiture",
          },
        ],
      },
      {
        title: "Factures & Devis",
        url: "/client/factures",
        icon: FileText,
        items: [
          {
            title: "Mes factures",
            url: "/client/factures/liste",
          },
          {
            title: "Mes devis",
            url: "/client/devis/liste",
          },
        ],
      },
      {
        title: "Historique Services",
        url: "/client/historique",
        icon: Clock,
        items: [],
      },
    ],
  },
  {
    label: "SERVICES",
    items: [
      {
        title: "Trouver un garage",
        url: "/chercher-garage",
        icon: MapPin,
        items: [],
      },
      {
        title: "Paiements",
        url: "/client/paiements",
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
      {
        title: "Paramètres",
        url: "/client/parametres",
        icon: Settings,
        items: [],
      },
    ],
  },
];