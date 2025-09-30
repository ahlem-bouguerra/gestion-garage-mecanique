import OrdreTravail from '../../models/Ordre.js';

export const getDashboardData = async (req, res) => {
  try {
    const { periode = 'jour', atelier } = req.query;
    
    const chargeAtelier = await OrdreTravail.getChargeAtelier(atelier, periode);
    const tempsMoyenInterventions = await OrdreTravail.getTempsMoyenInterventions(atelier, periode);
    const chargeParMecanicien = await OrdreTravail.getChargeParMecanicien(atelier, periode);
    
    // AJOUTER CETTE LIGNE :
    const statutStats = await OrdreTravail.getStatutStats(atelier, periode);
    
    // Calculer les statistiques
    let statistiques = {
      total: 0,
      enAttente: 0,
      enCours: 0, 
      termines: 0,
      suspendus: 0,
      totalHeuresEstimees: 0,
      totalOrdresTermines: 0  // ← AJOUTEZ CETTE LIGNE
    };
    
statutStats.forEach(stat => {
  console.log('Traitement statut:', stat._id, 'count:', stat.count); // Pour débugger
  
  switch(stat._id) {
    case 'en_attente': // ✅ Correspond à vos logs
      statistiques.enAttente = stat.count;
      break;
    case 'en_cours': // ✅ Correspond à vos logs  
      statistiques.enCours = stat.count;
      break;
    case 'termine': // ❓ Vérifiez si c'est le bon nom
    case 'terminé': // Peut-être avec accent ?
    case 'completed': // Ou en anglais ?
    case 'fini': // Autre variante ?
      statistiques.termines = stat.count;
      statistiques.totalOrdresTermines = stat.count;
      break;
    case 'suspendu':
      statistiques.suspendus = stat.count;
      break;
    default:
      console.log('Statut non reconnu:', stat._id); // Pour identifier les statuts manqués
  }
});

// Calculer le total depuis les statuts individuels pour être sûr
statistiques.total = statistiques.enAttente + statistiques.enCours + 
                    statistiques.termines + statistiques.suspendus;
    
    if (chargeAtelier.length > 0) {
      statistiques.total = chargeAtelier[0].nombreOrdres;
      statistiques.totalHeuresEstimees = chargeAtelier[0].chargeEstimee;
    }
    
    res.json({
      periode,
      date: periode === 'jour' ? new Date().toISOString().split('T')[0] : null,
      statistiques,
      tempsMoyenInterventions: tempsMoyenInterventions[0] || {
    tempsMoyenEstime: 0,
    tempsMoyenReel: 0
  },
  chargeParMecanicien  // ← AJOUTEZ CETTE LIGNE

    });
    console.log('statutStats:', statutStats);
console.log('statistiques finales:', statistiques);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};