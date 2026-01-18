import mongoose from 'mongoose';
import { Permission } from '../models/Permission.js';
import dotenv from 'dotenv';

dotenv.config();

const permissions = [
  // ========== PERMISSIONS SUPER ADMIN ==========
  { name: 'Gérer_role', description: 'Gérer les rôles' },
  { name: 'Gérer_permission', description: 'Gérer les permissions' },
  { name: 'Gérer_Associer_role_permissions', description: 'Gérer association des permissions à un rôle' },
  { name: 'Gérer_Garage', description: 'Gérer un garage' },
  { name: 'Gérer_SuperAdmin', description: 'Gérer les super admins' },

  // ========== PERMISSIONS CLIENT (FICHE CLIENT) ==========
  { name: 'create_client', description: 'Créer une fiche client' },
  { name: 'view_client', description: 'Voir les détails d\'un client' },
  { name: 'update_client', description: 'Modifier une fiche client existante' },
  { name: 'delete_client', description: 'Supprimer une fiche client' },
  { name: 'view_client_historique', description: 'Voir l\'historique des visites d\'un client' },

  // ========== PERMISSIONS VÉHICULE ==========
  { name: 'view_vehicule', description: 'Voir les détails d\'un véhicule' },
  { name: 'create_vehicule', description: 'Créer un nouveau véhicule pour un client' },
  { name: 'update_vehicule', description: 'Modifier les informations d\'un véhicule existant' },
  { name: 'dissocier_vehicule', description: 'Dissocier un véhicule d\'un client' },
  { name: 'client_delete_vehicule', description: 'Supprimer un véhicule (client)' },

  // ========== PERMISSIONS CARNET D'ENTRETIEN ==========
  { name: 'view_carnet', description: 'Voir le carnet d\'entretien d\'un véhicule' },
  { name: 'create_carnet', description: 'Créer une entrée dans le carnet d\'entretien manuel' },

  // ========== PERMISSIONS DEVIS ==========
  { name: 'view_devis', description: 'Voir les devis' },
  { name: 'create_devis', description: 'Créer des devis' },
  { name: 'update_devis', description: 'Modifier des devis' },
  { name: 'delete_devis', description: 'Supprimer des devis' },
  { name: 'accept_devis', description: 'Accepter un devis' },
  { name: 'refuse_devis', description: 'Refuser un devis' },

  // ========== PERMISSIONS FACTURES ==========
  { name: 'view_facture', description: 'Voir les factures' },
  { name: 'create_facture', description: 'Créer des factures' },
  { name: 'update_facture', description: 'Modifier des factures' },
  { name: 'delete_facture', description: 'Supprimer des factures' },
  { name: 'mark_facture_paid', description: 'Marquer une facture comme payée' },
  
  // ========== PERMISSIONS AVOIRS (CREDIT NOTES) ==========
  { name: 'create_credit_note', description: 'Créer des avoirs' },
  { name: 'view_credit_note', description: 'Voir des avoirs' },

  // ========== PERMISSIONS MÉCANICIEN ==========
  { name: 'view_mecanicien', description: 'Voir les mécaniciens' },
  { name: 'create_mecanicien', description: 'Créer des mécaniciens' },
  { name: 'update_mecanicien', description: 'Modifier des mécaniciens' },
  { name: 'delete_mecanicien', description: 'Supprimer des mécaniciens' },

  // ========== PERMISSIONS ATELIER ==========
  { name: 'view_atelier', description: 'Voir les ateliers' },
  { name: 'create_atelier', description: 'Créer des ateliers' },
  { name: 'update_atelier', description: 'Modifier des ateliers' },
  { name: 'delete_atelier', description: 'Supprimer des ateliers' },

  // ========== PERMISSIONS SERVICE ==========
  { name: 'view_service', description: 'Voir les services' },
  { name: 'create_service', description: 'Créer des services' },
  { name: 'update_service', description: 'Modifier des services' },
  { name: 'delete_service', description: 'Supprimer des services' },

  // ========== PERMISSIONS ORDRE DE TRAVAIL ==========
  { name: 'create_ordre', description: 'Créer un ordre de travail' },
  { name: 'get_ordres', description: 'Voir les détails d\'un ordre' },
  { name: 'update_ordre', description: 'Modifier un ordre de travail existant' },
  { name: 'demarrer_ordre', description: 'Démarrer un ordre de travail' },
  { name: 'terminer_ordre', description: 'Terminer un ordre de travail' },
  { name: 'delete_ordre', description: 'Supprimer (soft delete) un ordre de travail' },

  // ========== PERMISSIONS RÉSERVATION ==========
  { name: 'view_reservation', description: 'Voir les réservations' },
  { name: 'create_reservation', description: 'Créer des réservations' },
  { name: 'update_reservation', description: 'Modifier des réservations' },
  { name: 'delete_reservation', description: 'Supprimer des réservations' },
  { name: 'client_create_reservation', description: 'Créer une réservation (client)' },
  { name: 'client_view_reservation', description: 'Voir les réservations (client)' },
  { name: 'client_update_reservation', description: 'Modifier une réservation (client)' },
  { name: 'client_cancel_reservation', description: 'Annuler une réservation (client)' },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📦 Connexion MongoDB établie');

    console.log('📝 Création des permissions...');
    const permissionsMap = {};
    
    for (const perm of permissions) {
      const created = await Permission.findOneAndUpdate(
        { name: perm.name },
        perm,
        { upsert: true, new: true }
      );
      permissionsMap[perm.name] = created._id;
      console.log(`  ✅ ${perm.name} - ${perm.description}`);
    }

    console.log(`\n✅ ${Object.keys(permissionsMap).length} permissions créées avec succès !`);
    console.log('\n📊 Récapitulatif des catégories :');
    console.log('   - Super Admin: 5 permissions');
    console.log('   - Clients: 5 permissions');
    console.log('   - Véhicules: 5 permissions');
    console.log('   - Carnet d\'entretien: 2 permissions');
    console.log('   - Devis: 6 permissions');
    console.log('   - Factures: 5 permissions');
    console.log('   - Avoirs: 2 permissions');
    console.log('   - Mécaniciens: 4 permissions');
    console.log('   - Ateliers: 4 permissions');
    console.log('   - Services: 4 permissions');
    console.log('   - Ordres de travail: 6 permissions');
    console.log('   - Réservations: 8 permissions');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

seed();