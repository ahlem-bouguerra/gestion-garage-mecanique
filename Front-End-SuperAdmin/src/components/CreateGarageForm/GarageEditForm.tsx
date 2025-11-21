// components/garage/GarageEditForm.tsx
import { Building2, Loader2, ArrowRight, Clock } from 'lucide-react';
import { useState, useEffect } from "react";

interface GarageEditFormProps {
  garageData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

export default function GarageEditForm({ garageData, onChange, onSubmit, loading }: GarageEditFormProps) {
  const [phoneError, setPhoneError] = useState("");
  const [horaires, setHoraires] = useState({
    lundi: { debut: '08:00', fin: '19:00', ferme: false },
    mardi: { debut: '08:00', fin: '19:00', ferme: false },
    mercredi: { debut: '08:00', fin: '19:00', ferme: false },
    jeudi: { debut: '08:00', fin: '19:00', ferme: false },
    vendredi: { debut: '08:00', fin: '19:00', ferme: false },
    samedi: { debut: '08:00', fin: '17:00', ferme: false },
    dimanche: { debut: '', fin: '', ferme: true }
  });

  // Initialiser les horaires depuis garageData
  useEffect(() => {
    if (garageData.horaires) {
      // Parser la chaîne existante et mettre à jour l'état
      // Cette fonction est simplifiée, adapte-la selon ton format exact
      console.log('Horaires existants:', garageData.horaires);
    }
  }, [garageData.horaires]);

  const validateTunisianPhone = (phone: string) => {
    const cleaned = phone.replace(/[\s\-+]/g, '');
    const number = cleaned.startsWith('216') ? cleaned.slice(3) : cleaned;
    const tunisianPattern = /^[24579]\d{7}$/;

    if (!number) return "Numéro requis";
    if (number.length !== 8) return "Le numéro doit contenir exactement 8 chiffres";
    if (!tunisianPattern.test(number)) return "Numéro invalide";
    return "";
  };

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const limited = cleaned.slice(0, 8);
    
    if (limited.length <= 2) return limited;
    if (limited.length <= 5) return `${limited.slice(0, 2)} ${limited.slice(2)}`;
    return `${limited.slice(0, 2)} ${limited.slice(2, 5)} ${limited.slice(5)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        name: 'telephoneProfessionnel',
        value: formatted
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onChange(syntheticEvent);
    const error = validateTunisianPhone(formatted);
    setPhoneError(error);
  };

  const generateHorairesString = (horaireData: typeof horaires) => {
    const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    const joursAbrev: Record<string, string> = {
      lundi: 'Lun', mardi: 'Mar', mercredi: 'Mer', jeudi: 'Jeu',
      vendredi: 'Ven', samedi: 'Sam', dimanche: 'Dim'
    };

    let result: string[] = [];
    let tempGroup: { jours: string[], horaire: string } | null = null;

    jours.forEach((jour) => {
      const h = horaireData[jour as keyof typeof horaires];
      const horaire = h.ferme 
        ? 'Fermé' 
        : `${h.debut.replace(':', 'h')}-${h.fin.replace(':', 'h')}`;

      if (tempGroup && tempGroup.horaire === horaire) {
        tempGroup.jours.push(joursAbrev[jour]);
      } else {
        if (tempGroup) {
          const joursStr = tempGroup.jours.length > 1 
            ? `${tempGroup.jours[0]}-${tempGroup.jours[tempGroup.jours.length - 1]}`
            : tempGroup.jours[0];
          result.push(`${joursStr}: ${tempGroup.horaire}`);
        }
        tempGroup = { jours: [joursAbrev[jour]], horaire };
      }
    });

    if (tempGroup) {
      const joursStr = tempGroup.jours.length > 1 
        ? `${tempGroup.jours[0]}-${tempGroup.jours[tempGroup.jours.length - 1]}`
        : tempGroup.jours[0];
      result.push(`${joursStr}: ${tempGroup.horaire}`);
    }

    return result.join(', ');
  };

  const handleHoraireChange = (jour: string, field: 'debut' | 'fin' | 'ferme', value: string | boolean) => {
    const newHoraires = {
      ...horaires,
      [jour]: {
        ...horaires[jour as keyof typeof horaires],
        [field]: value
      }
    };
    
    setHoraires(newHoraires);
    
    const horaireString = generateHorairesString(newHoraires);
    const syntheticEvent = {
      target: {
        name: 'horaires',
        value: horaireString
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onChange(syntheticEvent);
  };

  const joursAffiches = [
    { key: 'lundi', label: 'Lundi' },
    { key: 'mardi', label: 'Mardi' },
    { key: 'mercredi', label: 'Mercredi' },
    { key: 'jeudi', label: 'Jeudi' },
    { key: 'vendredi', label: 'Vendredi' },
    { key: 'samedi', label: 'Samedi' },
    { key: 'dimanche', label: 'Dimanche' }
  ];

  return (
    <div onSubmit={onSubmit} className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Modifier le Garage</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom du Garage <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="nom"
            value={garageData.nom || ''}
            onChange={onChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Garage Auto Plus"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Professionnel <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="emailProfessionnel"
            value={garageData.emailProfessionnel || ''}
            onChange={onChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Téléphone Professionnel <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="telephoneProfessionnel"
            value={garageData.telephoneProfessionnel || ''}
            onChange={handlePhoneChange}
            required
            maxLength={10}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 
              ${phoneError ? "border-red-500" : "border-gray-300"}
            `}
            placeholder="20 123 456"
          />
          {phoneError && <p className="text-red-500 text-sm mt-1">⚠️ {phoneError}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Matricule Fiscal
          </label>
          <input
            type="text"
            name="matriculeFiscal"
            value={garageData.matriculeFiscal || ''}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">Le matricule fiscal ne peut pas être modifié</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Gouvernorat</label>
          <input
            type="text"
            name="governorateName"
            value={garageData.governorateName || ''}
            onChange={onChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
          <input
            type="text"
            name="cityName"
            value={garageData.cityName || ''}
            onChange={onChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
          <input
            type="text"
            name="streetAddress"
            value={garageData.streetAddress || ''}
            onChange={onChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            name="description"
            value={garageData.description || ''}
            onChange={onChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Section Horaires (identique au formulaire de création) */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            Horaires d'ouverture
          </label>
          
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            {joursAffiches.map(({ key, label }) => {
              const h = horaires[key as keyof typeof horaires];
              return (
                <div key={key} className="flex items-center gap-4 bg-white p-3 rounded-lg">
                  <div className="w-24 font-medium text-gray-700">{label}</div>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={h.ferme}
                      onChange={(e) => handleHoraireChange(key, 'ferme', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-600">Fermé</span>
                  </label>

                  {!h.ferme && (
                    <>
                      <input
                        type="time"
                        value={h.debut}
                        onChange={(e) => handleHoraireChange(key, 'debut', e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                      />
                      <span>à</span>
                      <input
                        type="time"
                        value={h.fin}
                        onChange={(e) => handleHoraireChange(key, 'fin', e.target.value)}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {garageData.horaires && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Aperçu:</strong> {garageData.horaires}
              </p>
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Services (séparés par des virgules)
          </label>
          <input
            type="text"
            name="services"
            value={garageData.services || ''}
            onChange={onChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-4 pt-6 border-t">
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading || !!phoneError}
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Modification en cours...
            </>
          ) : (
            <>
              Enregistrer les modifications
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}