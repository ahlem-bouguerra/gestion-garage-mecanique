"use client";
import React, { useState, useEffect } from 'react';
import { UserCheck, UserX, Users } from 'lucide-react';
import axios from 'axios';

interface ApiError {
  message?: string;
}

interface User {
  _id?: string;
  id?: string;
  username: string;
  email: string;
  name?: string;
  isSuperAdmin: boolean;
  createdAt?: string;
}

function SuperAdminTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resultsPerPage = 10;

  // Configuration axios avec le token
  const axiosInstance = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  // Récupérer tous les utilisateurs
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get('/getAllUsers');
      setUsers(response.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError((err.response?.data as ApiError)?.message || 'Erreur lors du chargement des utilisateurs');
      } else {
        setError('Erreur lors du chargement des utilisateurs');
      }
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  // Promouvoir un utilisateur en SuperAdmin
  const promoteToSuperAdmin = async (userId: string) => {
    try {
      await axiosInstance.patch(`/users/${userId}/promote`);
      await fetchUsers();
      alert('Utilisateur promu avec succès !');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        alert('Erreur: ' + ((err.response?.data as ApiError)?.message || err.message));
      } else {
        alert('Erreur lors de la promotion de l\'utilisateur');
      }
    }
  };

  // Rétrograder un SuperAdmin
  const demoteSuperAdmin = async (userId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir rétrograder cet utilisateur ?')) {
      return;
    }

    try {
      await axiosInstance.patch(`/users/${userId}/demote`);
      await fetchUsers();
      alert('Utilisateur rétrogradé avec succès !');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        alert('Erreur: ' + ((err.response?.data as ApiError)?.message || err.message));
      } else {
        alert('Erreur lors de la rétrogradation de l\'utilisateur');
      }
    }
  };

  // Pagination
  const totalPages = Math.ceil(users.length / resultsPerPage);
  const paginatedUsers = users.slice((page - 1) * resultsPerPage, page * resultsPerPage);

  return (
    <div className="min-h-screen p-3">
      <div className="w-full">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-lg mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8" />
            Gestion des SuperAdmins
          </h1>
          <p className="text-blue-100 mt-2">Gérez les permissions des utilisateurs</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-2 text-gray-600">Chargement...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Utilisateur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date d'inscription
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                          Aucun utilisateur trouvé
                        </td>
                      </tr>
                    ) : (
                      paginatedUsers.map((user) => (
                        <tr key={user._id || user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                                  {user.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.username || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {user.isSuperAdmin ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Activé
                              </span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                Désactivé
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => promoteToSuperAdmin(user._id || user.id || '')}
                                disabled={user.isSuperAdmin}
                                className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md transition-colors ${
                                  user.isSuperAdmin
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                                }`}
                                title={user.isSuperAdmin ? 'Déjà activé' : 'Activer SuperAdmin'}
                              >
                                <UserCheck className="w-4 h-4 mr-1" />
                                Activer
                              </button>
                              <button
                                onClick={() => demoteSuperAdmin(user._id || user.id || '')}
                                disabled={!user.isSuperAdmin}
                                className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md transition-colors ${
                                  !user.isSuperAdmin
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                                }`}
                                title={!user.isSuperAdmin ? 'Déjà désactivé' : 'Désactiver SuperAdmin'}
                              >
                                <UserX className="w-4 h-4 mr-1" />
                                Désactiver
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Précédent
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Suivant
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Affichage de <span className="font-medium">{(page - 1) * resultsPerPage + 1}</span> à{' '}
                        <span className="font-medium">{Math.min(page * resultsPerPage, users.length)}</span> sur{' '}
                        <span className="font-medium">{users.length}</span> résultats
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Précédent
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setPage(i + 1)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === i + 1
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                        <button
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Suivant
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SuperAdminTable;
