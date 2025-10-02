"use client"
// components/client/MesVehicules.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function MesVehicules() {
  const [vehicules, setVehicules] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    marque: '',
    modele: '',
    immatriculation: '',
    annee: '',
    couleur: '',
    typeCarburant: 'essence',
    kilometrage: ''
  });

  useEffect(() => {
    fetchVehicules();
  }, []);

  const fetchVehicules = async () => {
    try {
      const res = await axios.get('/api/client/mes-vehicules');
      setVehicules(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/client/vehicules', formData);
      setShowForm(false);
      fetchVehicules();
      // Reset form
      setFormData({
        marque: '',
        modele: '',
        immatriculation: '',
        annee: '',
        couleur: '',
        typeCarburant: 'essence',
        kilometrage: ''
      });
    } catch (error) {
      alert(error.response?.data?.error || 'Erreur');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mes Véhicules</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Ajouter un véhicule
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Nouveau Véhicule</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2">Marque *</label>
              <input
                type="text"
                required
                value={formData.marque}
                onChange={(e) => setFormData({...formData, marque: e.target.value})}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="block mb-2">Modèle *</label>
              <input
                type="text"
                required
                value={formData.modele}
                onChange={(e) => setFormData({...formData, modele: e.target.value})}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="block mb-2">Immatriculation *</label>
              <input
                type="text"
                required
                value={formData.immatriculation}
                onChange={(e) => setFormData({...formData, immatriculation: e.target.value.toUpperCase()})}
                className="w-full border px-3 py-2 rounded"
                placeholder="123TU456"
              />
            </div>
            <div>
              <label className="block mb-2">Année</label>
              <input
                type="number"
                value={formData.annee}
                onChange={(e) => setFormData({...formData, annee: e.target.value})}
                className="w-full border px-3 py-2 rounded"
                min="1900"
                max={new Date().getFullYear() + 1}
              />
            </div>
            <div>
              <label className="block mb-2">Couleur</label>
              <input
                type="text"
                value={formData.couleur}
                onChange={(e) => setFormData({...formData, couleur: e.target.value})}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="block mb-2">Type Carburant</label>
              <select
                value={formData.typeCarburant}
                onChange={(e) => setFormData({...formData, typeCarburant: e.target.value})}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="essence">Essence</option>
                <option value="diesel">Diesel</option>
                <option value="hybride">Hybride</option>
                <option value="electrique">Électrique</option>
                <option value="gpl">GPL</option>
              </select>
            </div>
            <div>
              <label className="block mb-2">Kilométrage</label>
              <input
                type="number"
                value={formData.kilometrage}
                onChange={(e) => setFormData({...formData, kilometrage: e.target.value})}
                className="w-full border px-3 py-2 rounded"
                min="0"
              />
            </div>
            <div className="col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
              >
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des véhicules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicules.map((v) => (
          <div key={v._id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{v.marque} {v.modele}</h3>
              <span className="text-2xl">🚗</span>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Immatriculation:</span> {v.immatriculation}</p>
              {v.annee && <p><span className="font-medium">Année:</span> {v.annee}</p>}
              {v.couleur && <p><span className="font-medium">Couleur:</span> {v.couleur}</p>}
              {v.kilometrage && <p><span className="font-medium">Kilométrage:</span> {v.kilometrage} km</p>}
              <p><span className="font-medium">Carburant:</span> {v.typeCarburant}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="text-blue-600 hover:underline text-sm">Modifier</button>
              <button className="text-red-600 hover:underline text-sm">Supprimer</button>
            </div>
          </div>
        ))}
      </div>

      {vehicules.length === 0 && !showForm && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">Aucun véhicule enregistré</p>
          <p>Cliquez sur "Ajouter un véhicule" pour commencer</p>
        </div>
      )}
    </div>
  );
}