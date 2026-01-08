// components/garage/GaragisteForm.tsx
import { User, Loader2 } from 'lucide-react';

interface GaragisteFormProps {
  garagisteData: any;
  roles: any[];
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack?: () => void;
  loading: boolean;
  showBackButton?: boolean;
  successMessage?: string;
}

export default function GaragisteForm({
  garagisteData,
  roles,
  onChange,
  onSubmit,
  onBack,

  loading,
  showBackButton = false,
  successMessage
}: GaragisteFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-800 text-sm">✓ {successMessage}</p>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <User className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Informations du Garagiste</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom d'utilisateur <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="username"
            value={garagisteData.username}
            onChange={onChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ahmed Ben Ali"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={garagisteData.email}
            onChange={onChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="ahmed@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mot de passe <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            name="password"
            value={garagisteData.password}
            onChange={onChange}
            required
            minLength={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Téléphone <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={garagisteData.phone}
            onChange={onChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="+216 20 123 456"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rôle <span className="text-red-500">*</span>
          </label>
          <select
            name="roleId"
            value={garagisteData.roleId}
            onChange={onChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Sélectionner un rôle</option>
            {roles.map(role => (
              <option key={role._id} value={role._id}>
                {role.name}
              </option>
            ))}
          </select>
          <p className="mt-2 text-sm text-gray-500">
            Le rôle "Admin Garage" est recommandé pour le propriétaire du garage
          </p>
        </div>
      </div>

      <div className="flex gap-4 pt-6 border-t">
        {showBackButton && onBack && (
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Retour
          </button>
        )}
        
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
            'Créer le Garagiste'
          )}
        </button>

    
      </div>
    </form>
  );
}