import mongoose from 'mongoose';
import { Permission } from '../models/Permission.js';
import { Role } from '../models/Role.js';
import { RolePermission } from '../models/RolePermission.js';
import dotenv from 'dotenv';

dotenv.config();

const permissions = [
  // Factures
  { name: 'view_facture', description: 'Voir les factures' },
  { name: 'create_facture', description: 'Créer des factures' },
  { name: 'update_facture', description: 'Modifier des factures' },
  { name: 'delete_facture', description: 'Supprimer des factures' },
  { name: 'mark_facture_paid', description: 'Marquer une facture comme payée' },
  { name: 'view_facture_stats', description: 'Voir les statistiques des factures' },
  { name: 'create_credit_note', description: 'Créer des avoirs' },
  
  // Super Admin
  { name: 'super_admin', description: 'Accès complet à tout' }
];

const roles = [
  { 
    name: 'Admin Garage', 
    description: 'Administrateur avec tous les droits',
    permissions: ['super_admin'] // ⭐ A TOUS les droits
  },
  { 
    name: 'Employé Garage', 
    description: 'Peut voir et créer des factures',
    permissions: ['view_facture', 'create_facture'] // ⭐ Droits limités
  },
  { 
    name: 'Mécanicien', 
    description: 'Peut seulement voir les factures',
    permissions: ['view_facture'] // ⭐ Lecture seule
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📦 Connexion MongoDB établie');

    // 1️⃣ Créer les permissions
    console.log('📝 Création des permissions...');
    const permissionsMap = {};
    
    for (const perm of permissions) {
      const created = await Permission.findOneAndUpdate(
        { name: perm.name },
        perm,
        { upsert: true, new: true }
      );
      permissionsMap[perm.name] = created._id;
      console.log(`  ✅ ${perm.name}`);
    }

    // 2️⃣ Créer les rôles
    console.log('\n👥 Création des rôles...');
    
    for (const roleData of roles) {
      const role = await Role.findOneAndUpdate(
        { name: roleData.name },
        { name: roleData.name, description: roleData.description },
        { upsert: true, new: true }
      );
      
      console.log(`  ✅ ${roleData.name}`);

      // 3️⃣ Lier les permissions au rôle
      for (const permName of roleData.permissions) {
        const permId = permissionsMap[permName];
        
        if (permId) {
          await RolePermission.findOneAndUpdate(
            { roleId: role._id, permissionId: permId },
            { roleId: role._id, permissionId: permId },
            { upsert: true }
          );
          console.log(`    🔗 ${permName}`);
        }
      }
    }

    console.log('\n✅ Seed terminé avec succès !');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

seed();