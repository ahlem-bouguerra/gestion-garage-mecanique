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

export const getChargeMensuelle = async (req, res) => {
  try {
    const { mois, annee, atelierId } = req.query;
    
    const startDate = new Date(annee, mois - 1, 1);
    const endDate = new Date(annee, mois, 0, 23, 59, 59);
    
    const matchFilter = {
      garagisteId: req.user._id,
      $or: [
        { dateCommence: { $lte: endDate }, dateFinPrevue: { $gte: startDate } },
        { dateCommence: { $gte: startDate, $lte: endDate } }
      ]
    };
    
    if (atelierId && atelierId !== 'tous') {
      matchFilter.atelierId = new mongoose.Types.ObjectId(atelierId);
    }
    
    const ordres = await OrdreTravail.find(matchFilter).lean();
    
    const joursTotal = endDate.getDate();
    const resultats = Array.from({ length: joursTotal }, (_, i) => ({
      jour: i + 1,
      nombreOrdres: 0,
      ordresActifs: new Set(),
      chargeEstimee: 0,
      chargeReelle: 0,
      // 🆕 Détails par statut
      parStatut: {
        en_attente: { count: 0, ordres: [] },
        en_cours: { count: 0, ordres: [] },
        termine: { count: 0, ordres: [] },
        suspendu: { count: 0, ordres: [] }
      }
    }));
    
    // Répartir chaque ordre sur ses jours
    ordres.forEach(ordre => {
      const debut = new Date(Math.max(ordre.dateCommence, startDate));
      const fin = new Date(Math.min(ordre.dateFinPrevue || ordre.dateCommence, endDate));
      
      const nbJoursOrdre = Math.ceil((fin - debut) / (1000 * 60 * 60 * 24)) + 1;
      const chargeEstimeeParJour = (ordre.totalHeuresEstimees || 0) / nbJoursOrdre;
      const chargeReelleParJour = (ordre.totalHeuresReelles || 0) / nbJoursOrdre;
      
      for (let d = new Date(debut); d <= fin; d.setDate(d.getDate() + 1)) {
        const jourIndex = d.getDate() - 1;
        if (jourIndex >= 0 && jourIndex < joursTotal) {
          const ordreId = ordre._id.toString();
          
          // Éviter les doublons
          if (!resultats[jourIndex].ordresActifs.has(ordreId)) {
            resultats[jourIndex].ordresActifs.add(ordreId);
            
            // 🆕 Ajouter les détails de l'ordre par statut
            const status = ordre.status || 'en_attente';
            if (resultats[jourIndex].parStatut[status]) {
              resultats[jourIndex].parStatut[status].count++;
              resultats[jourIndex].parStatut[status].ordres.push({
                id: ordreId,
                numeroOrdre: ordre.numeroOrdre,
                clientNom: ordre.clientInfo?.nom,
                vehicule: ordre.vehiculedetails?.nom,
                dateDebut: ordre.dateCommence,
                dateFin: ordre.dateFinPrevue || ordre.dateFinReelle,
                heuresEstimees: ordre.totalHeuresEstimees,
                progression: Math.round((ordre.nombreTachesTerminees / ordre.nombreTaches) * 100) || 0
              });
            }
          }
          
          resultats[jourIndex].chargeEstimee += chargeEstimeeParJour;
          resultats[jourIndex].chargeReelle += chargeReelleParJour;
        }
      }
    });
    
    // Convertir le Set en nombre
    const donneesFinales = resultats.map(r => ({
      jour: r.jour,
      nombreOrdres: r.ordresActifs.size,
      chargeEstimee: r.chargeEstimee,
      chargeReelle: r.chargeReelle,
      parStatut: r.parStatut // 🆕 Inclure les détails
    }));
    
    res.json({
      mois,
      annee,
      donnees: donneesFinales
    });
    
  } catch (error) {
    console.error("❌ Erreur getChargeMensuelle:", error);
    res.status(500).json({ error: error.message });
  }
};