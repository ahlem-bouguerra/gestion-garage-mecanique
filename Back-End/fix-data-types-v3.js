import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const fixDataTypes = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGO_URI non défini');
      process.exit(1);
    }

    console.log('🔗 Connexion à MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('📦 Connexion réussie\n');

    const db = mongoose.connection.db;

    // 1️⃣ Corriger GaragisteRole avec une requête native MongoDB
    console.log('🔧 Correction de GaragisteRole...');
    const garagisteRolesCollection = db.collection('garagisteroles');
    
    const garagisteRolesCursor = await garagisteRolesCollection.find({});
    const garagisteRoleDocs = await garagisteRolesCursor.toArray();
    
    console.log(`📊 ${garagisteRoleDocs.length} documents trouvés`);
    
    let grFixed = 0;
    for (const doc of garagisteRoleDocs) {
      const updates = {};
      
      // Vérifier et convertir garagisteId
      if (typeof doc.garagisteId === 'string') {
        try {
          updates.garagisteId = new mongoose.Types.ObjectId(doc.garagisteId);
          console.log(`  🔄 garagisteId String → ObjectId: ${doc.garagisteId}`);
        } catch (e) {
          console.error(`  ❌ Erreur conversion garagisteId: ${doc.garagisteId}`);
        }
      }
      
      // Vérifier et convertir roleId
      if (typeof doc.roleId === 'string') {
        try {
          updates.roleId = new mongoose.Types.ObjectId(doc.roleId);
          console.log(`  🔄 roleId String → ObjectId: ${doc.roleId}`);
        } catch (e) {
          console.error(`  ❌ Erreur conversion roleId: ${doc.roleId}`);
        }
      }
      
      if (Object.keys(updates).length > 0) {
        await garagisteRolesCollection.updateOne(
          { _id: doc._id },
          { $set: updates }
        );
        grFixed++;
        console.log(`  ✅ Document ${doc._id} corrigé`);
      }
    }
    
    console.log(`\n📈 GaragisteRoles corrigés: ${grFixed}/${garagisteRoleDocs.length}\n`);

    // 2️⃣ Corriger RolePermission
    console.log('🔧 Correction de RolePermission...');
    const rolePermissionsCollection = db.collection('rolepermissions');
    
    const rolePermissionsCursor = await rolePermissionsCollection.find({});
    const rolePermissionDocs = await rolePermissionsCursor.toArray();
    
    console.log(`📊 ${rolePermissionDocs.length} documents trouvés`);
    
    let rpFixed = 0;
    for (const doc of rolePermissionDocs) {
      const updates = {};
      
      // Vérifier et convertir roleId
      if (typeof doc.roleId === 'string') {
        try {
          updates.roleId = new mongoose.Types.ObjectId(doc.roleId);
          console.log(`  🔄 roleId String → ObjectId: ${doc.roleId}`);
        } catch (e) {
          console.error(`  ❌ Erreur conversion roleId: ${doc.roleId}`);
        }
      }
      
      // Vérifier et convertir permissionId
      if (typeof doc.permissionId === 'string') {
        try {
          updates.permissionId = new mongoose.Types.ObjectId(doc.permissionId);
          console.log(`  🔄 permissionId String → ObjectId: ${doc.permissionId}`);
        } catch (e) {
          console.error(`  ❌ Erreur conversion permissionId: ${doc.permissionId}`);
        }
      }
      
      if (Object.keys(updates).length > 0) {
        await rolePermissionsCollection.updateOne(
          { _id: doc._id },
          { $set: updates }
        );
        rpFixed++;
        console.log(`  ✅ Document ${doc._id} corrigé`);
      }
    }
    
    console.log(`\n📈 RolePermissions corrigés: ${rpFixed}/${rolePermissionDocs.length}\n`);

    // 3️⃣ Vérification finale
    console.log('🔍 Vérification finale...');
    
    const testGaragisteRole = await garagisteRolesCollection.findOne({
      _id: new mongoose.Types.ObjectId('69147725cb1b9aa1eaa81e43')
    });
    
    console.log('\n📋 Exemple GaragisteRole après correction:');
    console.log('  _id:', testGaragisteRole?._id);
    console.log('  garagisteId:', testGaragisteRole?.garagisteId);
    console.log('  garagisteId type:', typeof testGaragisteRole?.garagisteId);
    console.log('  roleId:', testGaragisteRole?.roleId);
    console.log('  roleId type:', typeof testGaragisteRole?.roleId);

    console.log('\n✨ Migration terminée avec succès !');
    console.log(`📊 Résumé: ${grFixed} GaragisteRoles et ${rpFixed} RolePermissions corrigés`);
    
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

fixDataTypes();
