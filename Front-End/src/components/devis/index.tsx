"use client"
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Eye, Send, Check, X, Car, User, Calendar, FileText, Euro, AlertCircle, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';


const GarageQuoteSystem = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [clients, setClients] = useState([]);
  const [vehicules, setVehicules] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedVehiculeId, setSelectedVehiculeId] = useState('');
  const [loadingVehicules, setLoadingVehicules] = useState(false);
  const [tvaRate, setTvaRate] = useState(20); // TVA par défaut à 20%
  const [maindoeuvre, setMaindoeuvre] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState({ days: 0, hours: 0, minutes: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingQuote, setEditingQuote] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [factureExists, setFactureExists] = useState({});
  const [showFactureModal, setShowFactureModal] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const router = useRouter();
  const [filters, setFilters] = useState({status: '',clientName: '',dateDebut: '',dateFin: ''});
  const [newQuote, setNewQuote] = useState({clientName: '',vehicleInfo: '',vehiculeId: '',inspectionDate: '',services: [{ piece: '', quantity: 1, unitPrice: 0 }]});
  const [newquote, setNewquote] = useState({services: [{piece: '',quantity: 1,unitPrice: 0}]});
  const statusColors = {brouillon: 'bg-gray-100 text-gray-800',envoye: 'bg-blue-100 text-blue-800',accepte: 'bg-green-100 text-green-800',refuse: 'bg-red-100 text-red-800'};
  const statusIcons = {brouillon: FileText,envoye: Send,accepte: Check,refuse: X};
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const indexOfLastDevis = currentPage * itemsPerPage;
  const indexOfFirstDevis = indexOfLastDevis - itemsPerPage;
  const currentDevis = quotes.slice(indexOfFirstDevis, indexOfLastDevis);
  const totalPages = Math.ceil(quotes.length / itemsPerPage);
  const getAuthToken = () => {
      return localStorage.getItem('token') || sessionStorage.getItem('token');
  };

useEffect(() => {
  const fetchUserWithLocation = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await axios.get("http://localhost:5000/api/get-profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUser(response.data);
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  fetchUserWithLocation();
}, []);

  useEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;

    if (selectedInvoice || selectedQuote || selectedQuote) {
      header.classList.add("hidden");
    } else {
      header.classList.remove("hidden");
    }
  }, [selectedInvoice, selectedQuote, selectedQuote]);

  useEffect(() => {
    const header = document.querySelector('header');
    if (!header) return;

    if (showFactureModal || selectedFacture) {
      header.classList.add("hidden");
    } else {
      header.classList.remove("hidden");
    }
  }, [showFactureModal, selectedFacture]);

  const generateInvoice = (quote) => {
    const invoice = {
      ...quote,
      invoiceNumber: `FAC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 jours
      type: 'facture'
    };

    setInvoiceData(invoice);
    setSelectedInvoice(invoice);
  };

const printInvoice = async () => {
  setIsGeneratingPDF(true);

  try {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    let yPosition = 20;

    // En-tête
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DEVIS', pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 15;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`N° ${selectedQuote.id}`, pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 25;

    // Infos client et entreprise avec meilleur espacement
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Informations Client', 20, yPosition);
    pdf.text('Notre Entreprise', 100, yPosition);

    yPosition += 12;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);

    // Client (gauche)
    pdf.text(`Nom: ${selectedQuote.clientName}`, 20, yPosition);
    pdf.text(`Véhicule: ${selectedQuote.vehicleInfo}`, 20, yPosition + 6);
    pdf.text(`Date: ${selectedQuote.inspectionDate}`, 20, yPosition + 12);
    
    const estimatedTimeText = selectedQuote.estimatedTime 
      ? `${selectedQuote.estimatedTime.days}j ${selectedQuote.estimatedTime.hours}h ${selectedQuote.estimatedTime.minutes}m` 
      : 'N/A';
    pdf.text(`Temps estimé: ${estimatedTimeText}`, 20, yPosition + 18);

    // ✅ Entreprise (droite) — avec localisation corrigée et visible
    let rightYPosition = yPosition;
    
    // Nom du garage
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${currentUser?.garagenom || 'Nom du garage'}`, 100, rightYPosition);
    pdf.setFont('helvetica', 'normal');
    rightYPosition += 8;

    // ✅ Adresse complète et bien formatée
    if (currentUser?.governorateId?.name || currentUser?.cityId?.name || currentUser?.streetAddress) {
      // Adresse rue
      if (currentUser?.streetAddress) {
        pdf.text(`${currentUser.streetAddress}`, 100, rightYPosition);
        rightYPosition += 6;
      }
      
      // Ville et gouvernorat sur la même ligne
      const locationParts = [];
      if (currentUser?.cityId?.name) {
        locationParts.push(currentUser.cityId.name);
      }
      if (currentUser?.governorateId?.name) {
        locationParts.push(currentUser.governorateId.name);
      }
      
      if (locationParts.length > 0) {
        pdf.text(`${locationParts.join(', ')}`, 100, rightYPosition);
        rightYPosition += 6;
      }
      
      // Ligne séparatrice pour clarifier l'adresse
      rightYPosition += 2;
    }

    // Contact
    if (currentUser?.phone) {
      pdf.text(`Tél: ${currentUser.phone}`, 100, rightYPosition);
      rightYPosition += 6;
    }
    
    if (currentUser?.email) {
      pdf.text(`Email: ${currentUser.email}`, 100, rightYPosition);
      rightYPosition += 6;
    }
    
    if (currentUser?.matriculefiscal) {
      pdf.text(`Matricule Fiscale: ${currentUser.matriculefiscal}`, 100, rightYPosition);
      rightYPosition += 6;
    }

    // ✅ S'assurer que yPosition prend en compte la section la plus longue
    yPosition = Math.max(yPosition + 30, rightYPosition + 10);

    // Ligne de séparation
    pdf.setLineWidth(0.5);
    pdf.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 15;

    // Tableau des services
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Détail des Services', 20, yPosition);
    yPosition += 10;

    const colPositions = [20, 100, 135, 165];
    const colWidths = [75, 30, 25, 30];

    // En-têtes du tableau avec fond
    pdf.setFillColor(240, 240, 240);
    pdf.rect(20, yPosition - 3, 175, 10, 'F');
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('Pièce / Service', colPositions[0] + 2, yPosition + 4);
    pdf.text('Qté', colPositions[1] + 2, yPosition + 4);
    pdf.text('Prix Unit.', colPositions[2] + 2, yPosition + 4);
    pdf.text('Total', colPositions[3] + 2, yPosition + 4);

    yPosition += 12;
    pdf.setFont('helvetica', 'normal');

    // Lignes du tableau
    selectedQuote.services.forEach((service, index) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
        
        // Re-créer les en-têtes sur la nouvelle page
        pdf.setFillColor(240, 240, 240);
        pdf.rect(20, yPosition - 3, 175, 10, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.text('Pièce / Service', colPositions[0] + 2, yPosition + 4);
        pdf.text('Qté', colPositions[1] + 2, yPosition + 4);
        pdf.text('Prix Unit.', colPositions[2] + 2, yPosition + 4);
        pdf.text('Total', colPositions[3] + 2, yPosition + 4);
        yPosition += 12;
        pdf.setFont('helvetica', 'normal');
      }

      const total = (service.quantity || 0) * (service.unitPrice || 0);

      // Fond alterné pour les lignes
      if (index % 2 === 1) {
        pdf.setFillColor(250, 250, 250);
        pdf.rect(20, yPosition - 2, 175, 8, 'F');
      }

      // Texte tronqué si trop long
      const pieceText = service.piece.length > 30 ? 
        service.piece.substring(0, 30) + '...' : 
        service.piece;

      pdf.text(pieceText, colPositions[0] + 2, yPosition + 3);
      pdf.text(String(service.quantity), colPositions[1] + 2, yPosition + 3);
      pdf.text(`${(service.unitPrice || 0).toFixed(3)} DT`, colPositions[2] + 2, yPosition + 3);
      pdf.text(`${total.toFixed(3)} DT`, colPositions[3] + 2, yPosition + 3);

      yPosition += 8;
    });

    yPosition += 15;

    // ✅ Section totaux améliorée
    const totalHT = (selectedQuote.totalHT || 0) + (selectedQuote.maindoeuvre || 0);
    const tva = totalHT * ((selectedQuote.tvaRate || 20) / 100);
    const totalTTC = totalHT + tva;

    // Cadre pour les totaux
    const totalsStartY = yPosition;
    pdf.setFillColor(248, 248, 248);
    pdf.rect(120, yPosition - 5, 75, 40, 'F');
    pdf.setLineWidth(0.3);
    pdf.rect(120, yPosition - 5, 75, 40, 'S');

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Total pièces HT:`, 122, yPosition + 2);
    pdf.text(`${(selectedQuote.totalHT || 0).toFixed(3)} DT`, 170, yPosition + 2, { align: 'right' });
    
    pdf.text(`Main d'œuvre:`, 122, yPosition + 8);
    pdf.text(`${(selectedQuote.maindoeuvre || 0).toFixed(3)} DT`, 170, yPosition + 8, { align: 'right' });
    
    pdf.text(`Total HT:`, 122, yPosition + 14);
    pdf.text(`${totalHT.toFixed(3)} DT`, 170, yPosition + 14, { align: 'right' });
    
    pdf.text(`TVA (${selectedQuote.tvaRate || 20}%):`, 122, yPosition + 20);
    pdf.text(`${tva.toFixed(3)} DT`, 170, yPosition + 20, { align: 'right' });

    // Total TTC en gras
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text(`Total TTC:`, 122, yPosition + 28);
    pdf.text(`${totalTTC.toFixed(3)} DT`, 170, yPosition + 28, { align: 'right' });

    yPosition += 50;

    // ✅ Pied de page amélioré
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    const footerY = pageHeight - 20;
    
    // Ligne de séparation
    pdf.setLineWidth(0.3);
    pdf.line(20, footerY - 5, pageWidth - 20, footerY - 5);
    
    pdf.text(`Devis généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 
             pageWidth / 2, footerY, { align: 'center' });
    
    pdf.text('Ce devis est valable 30 jours à compter de sa date d\'émission', 
             pageWidth / 2, footerY + 6, { align: 'center' });

    // Sauvegarder avec nom plus descriptif
    const fileName = `devis_${selectedQuote.id}_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    // Optionnel: Afficher une notification d'erreur à l'utilisateur
    alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
  } finally {
    setIsGeneratingPDF(false);
  }
};

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      clientName: '',
      dateDebut: '',
      dateFin: ''
    });
    // Recharger tous les devis sans filtres
    loadDevisWithFactures({});
  };

const applyFilters = () => {
  const apiFilters = {};
  if (filters.status && filters.status !== 'Tous') {
    apiFilters.status = filters.status.toLowerCase();
  }

  if (filters.clientName.trim()) {
    apiFilters.clientName = filters.clientName.trim();
  }

  if (filters.dateDebut) {
    apiFilters.dateDebut = filters.dateDebut;
  }

  if (filters.dateFin) {
    apiFilters.dateFin = filters.dateFin;
  }

  // Réinitialiser à la page 1
  setCurrentPage(1);

  console.log('🔍 Filtres appliqués:', apiFilters);
  loadDevisWithFactures(apiFilters);
};

  const calculateTotal = (services, maindoeuvre = 0) => {
    const totalServicesHT = services.reduce((sum, service) => {
      return sum + (service.quantity * service.unitPrice);
    }, 0);

    const totalHT = totalServicesHT + maindoeuvre;

    return {
      totalHT,
      totalTTC: totalHT * (1 + tvaRate / 100)
    };
  };

  const loadDevisWithFactures = async (filterParams = {}) => {
    try {
      setLoading(true);
      const response = await devisApi.getAll(filterParams);

      const devisWithCalculatedTotals = (response.data || []).map(devis => {
        const servicesWithTotal = (devis.services || []).map(service => ({
          ...service,
          total: (service.quantity || 0) * (service.unitPrice || 0)
        }));

        const totalServicesHT = servicesWithTotal.reduce((sum, service) => {
          return sum + ((service.quantity || 0) * (service.unitPrice || 0));
        }, 0);

        const totalHT = totalServicesHT + (devis.maindoeuvre || 0);
        const totalTTC = totalHT * (1 + (devis.tvaRate || 20) / 100);

        return {
          ...devis,
          services: servicesWithTotal,
          totalHT: totalServicesHT,
          totalTTC: totalTTC
        };
      });

      setQuotes(devisWithCalculatedTotals);

      // Vérifier les factures existantes pour chaque devis accepté
      const facturesCheck = {};
      for (const devis of devisWithCalculatedTotals) {
        if (devis.status === 'accepte') {
          const facture = await checkFactureExists(devis.id);
          if (facture) {
            facturesCheck[devis.id] = facture;
          }
        }
      }
      setFactureExists(facturesCheck);

      if (Object.keys(filterParams).length > 0) {
        showSuccess(`${devisWithCalculatedTotals.length} devis trouvé(s) avec les filtres appliqués`);
      }

    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };


  const saveQuote = async () => {
    try {
      setLoading(true);

      // Validation (même code existant)
      if (!selectedClientId || !newQuote.vehicleInfo || !selectedVehiculeId || !newQuote.inspectionDate) {
        showError('Veuillez remplir tous les champs obligatoires');
        return;
      }

      if (newQuote.services.some(s => !s.piece || s.quantity <= 0 || s.unitPrice < 0)){
        showError('Veuillez vérifier les services (pièces, quantités, prix)');
        return;
      }

      const devisData = {
        clientId: selectedClientId,
        clientName: newQuote.clientName,
        vehicleInfo: newQuote.vehicleInfo,
        vehiculeId: selectedVehiculeId,
        inspectionDate: newQuote.inspectionDate,
        services: newQuote.services,
        tvaRate: tvaRate,
        maindoeuvre: maindoeuvre,
        estimatedTime: estimatedTime,
        // Si c'est une modification, remettre le statut à "brouillon"
        status: isEditMode ? 'brouillon' : undefined
      };

      if (isEditMode && editingQuote) {
        // Mode édition
        await devisApi.update(editingQuote.id, devisData);
        showSuccess('Devis modifié avec succès ! Statut remis à "brouillon".');
      } else {
        // Mode création
        await devisApi.create(devisData);
        showSuccess('Devis créé avec succès !');
      }

      // Reset du formulaire (même code existant)
      setNewQuote({
        clientName: '',
        vehicleInfo: '',
        inspectionDate: '',
        services: [{ piece: '', quantity: 1, unitPrice: 0 }]
      });
      setSelectedClientId('');
      setSelectedVehiculeId('');
      setTvaRate(20);
      setVehicules([]);
      setMaindoeuvre(0);
      setEditingQuote(null);
      setIsEditMode(false);
      setEstimatedTime({ days: 0, hours: 0, minutes: 0 });

      await loadDevisWithFactures();
      setActiveTab('list');

    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };


  const changeQuoteStatus = async (quoteId, newStatus) => {
    try {
      await devisApi.updateStatus(quoteId, newStatus);

      showSuccess(`Devis ${newStatus} avec succès`);

      // Mettre à jour localement
      setQuotes(quotes.map(quote =>
        quote.id === quoteId ? { ...quote, status: newStatus } : quote
      ));

      // Mettre à jour le devis sélectionné si c'est le même
      if (selectedQuote && selectedQuote.id === quoteId) {
        setSelectedQuote({ ...selectedQuote, status: newStatus });
      }

    } catch (err) {
      showError(err.message);
    }
  };

  const deleteQuote = async (quoteId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) {
      return;
    }

    try {
      await devisApi.delete(quoteId);
      showSuccess('Devis supprimé avec succès');

      // Supprimer localement
      setQuotes(quotes.filter(quote => quote.id !== quoteId));

      // Fermer le modal si c'est le devis affiché
      if (selectedQuote && selectedQuote.id === quoteId) {
        setSelectedQuote(null);
      }

    } catch (err) {
      showError(err.message);
    }
  };


  const sendDevisByEmail = async (devisId) => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token"); // ou Cookies.get("token")

      // 1. Envoyer l'email avec token dans headers
      const response = await axios.post(
        `http://localhost:5000/api/devis/${devisId}/send-email`,
        {}, // corps vide
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        // 2. Mettre à jour le statut
        await devisApi.updateStatus(devisId, 'envoye');

        showSuccess(`Devis envoyé par email avec succès`);

        // 3. Mettre à jour localement
        setQuotes(quotes.map(quote =>
          quote.id === devisId ? { ...quote, status: 'envoye' } : quote
        ));
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };




  const fetchClients = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/clients/noms', {
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
});
      const data = await response.json();
      // Puisque l'API retourne directement le tableau, pas besoin de data.data
      setClients(data);

    } catch (error) {
      console.error('Erreur lors de la récupération des clients:', error);
      setClients([]); // En cas d'erreur, initialiser avec un tableau vide
    }
  };

  const loadVehiculesByClient = async (clientId) => {
    if (!clientId) {
      setVehicules([]);
      return;
    }

    setLoadingVehicules(true);
    try {
      const response = await fetch(`http://localhost:5000/api/vehicules/proprietaire/${clientId}`, {
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
});

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const vehiculesData = await response.json();
      setVehicules(vehiculesData);

      console.log(`✅ ${vehiculesData.length} véhicules chargés pour le client`);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des véhicules:', error);
      setVehicules([]);
      // Optionnel: afficher une notification d'erreur à l'utilisateur
    } finally {
      setLoadingVehicules(false);
    }
  };


  const handleClientChange = async (e: { target: { value: any; }; }) => {
    const clientId = e.target.value;
    const selectedClient = clients.find(c => c._id === clientId);



    setSelectedClientId(clientId);
    setNewQuote({
      ...newQuote,
      clientName: selectedClient ? selectedClient.nom : '',
      vehicleInfo: '' // Reset véhicule quand on change de client
    });

    // Charger les véhicules pour ce client
    await loadVehiculesByClient(clientId);
    setSelectedVehiculeId('');

  };

  // Fonction pour mettre à jour un service
  const updateService = (index, field, value) => {
    const updatedServices = [...newQuote.services];
    updatedServices[index] = {
      ...updatedServices[index],
      [field]: value
    };

    setNewQuote({
      ...newQuote,
      services: updatedServices
    });
  };

  // Fonction pour supprimer un service
  const removeService = (index) => {
    const updatedServices = newQuote.services.filter((_, i) => i !== index);
    setNewQuote({
      ...newQuote,
      services: updatedServices
    });
  };

  // Fonction pour ajouter un nouveau service
  const addService = () => {
    setNewQuote({
      ...newQuote,
      services: [
        ...newQuote.services,
        {
          piece: '',
          quantity: 1,
          unitPrice: 0
        }
      ]
    });
  };


  const devisApi = {
    create: async (devisData, token) => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.post(
          "http://localhost:5000/api/createdevis",
          devisData,
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
          }
        );
        console.log("TOKEN envoyé :", token);

        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || "Erreur lors de la création du devis");
      }
    },



    getAll: async (filters = {}) => {
      try {
        const response = await axios.get("http://localhost:5000/api/Devis", { 
          params: filters,
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || "Erreur lors de la récupération des devis");
      }
    },

    updateStatus: async (devisId, status) => {
      try {
        const response = await axios.put(`http://localhost:5000/api/Devis/${devisId}/status`, 
          { status },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || "Erreur lors du changement de statut");
      }
    },
    update: async (devisId, devisData) => {
      try {
        const response = await axios.put(`http://localhost:5000/api/Devis/${devisId}`, 
          devisData,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || "Erreur lors de la mise à jour du devis");
      }
    },

    delete: async (devisId) => {
      try {
        const response = await axios.delete(`http://localhost:5000/api/Devis/${devisId}`,
  { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.message || "Erreur lors de la suppression");
      }
    }
  };

  const startEditQuote = (quote) => {
    // Vérifier si le devis peut être modifié
    if (quote.status === 'accepte' || quote.status === 'refuse') {
      if (!confirm('Ce devis a déjà été accepté/refusé. Voulez-vous vraiment le modifier ? Il repassera en statut "brouillon".')) {
        return;
      }
    }

    setEditingQuote(quote);
    setIsEditMode(true);

    // Pré-remplir le formulaire avec les données existantes
    setNewQuote({
      clientName: quote.clientName,
      vehicleInfo: quote.vehicleInfo,
      inspectionDate: quote.inspectionDate,
      services: quote.services.map(service => ({
        piece: service.piece,
        quantity: service.quantity,
        unitPrice: service.unitPrice,
      }))
    });

    setSelectedClientId(quote.clientId || '');
    setSelectedVehiculeId(quote.vehiculeId || '');
    setTvaRate(quote.tvaRate || 20);
    setMaindoeuvre(quote.maindoeuvre || 0);
    setEstimatedTime(quote.estimatedTime || { days: 0, hours: 0, minutes: 0 });

    // Charger les véhicules du client
    if (quote.clientId) {
      loadVehiculesByClient(quote.clientId);
    }

    setActiveTab('create');
  };

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  const createWorkOrder = async (quote) => {
    try {
      // Vérifier si un ordre existe déjà pour ce devis
      const response = await axios.get(`http://localhost:5000/api/ordre-travail/by-devis/${quote.id}`,
         { headers: { Authorization: `Bearer ${getAuthToken()}` }});

      if (response.data.exists) {
        // Ordre existe déjà - rediriger vers les détails
        localStorage.setItem('selectedOrdreToView', JSON.stringify(response.data.ordre));
        router.push('/gestion-ordres?tab=list&view=details');
      } else {
        // Pas d'ordre - rediriger vers création
        localStorage.setItem('selectedQuoteForOrder', JSON.stringify(quote));
        router.push('/gestion-ordres');
      }
    } catch (error) {
      // En cas d'erreur, procéder comme avant (création)
      localStorage.setItem('selectedQuoteForOrder', JSON.stringify(quote));
      router.push('/gestion-ordres');
    }
  };
  // Ajouter après les autres useState
  useEffect(() => {
    fetchClients();
    loadDevisWithFactures();

  }, []);


  const checkFactureExists = async (devisId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/devis/${devisId}` ,
         {headers: { Authorization: `Bearer ${getAuthToken()}` }});
      return response.data.success ? response.data.data : null;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // Pas de facture trouvée
      }
      console.error('Erreur lors de la vérification de facture:', error);
      return null;
    }
  };



const createFactureFromDevis = async (devis) => {
  try {
    setLoading(true);
    
    const devisId = devis._id || devis.id;
    console.log('🔍 Création facture pour devis:', devisId);

    // Vérifier si une facture active existe déjà
    const existingFacture = await checkActiveFactureExists(devisId);

    if (existingFacture) {
      // Vérifier si le devis a été modifié
      const isDevisModified = checkIfDevisModified(devis, existingFacture);

      if (isDevisModified) {
        // Proposer les options à l'utilisateur
        const userChoice = await showImprovedFactureModal(existingFacture, devis);
        
        switch (userChoice) {
          case 'view_existing':
            setSelectedFacture(existingFacture);
            setShowFactureModal(true);
            showSuccess('Facture existante affichée');
            return;
            
          case 'replace_with_credit':
            await replaceFactureWithCredit(devis, existingFacture);
            return;
            
          case 'cancel':
            return;
        }
      } else {
        // Pas de modification - afficher la facture existante
        setSelectedFacture(existingFacture);
        setShowFactureModal(true);
        showSuccess('Facture existante affichée');
        return;
      }
    } else {
      // Créer nouvelle facture (première fois)
      await createNewFacture(devis);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
    showError(error.response?.data?.message || 'Erreur lors de la gestion de facture');
  } finally {
    setLoading(false);
  }
};
const checkIfDevisModified = (devis, facture) => {
  if (!devis.updatedAt || !facture.createdAt) return false;
  
  const devisModifiedDate = new Date(devis.updatedAt);
  const factureCreatedDate = new Date(facture.createdAt);
  
  return devisModifiedDate > factureCreatedDate;
};

const showImprovedFactureModal = (existingFacture, devis) => {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-lg w-full m-4 p-6">
        <div class="mb-6">
          <h3 class="text-xl font-semibold text-gray-900 mb-3">Facture existante trouvée</h3>
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p class="text-sm text-blue-800 mb-2">
              <strong>Facture N°:</strong> ${existingFacture.numeroFacture}<br>
              <strong>Montant:</strong> ${existingFacture.totalTTC?.toFixed(3) || '0.000'} DT<br>
              <strong>Date:</strong> ${new Date(existingFacture.createdAt).toLocaleDateString('fr-FR')}
            </p>
            <div class="bg-orange-100 border border-orange-300 rounded p-3 mt-3">
              <p class="text-xs text-orange-700">
                ⚠️ <strong>Attention:</strong> Le devis a été modifié après la création de cette facture.
              </p>
            </div>
          </div>
        </div>
        
        <div class="space-y-3 mb-6">
          <button data-action="view_existing" class="modal-btn w-full bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors text-left">
            <div class="font-medium">📄 Consulter la facture actuelle</div>
            <div class="text-sm opacity-90">Afficher la facture sans modification</div>
          </button>
          
          <button data-action="replace_with_credit" class="modal-btn w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors text-left">
            <div class="font-medium">✅ Remplacer par nouvelle facture</div>
            <div class="text-sm opacity-90">Crée un avoir d'annulation + nouvelle facture (procédure légale)</div>
          </button>
          
          <button data-action="cancel" class="modal-btn w-full bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors">
            ❌ Annuler
          </button>
        </div>
        
        <div class="bg-green-50 border border-green-200 p-4 rounded-lg">
          <div class="text-xs text-green-700">
            <p class="font-semibold mb-2">💡 Procédure recommandée:</p>
            <ul class="list-disc list-inside space-y-1">
              <li>Un avoir d'annulation annule l'ancienne facture</li>
              <li>Une nouvelle facture est créée avec les données actuelles</li>
              <li>Traçabilité complète et conformité légale garantie</li>
            </ul>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const cleanup = () => {
      if (document.body.contains(modal)) {
        document.body.removeChild(modal);
      }
    };
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        cleanup();
        resolve('cancel');
        return;
      }
      
      const button = e.target.closest('.modal-btn');
      if (button) {
        const action = button.getAttribute('data-action');
        cleanup();
        resolve(action);
      }
    });
  });
};

// ✅ Fonction pour remplacer une facture avec avoir (utilise votre endpoint existant)
const replaceFactureWithCredit = async (devis, oldFacture) => {
  try {
    const token = localStorage.getItem("token");
    
    // ✅ Utilise votre endpoint existant avec createCreditNote: true
    const response = await axios.post(
      `http://localhost:5000/api/create-with-credit/${devis._id || devis.id}`,
      {
        createCreditNote: true // ✅ Force la création d'avoir
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.success) {
      const { facture: newFacture, creditNote } = response.data;
      
      setSelectedFacture(newFacture);
      setShowFactureModal(true);
      
      showSuccess(
        `✅ Remplacement effectué ! Avoir N°${creditNote.creditNumber} créé, nouvelle facture N°${newFacture.numeroFacture} générée.`
      );

      // Mettre à jour l'état local
      setFactureExists(prev => ({
        ...prev,
        [devis.id]: newFacture
      }));
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
    showError(error.response?.data?.message || 'Erreur lors du remplacement de la facture');
  }
};

// ✅ Créer une nouvelle facture (première fois) - utilise votre endpoint simple
const createNewFacture = async (devis) => {
  try {
    const token = localStorage.getItem("token");
    
    // ✅ Utilise l'endpoint simple pour première création
    const response = await axios.post(
      `http://localhost:5000/api/create/${devis._id || devis.id}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.success) {
      const newFacture = response.data.facture;
      
      setSelectedFacture(newFacture);
      setShowFactureModal(true);
      
      showSuccess(`✅ Facture créée avec succès (N°${newFacture.numeroFacture}) !`);

      setFactureExists(prev => ({
        ...prev,
        [devis.id]: newFacture
      }));
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
    showError(error.response?.data?.message || 'Erreur lors de la création de facture');
  }
};

// ✅ Fonction pour vérifier facture active (exclut les factures annulées)
const checkActiveFactureExists = async (devisId) => {
  try {
    const response = await axios.get(`http://localhost:5000/api/factureByDevis/${devisId}`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` }
    });
    
    // Vérifier que la facture est active (pas annulée)
    const facture = response.data;
    return facture && facture.status !== 'cancelled' ? facture : null;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error('Erreur vérification facture:', error);
    return null;
  }
};



  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Devis</h1>
          <p className="text-gray-600">Système de devis pour atelier mécanique</p>
        </div>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('list')}
                className={`py-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'list'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                Liste des Devis
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`py-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'create'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                Nouveau Devis
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'list' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Filtres de recherche</h3>
                <button
                  onClick={resetFilters}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Réinitialiser
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* FILTRE STATUT */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Tous</option>
                    <option value="brouillon">Brouillon</option>
                    <option value="envoye">Envoyé</option>
                    <option value="accepte">Accepté</option>
                    <option value="refuse">Refusé</option>
                  </select>
                </div>

                {/* FILTRE CLIENT */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client
                  </label>
                  <input
                    type="text"
                    value={filters.clientName}
                    onChange={(e) => handleFilterChange('clientName', e.target.value)}
                    placeholder="Nom du client..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        applyFilters();
                      }
                    }}
                  />
                </div>

                {/* FILTRE DATE DÉBUT */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date début
                  </label>
                  <input
                    type="date"
                    value={filters.dateDebut}
                    onChange={(e) => handleFilterChange('dateDebut', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* FILTRE DATE FIN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date fin
                  </label>
                  <input
                    type="date"
                    value={filters.dateFin}
                    onChange={(e) => handleFilterChange('dateFin', e.target.value)}
                    min={filters.dateDebut} // La date de fin ne peut pas être avant la date de début
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* BOUTONS D'ACTIONS */}
                <div className="flex items-end space-x-2">
                  <button
                    onClick={applyFilters}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                    disabled={loading}
                  >
                    {loading && (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    <span>{loading ? 'Filtrage...' : 'Filtrer'}</span>
                  </button>
                </div>
              </div>

              {/* INDICATEURS DE FILTRES ACTIFS */}
              {(filters.status || filters.clientName || filters.dateDebut || filters.dateFin) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-sm text-gray-600">Filtres actifs:</span>

                  {filters.status && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Statut: {filters.status}
                      <button
                        onClick={() => handleFilterChange('status', '')}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {filters.clientName && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Client: {filters.clientName}
                      <button
                        onClick={() => handleFilterChange('clientName', '')}
                        className="ml-1 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {filters.dateDebut && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Du: {filters.dateDebut}
                      <button
                        onClick={() => handleFilterChange('dateDebut', '')}
                        className="ml-1 text-purple-600 hover:text-purple-800"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {filters.dateFin && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Au: {filters.dateFin}
                      <button
                        onClick={() => handleFilterChange('dateFin', '')}
                        className="ml-1 text-orange-600 hover:text-orange-800"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              )}

              {/* RÉSUMÉ DES RÉSULTATS */}
              <div className="mt-4 text-sm text-gray-600">
                {quotes.length} devis affiché(s)
                {(filters.status || filters.clientName || filters.dateDebut || filters.dateFin) && (
                  <span> (filtré(s))</span>
                )}
              </div>
            </div>

            {/* Quotes List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Devis Récents</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Devis
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Véhicule
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total TTC
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ordres
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentDevis.map((quote) => {
                      // Normaliser le status pour qu'il corresponde aux clés de statusIcons
                      const normalizedStatus = quote.status?.toLowerCase() || 'brouillon';
                      const StatusIcon = statusIcons[normalizedStatus] || FileText;
                      const statusColor = statusColors[normalizedStatus] || statusColors.brouillon;
                      return (
                        <tr key={quote.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {quote.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <User className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900">{quote.clientName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Car className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900">{quote.vehicleInfo}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900">{quote.inspectionDate}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">
                              {quote.totalTTC?.toFixed(3) || '0.000'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {quote.status?.charAt(0).toUpperCase() + quote.status?.slice(1) || 'Brouillon'}
                            </span>
                          </td>


                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => setSelectedQuote(quote)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Voir détails"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => startEditQuote(quote)}
                              className="text-green-600 hover:text-green-900"
                              title="Modifier"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>

                            {/* Bouton Send - visible seulement pour les devis en brouillon */}
                            {quote.status === 'brouillon' && (
                              <button
                                onClick={() => sendDevisByEmail(quote.id)}
                                className="text-indigo-600 hover:text-indigo-900"
                                disabled={loading}
                                title="Envoyer par email"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                            )}

                            {/* NOUVEAU: Bouton Facture - visible seulement pour les devis acceptés */}

                            <button
                              onClick={async () => {
                                try {
                                  const response = await axios.get(
                                    `http://localhost:5000/api/factureByDevis/${quote._id}`,{
                                      headers: { Authorization: `Bearer ${getAuthToken()}` }
                                    }
                                  );
                                  setSelectedFacture(response.data);
                                  setShowFactureModal(true);
                                } catch (error) {
                                  console.error("Erreur lors de la récupération de la facture:", error);
                                  showError("Aucune facture trouvée pour ce devis");
                                }
                              }}
                              className="text-purple-600 hover:text-purple-900 text-xs bg-purple-100 px-2 py-1 rounded"
                              title="Voir facture existante"
                            >
                              <FileText className="h-4 w-4 inline mr-1" />
                              Voir
                            </button>




                            <button
                              onClick={() => createFactureFromDevis(quote)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Créer facture"
                            >
                              <Plus className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => deleteQuote(quote.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {quote.status === 'accepte' ? (
                              <button
                                onClick={() => createWorkOrder(quote)}
                                className="bg-orange-600 text-white px-3 py-1 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-1"
                                title="Créer ordre de travail"
                              >
                                <FileText className="h-4 w-4" />
                                <span className="hidden sm:inline">Ordre</span>
                              </button>
                            ) : (
                              <button
                                disabled
                                className="bg-gray-300 text-gray-500 px-3 py-1 rounded-lg cursor-not-allowed flex items-center space-x-1"
                                title="Devis doit être accepté"
                              >
                                <FileText className="h-4 w-4" />
                                <span className="hidden sm:inline">Ordre</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Affichage de {indexOfFirstDevis + 1} à {Math.min(indexOfLastDevis, quotes.length)} sur {quotes.length} devis
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Précédent
                      </button>
                      
                      <div className="flex items-center space-x-1">
                        {[...Array(totalPages)].map((_, index) => {
                          const pageNumber = index + 1;
                          const isCurrentPage = pageNumber === currentPage;
                          
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => setCurrentPage(pageNumber)}
                              className={`px-3 py-2 text-sm font-medium rounded-md ${
                                isCurrentPage
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Suivant
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'create' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{isEditMode ? 'Modifier le Devis' : 'Créer un Nouveau Devis'}</h2>

            {/* Client Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du Client *
                </label>
                <select
                  value={selectedClientId}
                  onChange={handleClientChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Sélectionner un client --</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.nom} ({client.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sélecteur de véhicule */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Véhicule *
                </label>
                <select
                  value={selectedVehiculeId}  // ✅ CORRECT - utilise l'ID
                  onChange={(e) => {
                    const vehiculeId = e.target.value;
                    const selectedVehicule = vehicules.find(v => v._id === vehiculeId);

                    setSelectedVehiculeId(vehiculeId);
                    setNewQuote({
                      ...newQuote,
                      vehicleInfo: selectedVehicule ? `${selectedVehicule.marque} ${selectedVehicule.modele} - ${selectedVehicule.immatriculation}` : ''
                    });
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">
                    {!selectedClientId
                      ? "Sélectionnez d'abord un client"
                      : loadingVehicules
                        ? "Chargement des véhicules..."
                        : vehicules.length === 0
                          ? "Aucun véhicule trouvé"
                          : "-- Sélectionner un véhicule --"
                    }
                  </option>
                  {vehicules.map((vehicule) => (
                    <option
                      key={vehicule._id}
                      value={vehicule._id}  // ✅ CORRECT - utilise l'ID comme value
                    >
                      {vehicule.marque} {vehicule.modele} - {vehicule.immatriculation} ({vehicule.annee})
                    </option>
                  ))}
                </select>

                {/* Indicateur de chargement optionnel */}
                {loadingVehicules && (
                  <div className="mt-1 text-sm text-blue-600 flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Chargement des véhicules...
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date d'Inspection *
                </label>
                <input
                  type="date"
                  value={newQuote.inspectionDate}
                  onChange={(e) =>
                    setNewQuote({ ...newQuote, inspectionDate: e.target.value })
                  }
                  min={new Date().toISOString().split("T")[0]} // ✅ interdit les dates avant aujourd'hui
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>


            </div>

            {/* Services */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Services et Réparations</h3>
                <button
                  onClick={addService}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Ajouter piéce</span>
                </button>

              </div>

              <div className="space-y-4">
                {newQuote.services.map((service, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                    {/* Bouton de suppression - visible seulement s'il y a plus d'un service */}
                    {newQuote.services.length > 1 && (
                      <button
                        onClick={() => removeService(index)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-1 transition-colors"
                        title="Supprimer cette ligne"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Sélecteur de pièce */}

                      <div className="md:col-span-2">
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Pièce *
  </label>
  <input
    type="text"
    value={service.piece}
    onChange={(e) => updateService(index, 'piece', e.target.value)}
    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    placeholder="Nom de la pièce ou service"
    required
  />
</div>

                      {/* Quantité */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantité *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={service.quantity}
                          onChange={(e) => updateService(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Prix unitaire (automatique mais modifiable) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Prix une seul pièce (Dinnar)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={service.unitPrice}
                          onChange={(e) => updateService(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                          placeholder="Sélectionnez une pièce"
                        />
                        <div className="mt-1 text-xs text-gray-500">
                          Prix automatique, modifiable
                        </div>
                      </div>
                    </div>

                    {/* Affichage du total pour cette ligne */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total cette ligne :</span>
                        <span className="text-sm font-medium text-gray-900">
                          {(service.quantity * service.unitPrice).toFixed(2)} Dinnar
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taux TVA (%) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={tvaRate}
                  onChange={(e) => setTvaRate(parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="20"
                />
                <div className="mt-1 text-xs text-gray-500">
                  Taux de TVA applicable
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Main D’œuvre
                </label>
                <input
                  type="number"
                  value={maindoeuvre}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => setMaindoeuvre(parseFloat(e.target.value) || 0)}
                />

              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temps Estimé
                </label>
                <div className="flex gap-2">
                  <div className="flex flex-col">
                    <input
                      type="number"
                      min="0"
                      value={estimatedTime.days}
                      onChange={(e) => setEstimatedTime({
                        ...estimatedTime,
                        days: parseInt(e.target.value) || 0
                      })}
                      className="w-20 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Jours"
                    />
                    <span className="text-xs text-gray-500 text-center mt-1">Jours</span>
                  </div>

                  <div className="flex flex-col">
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={estimatedTime.hours}
                      onChange={(e) => setEstimatedTime({
                        ...estimatedTime,
                        hours: parseInt(e.target.value) || 0
                      })}
                      className="w-20 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Heures"
                    />
                    <span className="text-xs text-gray-500 text-center mt-1">Heures</span>
                  </div>

                  <div className="flex flex-col">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={estimatedTime.minutes}
                      onChange={(e) => setEstimatedTime({
                        ...estimatedTime,
                        minutes: parseInt(e.target.value) || 0
                      })}
                      className="w-20 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Minutes"
                    />
                    <span className="text-xs text-gray-500 text-center mt-1">Minutes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Récapitulatif</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total pièces HT:</span>
                  <span className="font-medium">{newQuote.services.reduce((sum, service) => sum + (service.quantity * service.unitPrice), 0).toFixed(3)} Dinnar</span>
                </div>
                <div className="flex justify-between">
                  <span>Main d'œuvre:</span>
                  <span className="font-medium">{(maindoeuvre || 0).toFixed(3)} Dinnar</span>
                </div>
                <div className="flex justify-between">
                  <span>Total HT:</span>
                  <span className="font-medium">{calculateTotal(newQuote.services, maindoeuvre).totalHT.toFixed(3)} Dinnar</span>
                </div>

                <div className="flex justify-between">
                  <span>TVA ({tvaRate}%):</span> {/* ✅ Affiche le taux dynamique */}
                  <span className="font-medium">{(calculateTotal(newQuote.services, maindoeuvre).totalTTC - calculateTotal(newQuote.services, maindoeuvre).totalHT).toFixed(2)} Dinnar</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total TTC:</span>
                  <span>{calculateTotal(newQuote.services, maindoeuvre).totalTTC.toFixed(2)} Dinnar</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-4">
              <button
                onClick={saveQuote}
                disabled={loading}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                <span>
                  {loading
                    ? (isEditMode ? 'Modification...' : 'Enregistrement...')
                    : (isEditMode ? 'Modifier le Devis' : 'Enregistrer le Devis')
                  }
                </span>
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Quote Detail Modal */}
        {selectedQuote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full m-4 max-h-screen overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Devis {selectedQuote.id}</h2>
                  <button
                    onClick={() => setSelectedQuote(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
              <div id="invoice-content" className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Informations Client</h3>
                    <p className="text-gray-600">Nom: {selectedQuote.clientName}</p>
                    <p className="text-gray-600">Véhicule: {selectedQuote.vehicleInfo}</p>
                    <p className="text-gray-600">Date d'inspection: {selectedQuote.inspectionDate}</p>
                    <p className="text-gray-600">
                      Temps estimé: {selectedQuote.estimatedTime?.days || 0}j {selectedQuote.estimatedTime?.hours || 0}h {selectedQuote.estimatedTime?.minutes || 0}min
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Statut</h3>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[selectedQuote.status]}`}>
                      {selectedQuote.status.charAt(0).toUpperCase() + selectedQuote.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-4">Détail des Services</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Piéce</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qté</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Prix Unit.</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedQuote.services.map((service, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">{service.piece}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{service.quantity}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{(service.unitPrice || 0).toFixed(3)} Dinnar</td>
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">
                              {((service.quantity || 0) * (service.unitPrice || 0)).toFixed(3)} Dinnar
                            </td>
                          </tr>
                        ))}
                      </tbody>
                  </table>
                
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="space-y-2">
                    {/* Détail des composants */}
                    <div className="flex justify-between text-gray-600">
                      <span>Total pièces HT:</span>
                      <span>{((selectedQuote.totalHT || 0)).toFixed(3)} Dinnar</span>
                    </div>

                    <div className="flex justify-between text-gray-600">
                      <span>Main d'œuvre:</span>
                      <span>{(selectedQuote.maindoeuvre || 0).toFixed(3)} Dinnar</span>
                    </div>

                    {/* Sous-total */}
                    <div className="flex justify-between font-medium border-t pt-2">
                      <span>Total HT:</span>
                      <span>{((selectedQuote.totalHT || 0) + (selectedQuote.maindoeuvre || 0)).toFixed(3)} Dinnar</span>
                    </div>

                    {/* TVA */}
                    <div className="flex justify-between text-blue-600">
                      <span>TVA ({selectedQuote.tvaRate || 20}%):</span>
                      <span>
                        {(
                          ((selectedQuote.totalHT || 0) + (selectedQuote.maindoeuvre || 0)) *
                          ((selectedQuote.tvaRate || 20) / 100)
                        ).toFixed(3)} Dinnar
                      </span>
                    </div>

                    {/* Total final */}
                    <div className="flex justify-between text-lg font-bold border-t pt-2 text-green-700">
                      <span>Total TTC:</span>
                      <span>
                        {(
                          (selectedQuote.totalHT || 0) +
                          (selectedQuote.maindoeuvre || 0) +
                          ((selectedQuote.totalHT || 0) + (selectedQuote.maindoeuvre || 0)) *
                          ((selectedQuote.tvaRate || 20) / 100)
                        ).toFixed(3)} Dinnar
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200">
                <div className="flex space-x-4">
                  <button
                    onClick={printInvoice}
                    disabled={isGeneratingPDF}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {isGeneratingPDF ? 'Génération...' : 'Télécharger PDF'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showFactureModal && selectedFacture && (

          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full m-4 max-h-screen overflow-y-auto">


              {/* Contenu de la facture - Format professionnel */}
              <div className="p-8 print:p-4" id="invoice-content">
                {/* Header de la facture */}
                <div className="flex justify-between items-start mb-8">
                  {/* Informations de l'entreprise */}
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-blue-600 mb-2">GARAGE AUTO</h1>

                  </div>

                  {/* Logo et titre facture */}
                  <div className="text-right">
                    <div className="text-gray-600 space-y-1">
                      <p><strong>Date facture:</strong> {new Date(selectedFacture.invoiceDate).toLocaleDateString('fr-FR')}</p>
                      <p><strong>Date d'échéance:</strong> {new Date(selectedFacture.dueDate).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                </div>

                {/* Informations client */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">FACTURER À</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-semibold text-lg">{selectedFacture.clientName}</p>
                    <p className="text-gray-600 mt-1">Véhicule: {selectedFacture.vehicleInfo}</p>
                    <p className="text-gray-600">Date d'intervention: {new Date(selectedFacture.inspectionDate).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>

                {/* Tableau des services */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">DÉTAIL DES PRESTATIONS</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Désignation</th>
                          <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Qté</th>
                          <th className="border border-gray-300 px-4 py-3 text-right font-semibold">Prix Unit. HT</th>
                          <th className="border border-gray-300 px-4 py-3 text-right font-semibold">Total HT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedFacture.services.map((service, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-3">{service.piece}</td>
                            <td className="border border-gray-300 px-4 py-3 text-center">{service.quantity}</td>
                            <td className="border border-gray-300 px-4 py-3 text-right">{(service.unitPrice || 0).toFixed(3)} DT</td>
                            <td className="border border-gray-300 px-4 py-3 text-right font-semibold">
                              {((service.quantity || 0) * (service.unitPrice || 0)).toFixed(3)} DT
                            </td>
                          </tr>
                        ))}

                        {/* Ligne main d'œuvre si présente */}
                        {selectedFacture.maindoeuvre > 0 && (
                          <tr className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-3 font-medium">Main d'œuvre</td>
                            <td className="border border-gray-300 px-4 py-3 text-center">1</td>
                            <td className="border border-gray-300 px-4 py-3 text-right">{(selectedFacture.maindoeuvre || 0).toFixed(3)} DT</td>
                            <td className="border border-gray-300 px-4 py-3 text-right font-semibold">
                              {(selectedFacture.maindoeuvre || 0).toFixed(3)} DT
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totaux */}
                <div className="flex justify-end mb-8">
                  <div className="w-80">
                    <div className="bg-gray-50 p-6 rounded-lg space-y-3">
                      <div className="flex justify-between text-gray-700">
                        <span>Total HT:</span>
                        <span className="font-semibold">
                          {((selectedFacture.totalHT || 0)).toFixed(3)} DT
                        </span>
                      </div>

                      <div className="flex justify-between text-gray-700">
                        <span>TVA ({selectedFacture.tvaRate || 20}%):</span>
                        <span className="font-semibold">
                          {(
                            ((selectedFacture.totalHT || 0)) *
                            ((selectedFacture.tvaRate || 20) / 100)
                          ).toFixed(3)} DT
                        </span>
                      </div>

                      <div className="border-t border-gray-300 pt-3">
                        <div className="flex justify-between text-xl font-bold text-green-700">
                          <span>Total TTC:</span>
                          <span>
                            {(
                              (selectedFacture.totalHT || 0) +
                              ((selectedFacture.totalHT || 0)) *
                              ((selectedFacture.tvaRate || 20) / 100)
                            ).toFixed(3)} DT
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conditions de paiement */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-300 pb-1">CONDITIONS DE PAIEMENT</h3>
                  <div className="bg-yellow-50 p-4 rounded-lg text-sm text-gray-700 space-y-1">
                    <p>• Paiement à 30 jours à compter de la date de facture</p>
                    <p>• En cas de retard de paiement, des pénalités de 3% par mois seront appliquées</p>
                    <p>• Aucun escompte accordé pour paiement anticipé</p>
                    <p>• Règlement par chèque, virement ou espèces</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center text-gray-500 text-sm border-t pt-4">
                  <p>GARAGE AUTO</p>

                </div>
              </div>

              {/* Actions - Masquées lors de l'impression */}
              <div className="p-6 border-t border-gray-200 flex space-x-4 no-print">
                <button
                  onClick={() => window.print()}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Imprimer
                </button>


                <button
                  onClick={() => setSelectedFacture(null)}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
          

        )}

      </div>
    </div>


  );
};

export default GarageQuoteSystem;