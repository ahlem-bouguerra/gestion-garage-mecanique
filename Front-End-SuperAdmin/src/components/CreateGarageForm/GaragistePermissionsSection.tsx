// components/garage/GaragistePermissionsSection.tsx
"use client";

import { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Loader2 } from 'lucide-react';
import {
  getAllPermissions,
  getAllRolePermissions,
  getGaragistePermissions,
  addGaragistePermission,
  removeGaragistePermission
} from './api';

interface GaragistePermissionsSectionProps {
  garagiste: any;
}

export default function GaragistePermissionsSection({ garagiste }: GaragistePermissionsSectionProps) {
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  const [rolePermissions, setRolePermissions] = useState<any[]>([]);
  const [individualPermissions, setIndividualPermissions] = useState<any[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (garagiste) {
      loadData();
    }
  }, [garagiste]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadAllPermissions(),
        loadRolePermissions(),
        loadIndividualPermissions()
      ]);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllPermissions = async () => {
    try {
      const data = await getAllPermissions();
      setAllPermissions(data);
    } catch (error) {
      console.error('Erreur chargement permissions:', error);
    }
  };

  const loadRolePermissions = async () => {
    if (!garagiste.roles?.[0]?._id) return;
    
    try {
      const data = await getAllRolePermissions();
      const rolePerms = data
        .filter((rp: any) => rp.roleId?._id === garagiste.roles[0]._id)
        .map((rp: any) => rp.permissionId)
        .filter(Boolean);
      setRolePermissions(rolePerms);
    } catch (error) {
      console.error('Erreur chargement permissions du rôle:', error);
    }
  };

useEffect(() => {
  console.log('🎯 Garagiste reçu dans PermissionsSection:', garagiste);
  console.log('🆔 ID du garagiste:', garagiste?.id);
  
  if (garagiste && garagiste.id) {
    loadData();
  } else {
    console.error('❌ Garagiste invalide ou sans ID');
  }
}, [garagiste]);

const loadIndividualPermissions = async () => {
  try {
    console.log('🔍 Chargement permissions pour ID:', garagiste.id);
    const data = await getGaragistePermissions(garagiste.id);
    console.log('✅ Permissions chargées:', data);
    setIndividualPermissions(data);
  } catch (error) {
    console.error('❌ Erreur chargement permissions individuelles:', error);
  }
};
  const handleAddMultiplePermissions = async () => {
    if (selectedPermissions.length === 0) {
      alert('Veuillez sélectionner au moins une permission');
      return;
    }

    try {
      // Ajouter toutes les permissions sélectionnées
      await Promise.all(
        selectedPermissions.map(permId => 
          addGaragistePermission(garagiste.id, permId)
        )
      );
      
      alert(`${selectedPermissions.length} permission(s) ajoutée(s) avec succès`);
      await loadIndividualPermissions();
      setShowPermissionModal(false);
      setSelectedPermissions([]);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleSelectAll = () => {
    setSelectedPermissions(availablePermissions.map(p => p._id));
  };

  const handleDeselectAll = () => {
    setSelectedPermissions([]);
  };

  const handleTogglePermission = (permId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permId) 
        ? prev.filter(id => id !== permId)
        : [...prev, permId]
    );
  };

  const handleRemovePermission = async (permId: string) => {
    if (!confirm('Retirer cette permission individuelle ?')) return;

    try {
      await removeGaragistePermission(permId);
      alert('Permission retirée');
      await loadIndividualPermissions();
    } catch (error: any) {
      alert(error.message);
    }
  };

  // Filtrer les permissions disponibles
  const availablePermissions = allPermissions.filter(perm => {
    const hasFromRole = rolePermissions.some(rp => rp._id === perm._id);
    const hasIndividual = individualPermissions.some(
      (ip: any) => ip.permissionId?._id === perm._id
    );
    return !hasFromRole && !hasIndividual;
  });

  if (loading) {
    return (
      <div className="border-t pt-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="border-t pt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Shield className="w-6 h-6 text-purple-600" />
          Permissions
        </h3>
        <button
          onClick={() => setShowPermissionModal(true)}
          disabled={availablePermissions.length === 0}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter Permission
        </button>
      </div>

      {/* Permissions du rôle */}
      {rolePermissions.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Permissions du rôle ({garagiste.roles?.[0]?.name})
          </h4>
          <div className="flex flex-wrap gap-2">
            {rolePermissions.map(perm => (
              <span
                key={perm._id}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
              >
                {perm.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Permissions individuelles */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          Permissions individuelles
        </h4>
        {individualPermissions.length > 0 ? (
          <div className="space-y-2">
            {individualPermissions.map((ip: any) => (
              <div
                key={ip._id}
                className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3"
              >
                <div>
                  <p className="font-medium text-gray-900">{ip.permissionId?.name}</p>
                  {ip.permissionId?.description && (
                    <p className="text-sm text-gray-600">{ip.permissionId.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleRemovePermission(ip._id)}
                  className="text-red-600 hover:text-red-700 p-2 transition-colors"
                  title="Retirer cette permission"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic text-sm">
            Aucune permission individuelle ajoutée
          </p>
        )}
      </div>

      {/* Modal d'ajout de permission */}
      {showPermissionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl p-6 max-w-3xl w-full shadow-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Ajouter des permissions individuelles
            </h3>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-gray-700 font-medium">
                  Sélectionner les permissions ({selectedPermissions.length} sélectionnée(s))
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                    type="button"
                  >
                    Tout sélectionner
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={handleDeselectAll}
                    className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                    type="button"
                  >
                    Tout désélectionner
                  </button>
                </div>
              </div>
              
              {availablePermissions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto p-2">
                  {availablePermissions.map(perm => (
                    <label
                      key={perm._id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm._id)}
                        onChange={() => handleTogglePermission(perm._id)}
                        className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{perm.name}</div>
                        {perm.description && (
                          <div className="text-sm text-gray-600 mt-1">{perm.description}</div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                  Toutes les permissions sont déjà attribuées
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={handleAddMultiplePermissions}
                disabled={selectedPermissions.length === 0}
                className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Ajouter {selectedPermissions.length > 0 && `(${selectedPermissions.length})`}
              </button>
              <button
                onClick={() => {
                  setShowPermissionModal(false);
                  setSelectedPermissions([]);
                }}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}