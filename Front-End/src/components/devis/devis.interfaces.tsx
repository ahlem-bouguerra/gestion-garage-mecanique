// ============================================
// INTERFACES PRINCIPALES
// ============================================

export interface Client {
  _id: string;
  nom: string;
  nomEffectif?: string; // Nom d'utilisateur si compte lié
  type: 'particulier' | 'professionnel';
  email?: string;
  telephone?: string;
  adresse?: string;
  clientId?: {
    username: string;
    email: string;
  };
}

export interface Vehicule {
  _id: string;
  marque: string;
  modele: string;
  immatriculation: string;
  annee: number;
  vin?: string;
  kilometrage?: number;
  proprietaireId: string;
}

export interface Service {
  piece: string;
  quantity: number;
  unitPrice: number;
  total?: number; // Calculé: quantity * unitPrice
}

export interface EstimatedTime {
  days: number;
  hours: number;
  minutes: number;
}

export interface Devis {
  _id?: string;
  id: string; // Numéro de devis
  clientId: string | Client;
  vehiculeId: string;
  vehicleInfo: string;
  inspectionDate: string;
  services: Service[];
  maindoeuvre: number;
  tvaRate: number;
  remiseRate: number;
  estimatedTime: EstimatedTime;
  status: 'brouillon' | 'envoye' | 'accepte' | 'refuse';
  
  // Montants calculés
  totalServicesHT: number;
  totalHT: number;
  montantTVA: number;
  montantRemise: number;
  totalTTC: number;
  finalTotalTTC: number; // TTC après remise
  
  createdAt?: string;
  updatedAt?: string;
}

export interface Facture {
  _id: string;
  numeroFacture: string;
  devisId: string;
  clientId: string | Client;
  vehiculeId: string;
  status: 'active' | 'cancelled' | 'paid';
  services: Service[];
  maindoeuvre: number;
  totalHT: number;
  totalTTC: number;
  montantTVA: number;
  montantRemise: number;
  tvaRate: number;
  remiseRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreditNote {
  _id: string;
  creditNumber: string;
  originalFactureId: string;
  montant: number;
  reason: string;
  createdAt: string;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  phone?: string;
  garagenom: string;
  matriculefiscal?: string;
  streetAddress?: string;
  governorateId?: {
    name: string;
  };
  cityId?: {
    name: string;
  };
}

// ============================================
// INTERFACES POUR LES FORMULAIRES
// ============================================

export interface NewQuoteForm {
  clientName: string;
  vehicleInfo: string;
  vehiculeId: string;
  inspectionDate: string;
  services: Service[];
}

export interface FiltersState {
  status: '' | 'brouillon' | 'envoye' | 'accepte' | 'refuse';
  clientName: string;
  dateDebut: string;
  dateFin: string;
}

// ============================================
// INTERFACES POUR LES RÉPONSES API
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface CreateFactureResponse {
  success: boolean;
  facture: Facture;
  creditNote?: CreditNote;
}

export interface DevisListResponse {
  success: boolean;
  data: Devis[];
  total?: number;
}

// ============================================
// INTERFACES POUR LES NOTIFICATIONS
// ============================================

export interface Notification {
  id: string;
  variant: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: number;
}

// ============================================
// TYPES UTILITAIRES
// ============================================

export type DevisStatus = 'brouillon' | 'envoye' | 'accepte' | 'refuse';

export type FactureStatus = 'active' | 'cancelled' | 'paid';

export interface StatusColor {
  brouillon: string;
  envoye: string;
  accepte: string;
  refuse: string;
}

// ============================================
// INTERFACES POUR LES PROPS DE COMPOSANTS
// ============================================

export interface AlertProps {
  variant?: 'info' | 'success' | 'error' | 'warning';
  title?: string;
  description?: string;
  onClose?: () => void;
}

export interface DevisTableRowProps {
  quote: Devis;
  onView: (quote: Devis) => void;
  onEdit: (quote: Devis) => void;
  onDelete: (quoteId: string) => void;
  onSendEmail: (quoteId: string) => void;
  onCreateFacture: (quote: Devis) => void;
  onCreateWorkOrder: (quote: Devis) => void;
  loading: boolean;
}

// ============================================
// INTERFACES POUR LES HOOKS PERSONNALISÉS
// ============================================

export interface UseDevisReturn {
  quotes: Devis[];
  loading: boolean;
  error: string | null;
  fetchDevis: (filters?: FiltersState) => Promise<void>;
  createDevis: (data: NewQuoteForm) => Promise<void>;
  updateDevis: (id: string, data: Partial<Devis>) => Promise<void>;
  deleteDevis: (id: string) => Promise<void>;
  updateStatus: (id: string, status: DevisStatus) => Promise<void>;
}

// ============================================
// TYPES POUR LES CALCULS
// ============================================

export interface CalculatedTotals {
  totalServicesHT: number;
  totalHT: number;
  montantTVA: number;
  montantRemise: number;
  totalTTC: number;
  finalTotalTTC: number;
}

// ============================================
// CONFIGURATION
// ============================================

export interface ApiConfig {
  baseURL: string;
  timeout: number;
  headers: {
    'Content-Type': string;
    Authorization?: string;
  };
}

export interface PaginationConfig {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}