import mongoose from 'mongoose';
import { Permission } from '../models/Permission.js';
import { Role } from '../models/Role.js';
import { RolePermission } from '../models/RolePermission.js';
import dotenv from 'dotenv';

dotenv.config();

async function seedRolePermissions() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📦 Connexion MongoDB établie');

    // Récupérer tous les rôles et permissions
    const roles = await Role.find({});
    const permissions = await Permission.find({});

    if (roles.length === 0 || permissions.length === 0) {
      console.log('⚠️ Assurez-vous d\'avoir exécuté les seeders de roles et permissions d\'abord');
      process.exit(1);
    }

    // Créer des maps pour faciliter l'accès
    const rolesMap = {};
    roles.forEach(role => {
      rolesMap[role.name] = role._id;
    });

    const permissionsMap = {};
    permissions.forEach(perm => {
      permissionsMap[perm.name] = perm._id;
    });

    // Définir les associations role-permissions
    const rolePermissionsConfig = {
      'Super Admin': [
        // Accès complet à tout
        ...permissions.map(p => p.name)
      ],

      'Admin Garage': [
        
        
        // Clients
        'create_client',
        'view_client',
        'update_client',
        'delete_client',
        'view_client_historique',
        
        // Véhicules
        'view_vehicule',
        'create_vehicule',
        'update_vehicule',
        'dissocier_vehicule',
        'view_carnet',
        'create_carnet',
        
        // Devis
        'view_devis',
        'create_devis',
        'update_devis',
        'delete_devis',
        'accept_devis',
        'refuse_devis',
        
        // Factures
        'view_facture',
        'create_facture',
        'delete_facture',
        'mark_facture_paid',
        'create_credit_note',
        'view_credit_note',
        
        // Mécaniciens
        'view_mecanicien',
        'create_mecanicien',
        'update_mecanicien',
        'delete_mecanicien',
        
        // Ateliers
        'view_atelier',
        'create_atelier',
        'update_atelier',
        'delete_atelier',
        
        // Services
        'view_service',
        'create_service',
        'update_service',
        'delete_service',
        
        // Ordres de travail
        'create_ordre',
        'get_ordres',
        'update_ordre',
        'demarrer_ordre',
        'terminer_ordre',
        'delete_ordre',
        
        // Réservations
        'view_reservation',
        'create_reservation',
        'update_reservation',
        'delete_reservation',
      ],

      'Employé Garage': [
        // Clients
        'create_client',
        'view_client',
        'update_client',
        'view_client_historique',
        
        // Véhicules
        'view_vehicule',
        'create_vehicule',
        'update_vehicule',
        'view_carnet',
        
        // Devis
        'view_devis',
        'create_devis',
        'update_devis',
        
        // Factures
        'view_facture',
        'create_facture',
        'view_credit_note',
        
        // Mécaniciens (lecture seule)
        'view_mecanicien',
        
        // Ateliers (lecture seule)
        'view_atelier',
        
        // Services (lecture seule)
        'view_service',
        
        // Ordres de travail
        'create_ordre',
        'get_ordres',
        'update_ordre',
        
        // Réservations
        'view_reservation',
        'update_reservation',
      ],

      'Mécanicien': [
        // Clients (lecture seule)
        'view_client',
        
        // Véhicules
        'view_vehicule',
        'view_carnet',
        'create_carnet',
        
        // Ordres de travail
        'get_ordres',
        'demarrer_ordre',
        'terminer_ordre',
        
        // Ateliers (lecture seule)
        'view_atelier',
        
        // Services (lecture seule)
        'view_service',
      ],
    };

    // Supprimer les associations existantes (optionnel)
    await RolePermission.deleteMany({});
    console.log('🗑️ Anciennes associations supprimées');

    // Créer les nouvelles associations
    console.log('\n📝 Création des associations role-permissions...');
    let count = 0;

    for (const [roleName, permissionNames] of Object.entries(rolePermissionsConfig)) {
      const roleId = rolesMap[roleName];
      
      if (!roleId) {
        console.log(`⚠️ Rôle "${roleName}" non trouvé`);
        continue;
      }

      console.log(`\n🔹 ${roleName}:`);

      for (const permName of permissionNames) {
        const permissionId = permissionsMap[permName];
        
        if (!permissionId) {
          console.log(`  ⚠️ Permission "${permName}" non trouvée`);
          continue;
        }

        await RolePermission.findOneAndUpdate(
          { roleId, permissionId },
          { roleId, permissionId },
          { upsert: true, new: true }
        );
        
        count++;
      }
      
      console.log(`  ✅ ${permissionNames.length} permissions associées`);
    }

    console.log(`\n✅ Seed terminé avec succès ! ${count} associations créées`);
    
    // Afficher un résumé
    console.log('\n📊 Résumé:');
    for (const role of roles) {
      const permCount = await RolePermission.countDocuments({ roleId: role._id });
      console.log(`  ${role.name}: ${permCount} permissions`);
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

seedRolePermissions();