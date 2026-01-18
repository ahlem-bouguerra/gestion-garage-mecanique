"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, Shield, Key, Link } from 'lucide-react';
import axiosInstance from './axiosConfig';
import { AxiosError } from 'axios';
// ✅ Interfaces TypeScript
interface Role {
  _id: string;
  name: string;
  description?: string;
}

interface Permission {
  _id: string;
  name: string;
  description?: string;
}

interface RolePermission {
  _id: string;
  roleId?: Role;
  permissionId?: Permission;
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || 'Une erreur est survenue';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Une erreur inconnue est survenue';
};

export default function RolePermissionManager() {
   const [activeTab, setActiveTab] = useState('roles');
  
  // ✅ States typés
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(false);
  
  // États pour les modales
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  // États pour les formulaires
  const [roleForm, setRoleForm] = useState({ name: '', description: '' });
  const [permissionForm, setPermissionForm] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;

    if (showRoleModal || showPermissionModal || showAssignModal) {
      header.classList.add("hidden");
    } else {
      header.classList.remove("hidden");
    }
  }, [showRoleModal, showPermissionModal, showAssignModal]);

  // Chargement des données
  useEffect(() => {
    loadRoles();
    loadPermissions();
    loadRolePermissions();
  }, []);

  const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getAuthToken()}`
});

  const loadRoles = async () => {
    try {
      const { data } = await axiosInstance.get(`/getAllRoles`);
      setRoles(data);
    } catch (error) {
      alert('Erreur lors du chargement des rôles');
    }
  };


  const selectAllPermissions = () => {
  // Tu dois créer un tableau avec tous les IDs des permissions
  // permissions est ton tableau d'objets permissions
  // Chaque permission a un _id
  // Tu utilises .map() pour transformer le tableau d'objets en tableau d'IDs
  
  const allPermissionIds = permissions.map(perm => perm._id);
  setSelectedPermissions(allPermissionIds);
};

const deselectAllPermissions = () => {
  // Tu vides simplement le tableau selectedPermissions
  setSelectedPermissions([]);
};



  const loadPermissions = async () => {
    try {
      const { data } = await axiosInstance.get(`/getAllPermissions`);
      setPermissions(data);
    } catch (error) {
      alert('Erreur lors du chargement des permissions');
    }
  };

  const loadRolePermissions = async () => {
    try {
      const { data } = await axiosInstance.get(`/getAllRolePermissions`);
      setRolePermissions(data);
    } catch (error) {
      alert('Erreur lors du chargement des associations');
    }
  };


// CRUD Rôles
const handleSaveRole = async () => {
  if (!roleForm.name.trim()) {
    alert('Le nom du rôle est requis');
    return;
  }

  setLoading(true);
  try {
    const url = editingId 
      ? `/updateRole/${editingId}` 
      : `/creeRole`;
    
    // ✅ VERSION AXIOS
    const { data } = editingId
      ? await axiosInstance.put(url, roleForm)
      : await axiosInstance.post(url, roleForm);

    alert(data.message);
    loadRoles();
    setShowRoleModal(false);
    setRoleForm({ name: '', description: '' });
    setEditingId(null);
  } catch (error) {
    alert(getErrorMessage(error));
  }
  setLoading(false);
};

const handleDeleteRole = async (id: string) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce rôle ?')) return;

  try {
    // ✅ VERSION AXIOS
    const { data } = await axiosInstance.delete(`/deleteRole/${id}`);
    alert(data.message);
    loadRoles();
    loadRolePermissions();
  } catch (error) {
    alert(getErrorMessage(error));
  }
};

// CRUD Permissions
const handleSavePermission = async () => {
  if (!permissionForm.name.trim()) {
    alert('Le nom de la permission est requis');
    return;
  }

  setLoading(true);
  try {
    const url = editingId 
      ? `/updatePermission/${editingId}` 
      : `/creePermission`;
    
    // ✅ VERSION AXIOS
    const { data } = editingId
      ? await axiosInstance.put(url, permissionForm)
      : await axiosInstance.post(url, permissionForm);

    alert(data.message);
    loadPermissions();
    setShowPermissionModal(false);
    setPermissionForm({ name: '', description: '' });
    setEditingId(null);
  } catch (error) {
    alert(getErrorMessage(error));
  }
  setLoading(false);
};

const handleDeletePermission = async (id: string) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette permission ?')) return;

  try {
    // ✅ VERSION AXIOS
    const { data } = await axiosInstance.delete(`/deletePermission/${id}`);
    alert(data.message);
    loadPermissions();
    loadRolePermissions();
  } catch (error) {
    alert(getErrorMessage(error));
  }
};

// Gestion des associations
const handleAssignPermissions = async () => {
  if (!selectedRole) {
    alert('Veuillez sélectionner un rôle');
    return;
  }

  if (selectedPermissions.length === 0) {
    alert('Veuillez sélectionner au moins une permission');
    return;
  }

  setLoading(true);
  try {
    console.log('🔄 Début affectation des permissions...');
    
    // Supprimer les anciennes associations
    const existingAssociations = rolePermissions.filter(
      rp => rp.roleId && rp.roleId._id === selectedRole
    );
    
    for (const assoc of existingAssociations) {
      await axiosInstance.delete(`/deleteRolePermission/${assoc._id}`);
    }

    // Créer les nouvelles associations avec les DONNÉES
    for (const permId of selectedPermissions) {
      await axiosInstance.post('/creeRolePermission', {
        roleId: selectedRole,    // ✅ Données envoyées
        permissionId: permId     // ✅ Données envoyées
      });
    }

    alert('Permissions affectées avec succès');
    await loadRolePermissions();
    setShowAssignModal(false);
    setSelectedRole('');
    setSelectedPermissions([]);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    alert(getErrorMessage(error));
  } finally {
    setLoading(false);
  }
};
const openAssignModal = (roleId: string) => {
  setSelectedRole(roleId);
  const currentPermissions = rolePermissions
    .filter(rp => rp.roleId && rp.roleId._id === roleId && rp.permissionId)
    .map(rp => rp.permissionId!._id); // ✅ Le ! indique qu'on est sûr qu'il existe après le filter
  setSelectedPermissions(currentPermissions);
  setShowAssignModal(true);
};

const togglePermission = (permId: string) => {
  setSelectedPermissions(prev => 
    prev.includes(permId) 
      ? prev.filter(id => id !== permId)
      : [...prev, permId]
  );
};

  const getRolePermissions = (roleId:string) => {
    return rolePermissions
      .filter(rp => rp.roleId && rp.roleId._id === roleId)
      .map(rp => rp.permissionId?.name || 'Permission supprimée')
      .filter(Boolean);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <Shield className="w-10 h-10" />
            Gestion des Rôles & Permissions
          </h1>
          <p className="text-gray-600">Contrôlez les accès et les autorisations de votre système</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'roles', label: 'Rôles', icon: Shield },
            { id: 'permissions', label: 'Permissions', icon: Key },
            { id: 'associations', label: 'Associations', icon: Link }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenu des tabs */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          {/* Tab Rôles */}
          {activeTab === 'roles' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Liste des Rôles</h2>
                <button
                  onClick={() => {
                    setRoleForm({ name: '', description: '' });
                    setEditingId(null);
                    setShowRoleModal(true);
                  }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Nouveau Rôle
                </button>
              </div>

              <div className="grid gap-4">
                {roles.map(role => (
                  <div key={role._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-gray-100 transition-all">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-800 mb-1">{role.name}</h3>
                        <p className="text-gray-600 text-sm mb-2">{role.description || 'Aucune description'}</p>
                      
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setRoleForm({ name: role.name, description: role.description || '' });
                            setEditingId(role._id);
                            setShowRoleModal(true);
                          }}
                          className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRole(role._id)}
                          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab Permissions */}
          {activeTab === 'permissions' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Liste des Permissions</h2>
                <button
                  onClick={() => {
                    setPermissionForm({ name: '', description: '' });
                    setEditingId(null);
                    setShowPermissionModal(true);
                  }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Nouvelle Permission
                </button>
              </div>

              <div className="grid gap-4">
                {permissions.map(perm => (
                  <div key={perm._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-gray-100 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-1">{perm.name}</h3>
                        <p className="text-gray-600 text-sm">{perm.description || 'Aucune description'}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setPermissionForm({ name: perm.name, description: perm.description || '' });
                            setEditingId(perm._id);
                            setShowPermissionModal(true);
                          }}
                          className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePermission(perm._id)}
                          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab Associations */}
          {activeTab === 'associations' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Vue d'ensemble des Associations</h2>
              
              <div className="grid gap-4">
                {roles.map(role => {
                  const perms = getRolePermissions(role._id);
                  return (
                    <div key={role._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-semibold text-gray-800">{role.name}</h3>
                        <button
                          onClick={() => openAssignModal(role._id)}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                          Modifier
                        </button>
                      </div>
                      {perms.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {perms.map((perm, idx) => (
                            <span key={idx} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                              ✓ {perm}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">Aucune permission affectée</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Rôle */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              {editingId ? 'Modifier le Rôle' : 'Nouveau Rôle'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Nom du rôle *</label>
                <input
                  type="text"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white text-gray-800 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
                  placeholder="Ex: Admin, Mécanicien..."
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">Description</label>
                <textarea
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  className="w-full px-4 py-2 bg-white text-gray-800 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
                  rows={3}
                  placeholder="Description du rôle..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveRole}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <Check className="w-5 h-5" />
                {loading ? 'En cours...' : 'Enregistrer'}
              </button>
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setRoleForm({ name: '', description: '' });
                  setEditingId(null);
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Permission */}
      {showPermissionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              {editingId ? 'Modifier la Permission' : 'Nouvelle Permission'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Nom de la permission *</label>
                <input
                  type="text"
                  value={permissionForm.name}
                  onChange={(e) => setPermissionForm({ ...permissionForm, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white text-gray-800 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
                  placeholder="Ex: create_employee, view_reports..."
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2">Description</label>
                <textarea
                  value={permissionForm.description}
                  onChange={(e) => setPermissionForm({ ...permissionForm, description: e.target.value })}
                  className="w-full px-4 py-2 bg-white text-gray-800 rounded-lg border border-gray-300 focus:border-blue-500 focus:outline-none"
                  rows={3}
                  placeholder="Description de la permission..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSavePermission}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <Check className="w-5 h-5" />
                {loading ? 'En cours...' : 'Enregistrer'}
              </button>
              <button
                onClick={() => {
                  setShowPermissionModal(false);
                  setPermissionForm({ name: '', description: '' });
                  setEditingId(null);
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Affectation */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
         <div className="bg-white rounded-xl p-8 w-[95vw] h-[95vh] shadow-2xl overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Affecter des Permissions
            </h3>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Rôle sélectionné</label>
              <div className="bg-blue-100 text-gray-800 px-4 py-2 rounded-lg font-medium">
                {roles.find(r => r._id === selectedRole)?.name}
              </div>
            </div>

            <div className="mb-6">
  <label className="block text-gray-700 mb-3">Sélectionnez les permissions</label>
  <div className="flex gap-2 mb-3">
  <button
    onClick={selectAllPermissions}
    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
  >
    ✓ Tout sélectionner
  </button>
  <button
    onClick={deselectAllPermissions}
    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
  >
    ✗ Tout désélectionner
  </button>
</div>
  <div className="grid grid-cols-5 gap-x-4 gap-y-2">
    {permissions.map(perm => (
      <label
        key={perm._id}
        className="flex items-start gap-2 cursor-pointer hover:text-blue-600 transition-colors"
      >
        <input
          type="checkbox"
          checked={selectedPermissions.includes(perm._id)}
          onChange={() => togglePermission(perm._id)}
          className="mt-1 w-4 h-4 text-blue-600"
        />
        <span className="text-sm text-gray-800">• {perm.name}</span>
      </label>
    ))}
  </div>
</div>

            <div className="flex gap-3">
              <button
                onClick={handleAssignPermissions}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <Check className="w-5 h-5" />
                {loading ? 'En cours...' : 'Affecter'}
              </button>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedRole('');
                  setSelectedPermissions([]);
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
