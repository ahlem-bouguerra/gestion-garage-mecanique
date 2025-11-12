import { GaragisteRole } from "../models/GaragisteRole.js";
import { Role } from "../models/Role.js";

/**
 * Récupère tous les rôles d'un garagiste
 * @param {ObjectId} garagisteId 
 * @returns {Array} Liste des objets Role
 */
export const getGaragisteRoles = async (garagisteId) => {
  const garagisteRoles = await GaragisteRole.find({ garagisteId })
    .populate('roleId');
  
  return garagisteRoles.map(gr => gr.roleId);
};

/**
 * Vérifie si un garagiste a un rôle spécifique
 * @param {ObjectId} garagisteId 
 * @param {String} roleName 
 * @returns {Boolean}
 */
export const hasRole = async (garagisteId, roleName) => {
  const roles = await getGaragisteRoles(garagisteId);
  return roles.some(role => role.name === roleName);
};

/**
 * Vérifie si un garagiste est admin de son garage
 * @param {ObjectId} garagisteId 
 * @returns {Boolean}
 */
export const isGarageAdmin = async (garagisteId) => {
  return await hasRole(garagisteId, "Admin Garage");
};