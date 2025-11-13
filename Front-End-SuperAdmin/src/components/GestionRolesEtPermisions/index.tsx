"use client";
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, Shield, Key, Link } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api'; // Adaptez selon votre configuration

export default function RolePermissionManager() {
  const [activeTab, setActiveTab] = useState('roles');
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // États pour les modales
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  // États pour les formulaires
  const [roleForm, setRoleForm] = useState({ name: '', description: '' });
  const [permissionForm, setPermissionForm] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  // Chargement des données
  useEffect(() => {
    loadRoles();
    loadPermissions();
    loadRolePermissions();
  }, []);

  const loadRoles = async () => {
    try {
      const res = await fetch(`${API_BASE}/getAllRoles`);
      const data = await res.json();
      setRoles(data);
    } catch (error) {
      alert('Erreur lors du chargement des rôles');
    }
  };

  const loadPermissions = async () => {
    try {
      const res = await fetch(`${API_BASE}/getAllPermissions`);
      const data = await res.json();
      setPermissions(data);
    } catch (error) {
      alert('Erreur lors du chargement des permissions');
    }
  };

  const loadRolePermissions = async () => {
    try {
      const res = await fetch(`${API_BASE}/getAllRolePermissions`);
      const data = await res.json();
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
        ? `${API_BASE}/updateRole/${editingId}` 
        : `${API_BASE}/creeRole`;
      
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleForm)
      });

      const data = await res.json();
      
      if (res.ok) {
        alert(data.message);
        loadRoles();
        setShowRoleModal(false);
        setRoleForm({ name: '', description: '' });
        setEditingId(null);
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Erreur lors de la sauvegarde');
    }
    setLoading(false);
  };

  const handleDeleteRole = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rôle ?')) return;

    try {
      const res = await fetch(`${API_BASE}/deleteRole/${id}`, { method: 'DELETE' });
      const data = await res.json();
      alert(data.message);
      loadRoles();
      loadRolePermissions();
    } catch (error) {
      alert('Erreur lors de la suppression');
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
        ? `${API_BASE}/updatePermission/${editingId}` 
        : `${API_BASE}/creePermission`;
      
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permissionForm)
      });

      const data = await res.json();
      
      if (res.ok) {
        alert(data.message);
        loadPermissions();
        setShowPermissionModal(false);
        setPermissionForm({ name: '', description: '' });
        setEditingId(null);
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Erreur lors de la sauvegarde');
    }
    setLoading(false);
  };

  const handleDeletePermission = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette permission ?')) return;

    try {
      const res = await fetch(`${API_BASE}/deletePermission/${id}`, { method: 'DELETE' });
      const data = await res.json();
      alert(data.message);
      loadPermissions();
      loadRolePermissions();
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  };

  // Gestion des associations
  const handleAssignPermissions = async () => {
    if (!selectedRole) {
      alert('Veuillez sélectionner un rôle');
      return;
    }

    setLoading(true);
    try {
      // Supprimer les anciennes associations pour ce rôle
      const existingAssociations = rolePermissions.filter(
        rp => rp.roleId && rp.roleId._id === selectedRole
      );
      for (const assoc of existingAssociations) {
        await fetch(`${API_BASE}/deleteRolePermission/${assoc._id}`, { method: 'DELETE' });
      }

      // Créer les nouvelles associations
      for (const permId of selectedPermissions) {
        await fetch(`${API_BASE}/creeRolePermission`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roleId: selectedRole, permissionId: permId })
        });
      }

      alert('Permissions affectées avec succès');
      loadRolePermissions();
      setShowAssignModal(false);
      setSelectedRole('');
      setSelectedPermissions([]);
    } catch (error) {
      alert('Erreur lors de l\'affectation');
    }
    setLoading(false);
  };

  const openAssignModal = (roleId) => {
    setSelectedRole(roleId);
    const currentPermissions = rolePermissions
      .filter(rp => rp.roleId && rp.roleId._id === roleId && rp.permissionId)
      .map(rp => rp.permissionId._id);
    setSelectedPermissions(currentPermissions);
    setShowAssignModal(true);
  };

  const togglePermission = (permId) => {
    setSelectedPermissions(prev => 
      prev.includes(permId) 
        ? prev.filter(id => id !== permId)
        : [...prev, permId]
    );
  };

  const getRolePermissions = (roleId) => {
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
                        <div className="flex flex-wrap gap-2">
                          {getRolePermissions(role._id).map((perm, idx) => (
                            <span key={idx} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs">
                              {perm}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openAssignModal(role._id)}
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          title="Affecter permissions"
                        >
                          <Link className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setRoleForm({ name: role.name, description: role.description });
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
                            setPermissionForm({ name: perm.name, description: perm.description });
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
                  rows="3"
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
                  rows="3"
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
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Affecter des Permissions
            </h3>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Rôle sélectionné</label>
              <div className="bg-blue-100 text-gray-800 px-4 py-2 rounded-lg font-medium">
                {roles.find(r => r._id === selectedRole)?.name}
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <label className="block text-gray-700 mb-3">Sélectionnez les permissions</label>
              {permissions.map(perm => (
                <label
                  key={perm._id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(perm._id)}
                    onChange={() => togglePermission(perm._id)}
                    className="w-5 h-5 text-blue-600"
                  />
                  <div>
                    <div className="text-gray-800 font-medium">{perm.name}</div>
                    <div className="text-gray-600 text-sm">{perm.description}</div>
                  </div>
                </label>
              ))}
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