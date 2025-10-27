import { Car, Calendar, FileText, User, Settings, CreditCard, Clock, MapPin } from 'lucide-react';

export const NAV_DATA = [
  {
    label: "MON ESPACE",
    items: [
      {
        title: "Trouver un garage",
        url: "/chercher-garage",
        icon: MapPin,
        items: [],
      },
      /*{
        title: "Tableau de bord",
        url: "/client/dashboard",
        icon: User,
        items: [],
      },*/
      {
        title: "Mes Réservations",
        url: "/client/reservations",
        icon: Calendar,
        items: [
          {
            title: "Historique",
            url: "/historique-reservation",
          },
         /* {
            title: "Nouvelle réservation",
            url: "/reservation-cote-client",
          },*/
        ],
      },
      {
        title: "Mes Véhicules",
        url: "/vehicules",
        icon: Car,
        items: [
          {
            title: "véhicules",
            url: "/Voiture",
          },
        ],
      },
      {
        title: "Mes Devis",
        icon: FileText,
        items: [
          /*{
            title: "Mes factures",
            url: "/client-facture",
          },*/
          {
            title: "devis",
            url: "/client-devis",
          },
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
      {
        title: "Paramètres",
        url: "/client/parametres",
        icon: Settings,
        items: [],
      },
    ],
  },
];