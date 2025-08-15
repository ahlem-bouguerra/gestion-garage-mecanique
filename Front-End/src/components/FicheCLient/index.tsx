"use client";
import React, { useState, useMemo } from 'react';
import { Search, Filter, Plus, User, Building2, Calendar, Car, Phone, Mail, MapPin, Eye, Edit, Trash2 } from 'lucide-react';

const ClientManagement = () => {
  const [clients, setClients] = useState([
    {
      id: 1,
      nom: "Martin Dupont",
      type: "particulier",
      adresse: "123 Rue de la Paix, 75001 Paris",
      telephone: "01 23 45 67 89",
      email: "martin.dupont@email.com",
      derniereVisite: "2024-08-10",
      vehiculeAssocie: "Renault Clio - AB-123-CD",
      contactsSecondaires: [
        { nom: "Marie Dupont", relation: "Épouse", telephone: "01 23 45 67 90", email: "marie.dupont@email.com" }
      ],
      historiqueVisites: [
        { date: "2024-08-10", service: "Révision complète", montant: "250€" },
        { date: "2024-06-15", service: "Changement pneus", montant: "320€" }
      ]
    },
    {
      id: 2,
      nom: "Entreprise LogiTrans SARL",
      type: "professionnel",
      adresse: "456 Avenue des Affaires, 69000 Lyon",
      telephone: "04 12 34 56 78",
      email: "contact@logitrans.com",
      derniereVisite: "2024-08-05",
      vehiculeAssocie: "Flotte de 15 véhicules utilitaires",
      contactsSecondaires: [
        { nom: "Jean Moreau", relation: "Responsable flotte", telephone: "04 12 34 56 79", email: "j.moreau@logitrans.com" },
        { nom: "Sophie Bernard", relation: "Chauffeur/Livreur", telephone: "04 12 34 56 80", email: "s.bernard@logitrans.com" },
        { nom: "Marc Dubois", relation: "Commercial", telephone: "04 12 34 56 81", email: "m.dubois@logitrans.com" }
      ],
      historiqueVisites: [
        { date: "2024-08-05", service: "Entretien flotte", montant: "2850€" },
        { date: "2024-07-20", service: "Réparation urgente", montant: "450€" }
      ]
    },
    {
      id: 3,
      nom: "Claire Leblanc",
      type: "particulier",
      adresse: "789 Boulevard du Soleil, 13000 Marseille",
      telephone: "04 91 23 45 67",
      email: "claire.leblanc@email.com",
      derniereVisite: "2024-07-28",
      vehiculeAssocie: "Peugeot 308 - CD-456-EF",
      contactsSecondaires: [],
      historiqueVisites: [
        { date: "2024-07-28", service: "Contrôle technique", montant: "80€" },
        { date: "2024-05-10", service: "Vidange", montant: "65€" }
      ]
    },
    {
      id: 4,
      nom: "Ahmed Ben Ali",
      type: "particulier", 
      adresse: "15 Avenue Habib Bourguiba, 1000 Tunis",
      telephone: "71 123 456",
      email: "ahmed.benali@email.com",
      derniereVisite: "2024-08-12",
      vehiculeAssocie: "Toyota Corolla - TN-1234-AB (Ahmed) + Peugeot 207 - TN-5678-CD (Épouse)",
      contactsSecondaires: [
        { nom: "Fatma Ben Ali", relation: "Épouse", telephone: "71 123 457", email: "fatma.benali@email.com" },
        { nom: "Mohamed Ben Ali", relation: "Fils", telephone: "71 123 458", email: "mohamed.benali@email.com" }
      ],
      historiqueVisites: [
        { date: "2024-08-12", service: "Révision Toyota Corolla (Ahmed)", montant: "180€" },
        { date: "2024-08-01", service: "Réparation Peugeot 207 (Épouse)", montant: "320€" },
        { date: "2024-07-15", service: "Vidange Toyota (Fils)", montant: "75€" }
      ]
    }
    ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("tous");
  const [selectedClient, setSelectedClient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("view");
  const [formData, setFormData] = useState({
    nom: "",
    type: "particulier",
    adresse: "",
    telephone: "",
    email: "",
    vehiculeAssocie: ""
  });

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          client.vehiculeAssocie.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          client.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "tous" || client.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [clients, searchTerm, filterType]);

  const openModal = (type, client = null) => {
    setModalType(type);
    if (client) {
      setSelectedClient(client);
      setFormData({
        nom: client.nom,
        type: client.type,
        adresse: client.adresse,
        telephone: client.telephone,
        email: client.email,
        vehiculeAssocie: client.vehiculeAssocie
      });
    } else {
      setFormData({
        nom: "",
        type: "particulier",
        adresse: "",
        telephone: "",
        email: "",
        vehiculeAssocie: ""
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedClient(null);
  };

  const handleSubmit = () => {
    if (modalType === "add") {
      const newClient = {
        id: clients.length + 1,
        ...formData,
        derniereVisite: new Date().toISOString().split('T')[0],
        contactsSecondaires: [],
        historiqueVisites: []
      };
      setClients([...clients, newClient]);
    } else if (modalType === "edit") {
      setClients(clients.map(client =>
        client.id === selectedClient.id
          ? { ...client, ...formData }
          : client
      ));
    }
    closeModal();
  };

  const deleteClient = (id) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
      setClients(clients.filter(client => client.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Clients</h1>
            <button
              onClick={() => openModal("add")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Client</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher par nom, véhicule ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="tous">Tous les types</option>
                <option value="particulier">Particuliers</option>
                <option value="professionnel">Professionnels</option>
              </select>
            </div>
          </div>
        </div>

        {/* Clients List */}
        <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-2">
          {filteredClients.map((client) => (
            <div key={client.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {client.type === "professionnel" ? (
                      <Building2 className="w-8 h-8 text-blue-600" />
                    ) : (
                      <User className="w-8 h-8 text-green-600" />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{client.nom}</h3>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        client.type === "professionnel" 
                          ? "bg-blue-100 text-blue-800" 
                          : "bg-green-100 text-green-800"
                      }`}>
                        {client.type === "professionnel" ? "Professionnel" : "Particulier"}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openModal("view", client)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Voir détails"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openModal("edit", client)}
                      className="p-2 text-gray-500 hover:text-orange-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteClient(client.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>{client.adresse}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4" />
                    <span>{client.telephone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>{client.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Car className="w-4 h-4" />
                    <span>{client.vehiculeAssocie}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Dernière visite: {new Date(client.derniereVisite).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>

                {client.contactsSecondaires.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Conducteurs autorisés:</h4>
                    {client.contactsSecondaires.map((contact, index) => (
                      <div key={index} className="text-xs text-gray-500 mb-1 flex items-center justify-between">
                        <span>{contact.nom} ({contact.relation})</span>
                        <span className="text-blue-600">{contact.telephone}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredClients.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun client trouvé</h3>
            <p className="text-gray-500">Aucun client ne correspond à vos critères de recherche.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {modalType === "add" && "Nouveau Client"}
                  {modalType === "edit" && "Modifier Client"}
                  {modalType === "view" && "Détails Client"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              {modalType === "view" ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                      <p className="text-gray-900">{selectedClient.nom}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <p className="text-gray-900 capitalize">{selectedClient.type}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                      <p className="text-gray-900">{selectedClient.adresse}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                      <p className="text-gray-900">{selectedClient.telephone}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <p className="text-gray-900">{selectedClient.email}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Véhicule associé</label>
                      <p className="text-gray-900">{selectedClient.vehiculeAssocie}</p>
                    </div>
                  </div>

                  {selectedClient.contactsSecondaires.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Conducteurs autorisés / Contacts famille</h3>
                      <div className="space-y-3">
                        {selectedClient.contactsSecondaires.map((contact, index) => (
                          <div key={index} className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                            <div className="flex justify-between items-start mb-2">
                              <p className="font-medium text-gray-900">{contact.nom}</p>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {contact.relation}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {contact.telephone}
                            </p>
                            {contact.email && (
                              <p className="text-sm text-gray-600 flex items-center mt-1">
                                <Mail className="w-3 h-3 mr-1" />
                                {contact.email}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-700">
                          💡 <strong>Ces personnes sont autorisées à :</strong> déposer/récupérer les véhicules, 
                          prendre des décisions d'entretien, et recevoir les communications du garage.
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Historique des visites</h3>
                    <div className="space-y-2">
                      {selectedClient.historiqueVisites.map((visite, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                          <div>
                            <p className="font-medium">{visite.service}</p>
                            <p className="text-sm text-gray-600">{new Date(visite.date).toLocaleDateString('fr-FR')}</p>
                          </div>
                          <p className="font-bold text-green-600">{visite.montant}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                      <input
                        type="text"
                        value={formData.nom}
                        onChange={(e) => setFormData({...formData, nom: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="particulier">Particulier</option>
                        <option value="professionnel">Professionnel</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                    <input
                      type="text"
                      value={formData.adresse}
                      onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                      <input
                        type="tel"
                        value={formData.telephone}
                        onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Véhicule associé</label>
                    <input
                      type="text"
                      value={formData.vehiculeAssocie}
                      onChange={(e) => setFormData({...formData, vehiculeAssocie: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Renault Clio - AB-123-CD"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {modalType === "add" ? "Ajouter" : "Sauvegarder"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagement;