// src/components/gestions-ordres/types.ts

export interface Tache {
  _id?: string;
  id: number | string;
  description: string;
  quantite: number;
  serviceId: string;
  serviceNom?: string;
  mecanicienId: string;
  mecanicienNom?: string;
  estimationHeures: number;
  heuresReelles?: number;
  notes: string;
  status?: string;
  dateDebut?: string;
  dateFin?: string;
}

export interface OrdreTravail {
  _id?: string;
  numeroOrdre?: string;
  devisId: string;
  dateCommence: string;
  dateFinPrevue?: string;
  atelier: string;
  atelierId?: string;
  atelierNom?: string;
  priorite: 'faible' | 'normale' | 'elevee' | 'urgente';
  description: string;
  status?: 'en_attente' | 'en_cours' | 'termine' | 'suspendu' | 'supprime';
  taches: Tache[];
  clientInfo?: {
    nom: string;
  };
  vehiculeInfo?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuoteData {
  id: string;
  clientName: string;
  vehicleInfo: string;
  inspectionDate: string;
  services: Array<{
    piece: string;
    quantity: number;
  }>;
}

export interface Atelier {
  _id: string;
  name: string;
  localisation: string;
}

export interface Service {
  _id: string;
  name: string;
}

export interface Mecanicien {
  _id: string;
  nom: string;
}

export interface Statistiques {
  total: number;
  termines: number;
  enCours: number;
  suspendus: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Filters {
  status: string;
  atelier: string;
  priorite: string;
  dateDebut: string;
  dateFin: string;
}

export const statusOptions = {
  'en_attente': { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: 'Clock' },
  'en_cours': { label: 'En cours', color: 'bg-blue-100 text-blue-800', icon: 'Wrench' },
  'termine': { label: 'Terminé', color: 'bg-green-100 text-green-800', icon: 'CheckCircle' },
  'suspendu': { label: 'Suspendu', color: 'bg-red-100 text-red-800', icon: 'AlertCircle' }
};

export const prioriteOptions = {
  'faible': { label: 'Faible', color: 'bg-gray-100 text-gray-800' },
  'normale': { label: 'Normale', color: 'bg-blue-100 text-blue-800' },
  'elevee': { label: 'Élevée', color: 'bg-orange-100 text-orange-800' },
  'urgente': { label: 'Urgente', color: 'bg-red-100 text-red-800' }
};