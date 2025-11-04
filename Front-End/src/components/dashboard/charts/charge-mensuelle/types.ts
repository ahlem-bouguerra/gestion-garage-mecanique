export interface OrdreDetail {
  id: string;
  numeroOrdre: string;
  clientNom: string;
  vehicule: string;
  dateDebut: string;
  dateFin: string;
  heuresEstimees: number;
  progression: number;
}

export interface StatutDetail {
  count: number;
  ordres: OrdreDetail[];
}

export interface ChargeJournaliere {
  jour: number;
  nombreOrdres: number;
  chargeEstimee: number;
  chargeReelle: number;
  parStatut: {
    en_attente: StatutDetail;
    en_cours: StatutDetail;
    termine: StatutDetail;
    suspendu: StatutDetail;
  };
}

export interface ChargeMensuelleData {
  mois: number;
  annee: number;
  donnees: ChargeJournaliere[];
}