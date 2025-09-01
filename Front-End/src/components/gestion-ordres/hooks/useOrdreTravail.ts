import { useState, useEffect } from 'react';
import axios from 'axios';
import { OrdreTravail, QuoteData, Atelier, Service, Mecanicien, Statistiques, Pagination, Filters } from '../types';

export const useOrdreTravail = () => {
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [ateliers, setAteliers] = useState<Atelier[]>([]);
  const [mecaniciens, setMecaniciens] = useState<Mecanicien[]>([]);
  const [statistiques, setStatistiques] = useState<Statistiques | null>(null);
  const [ordresTravail, setOrdresTravail] = useState<OrdreTravail[]>([]);
  const [selectedOrdre, setSelectedOrdre] = useState<OrdreTravail | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState<Filters>({
    status: '',
    atelier: '',
    priorite: '',
    dateDebut: '',
    dateFin: ''
  });

  const [ordreTravail, setOrdreTravail] = useState<OrdreTravail>({
    devisId: '',
    dateCommence: '',
    atelier: '',
    priorite: 'normale',
    description: '',
    taches: []
  });

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  return {
    // States
    selectedQuote,
    setSelectedQuote,
    quoteData,
    setQuoteData,
    loading,
    setLoading,
    error,
    setError,
    success,
    setSuccess,
    services,
    setServices,
    ateliers,
    setAteliers,
    mecaniciens,
    setMecaniciens,
    statistiques,
    setStatistiques,
    ordresTravail,
    setOrdresTravail,
    selectedOrdre,
    setSelectedOrdre,
    pagination,
    setPagination,
    filters,
    setFilters,
    ordreTravail,
    setOrdreTravail,
    // Utils
    showError,
    showSuccess
  };
};
