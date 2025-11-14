// components/garage/GarageForm.tsx
import { Building2, Loader2, ArrowRight } from 'lucide-react';

interface GarageFormProps {
  garageData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

export default function GarageForm({ garageData, onChange, onSubmit, loading }: GarageFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Informations du Garage</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom du Garage <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="garagenom"
            value={garageData.garagenom}
            onChange={onChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Garage Auto Plus"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Matricule Fiscal <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="matriculefiscal"
            value={garageData.matriculefiscal}
            onChange={onChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="1234567/A/M/000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Gouvernorat</label>
          <input
            type="text"
            name="governorateName"
            value={garageData.governorateName}
            onChange={onChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Tunis"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
          <input
            type="text"
            name="cityName"
            value={garageData.cityName}
            onChange={onChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ariana"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
          <input
            type="text"
            name="streetAddress"
            value={garageData.streetAddress}
            onChange={onChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="123 Avenue de la République"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            name="description"
            value={garageData.description}
            onChange={onChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Garage spécialisé dans la réparation et l'entretien automobile..."
          />
        </div>



        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Horaires</label>
          <input
            type="text"
            name="horaires"
            value={garageData.horaires}
            onChange={onChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Lun-Sam: 8h-18h"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Services (séparés par des virgules)
          </label>
          <input
            type="text"
            name="services"
            value={garageData.services}
            onChange={onChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Réparation moteur, Vidange, Climatisation, Freinage"
          />
        </div>
      </div>

      <div className="flex gap-4 pt-6 border-t">
     
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Création en cours...
            </>
          ) : (
            <>
              Créer le Garage
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}