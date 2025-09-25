import mongoose from 'mongoose';
const { Schema } = mongoose;

// Schéma pour une tâche individuelle
const TacheSchema = new Schema({
  description: {
    type: String,
    required: true,
    trim: true
  },
  quantite: {
    type: Number,
    default: 1,
    min: 1
  },
  serviceId: {
    type: Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  serviceNom: {
    type: String,
    required: true
  },
  mecanicienId: {
    type: Schema.Types.ObjectId,
    ref: 'Mecanicien',
    required: true
  },
  mecanicienNom: {
    type: String,
    required: true
  },
  estimationHeures: {
    type: Number,
    required: true,
    min: 0.5,
    default: 1
  },
  heuresReelles: {
    type: Number,
    min: 0,
    default: 0
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['non_assignee', 'assignee', 'en_cours', 'terminee', 'suspendue'],
    default: 'assignee'
  },
  dateDebut: {
    type: Date
  },
  dateFin: {
    type: Date
  }
}, {
  _id: true,
  timestamps: true
});

// Schéma principal pour l'ordre de travail
const OrdreTravailSchema = new Schema({
  numeroOrdre: {
    type: String,
    unique: true,
  },
  devisId: {
    type: String, // Au lieu de Schema.Types.ObjectId
    required: true,
    unique: true, 
  },
  // Informations client (dénormalisées pour performance)
  clientInfo: {
    nom: { type: String, required: true },
    ClientId: { type: Object, required: true },
    telephone: String,
    email: String,
    adresse: String
  },
  // Informations véhicule (dénormalisées)
  vehiculedetails: {
    nom: { type: String, required: true },
    vehiculeId: { type: Object, required: true },
  },
  // Dates importantes
  dateCommence: {
    type: Date,
    required: true
  },
  dateFinPrevue: {
    type: Date
  },
  dateFinReelle: {
    type: Date
  },
  // Atelier assigné
  atelierId: {
    type: Schema.Types.ObjectId,
    ref: 'Atelier',
    required: true
  },
  atelierNom: {
    type: String,
    required: true
  },
  // Priorité et statut
  priorite: {
    type: String,
    enum: ['faible', 'normale', 'elevee', 'urgente'],
    default: 'normale'
  },
  status: {
    type: String,
    enum: ['en_attente', 'en_cours', 'termine', 'suspendu','supprime'],
    default: 'en_attente'
  },
  // Description générale
  description: {
    type: String,
    trim: true
  },
  // Liste des tâches
  taches: [TacheSchema],
  // Métadonnées
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  // Statistiques calculées
  totalHeuresEstimees: {
    type: Number,
    default: 0
  },
  totalHeuresReelles: {
    type: Number,
    default: 0
  },
  nombreTaches: {
    type: Number,
    default: 0
  },
  nombreTachesTerminees: {
    type: Number,
    default: 0
  },
  garagisteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
  },
  // Notes et commentaires additionnels
  notes: [{
    contenu: String,
    auteur: String,
    date: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

OrdreTravailSchema.virtual('progressionPourcentage').get(function() {
  if (this.nombreTaches === 0) return 0;
  return Math.round((this.nombreTachesTerminees / this.nombreTaches) * 100);
});

OrdreTravailSchema.virtual('enRetard').get(function() {
  if (!this.dateFinPrevue || this.status === 'termine') return false;
  return new Date() > this.dateFinPrevue;
});

OrdreTravailSchema.pre('save', async function(next) {
  if (this.isNew && !this.numeroOrdre) {
    const count = await this.constructor.countDocuments();
    this.numeroOrdre = `ORD-${String(count + 1).padStart(4, '0')}`;
  }
  
  // Calculer les statistiques
  this.nombreTaches = this.taches.length;
  this.nombreTachesTerminees = this.taches.filter(t => t.status === 'terminee').length;
  this.totalHeuresEstimees = this.taches.reduce((total, tache) => total + tache.estimationHeures, 0);
  this.totalHeuresReelles = this.taches.reduce((total, tache) => total + tache.heuresReelles, 0);
  
  // Mettre à jour le statut global basé sur les tâches
  if (this.nombreTaches > 0) {
    if (this.nombreTachesTerminees === this.nombreTaches) {
      this.status = 'termine';
      this.dateFinReelle = new Date();
    } else if (this.taches.some(t => t.status === 'en_cours')) {
      this.status = 'en_cours';
    }
  }
  
  next();
});

OrdreTravailSchema.methods.demarrerTache = function(tacheId, userId) {
  const tache = this.taches.id(tacheId);
  if (tache && tache.status === 'assignee') {
    tache.status = 'en_cours';
    tache.dateDebut = new Date();
    this.updatedBy = userId;
    return this.save();
  }
  throw new Error('Tâche non trouvée ou déjà démarrée');
};

OrdreTravailSchema.methods.terminerTache = function(tacheId, heuresReelles, userId) {
  const tache = this.taches.id(tacheId);
  if (tache && tache.status === 'en_cours') {
    tache.status = 'terminee';
    tache.dateFin = new Date();
    tache.heuresReelles = heuresReelles || tache.estimationHeures;
    this.updatedBy = userId;
    return this.save();
  }
  throw new Error('Tâche non trouvée ou non en cours');
};

OrdreTravailSchema.statics.findByStatus = function(status, options = {}) {
  const query = status ? { status } : {};
  return this.find(query)
    .populate('devisId', 'id clientName vehicleInfo')
    .populate('atelierId', 'name localisation')
    .populate('taches.serviceId', 'name')
    .populate('taches.mecanicienId', 'nom')
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 0)
    .skip(options.skip || 0);
};

OrdreTravailSchema.statics.findByAtelier = function(atelierId, options = {}) {
  return this.find({ atelierId })
    .populate('devisId', 'id clientName vehicleInfo')
    .populate('taches.serviceId', 'name')
    .populate('taches.mecanicienId', 'nom')
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 0)
    .skip(options.skip || 0);
};

OrdreTravailSchema.statics.getStatistiques = async function(atelierId = null, garagisteId = null) {
    const match = {};
    
    if (garagisteId) {
      match.garagisteId = new mongoose.Types.ObjectId(garagisteId);
    }
    
    if (atelierId) {
      match.atelierId = new mongoose.Types.ObjectId(atelierId);
    }
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        enAttente: { $sum: { $cond: [{ $eq: ['$status', 'en_attente'] }, 1, 0] } },
        enCours: { $sum: { $cond: [{ $eq: ['$status', 'en_cours'] }, 1, 0] } },
        termines: { $sum: { $cond: [{ $eq: ['$status', 'termine'] }, 1, 0] } },
        suspendus: { $sum: { $cond: [{ $eq: ['$status', 'suspendu'] }, 1, 0] } },
        totalHeuresEstimees: { $sum: '$totalHeuresEstimees' },
        totalHeuresReelles: { $sum: '$totalHeuresReelles' }
      }
    }
  ]);
  
  return stats[0] || {
    total: 0,
    enAttente: 0,
    enCours: 0,
    termines: 0,
    suspendus: 0,
    totalHeuresEstimees: 0,
    totalHeuresReelles: 0
  };
};

OrdreTravailSchema.statics.getTempsMoyenInterventions = async function(atelierId, periode = 'jour', garagisteId = null) {
  const match = {};
  
  if (garagisteId) {
    match.garagisteId = new mongoose.Types.ObjectId(garagisteId);
  }
  
  if (atelierId) {
    match.atelierId = new mongoose.Types.ObjectId(atelierId);
  }
  
  let dateFilter = {};
  
  // Si la période est 'jour', filtrer pour aujourd'hui seulement
  if (periode === 'jour') {
    const aujourdhui = new Date();
    const debutJour = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), aujourdhui.getDate());
    const finJour = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), aujourdhui.getDate() + 1);
    
    dateFilter = {
      dateCommence: {
        $gte: debutJour,
        $lt: finJour
      }
    };
  }
  
  const finalMatch = { ...match, ...dateFilter };
  
  return await this.aggregate([
    { $match: finalMatch },
    {
      $group: {
        _id: null,
        tempsMoyenEstime: { $avg: '$totalHeuresEstimees' },
        nombreInterventions: { $sum: 1 }
      }
    }
  ]);
};

OrdreTravailSchema.statics.getChargeParMecanicien = async function(atelierId, periode = 'jour', garagisteId = null) {
    const match = {};
  
  if (garagisteId) {
    match.garagisteId = new mongoose.Types.ObjectId(garagisteId);
  }
  
  if (atelierId) {
    match.atelierId = new mongoose.Types.ObjectId(atelierId);
  }
  
  let dateFilter = {};
  
  // Si la période est 'jour', filtrer pour aujourd'hui seulement
  if (periode === 'jour') {
    const aujourdhui = new Date();
    const debutJour = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), aujourdhui.getDate());
    const finJour = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), aujourdhui.getDate() + 1);
    
    dateFilter = {
      dateCommence: {
        $gte: debutJour,
        $lt: finJour
      }
    };
  }
  
  const finalMatch = { ...match, ...dateFilter };
  
  return await this.aggregate([
    { $match: finalMatch },
    { $unwind: '$taches' },
    {
      $group: {
        _id: {
          mecanicienId: '$taches.mecanicienId',
          mecanicienNom: '$taches.mecanicienNom'
        },
        chargeEstimee: { $sum: '$taches.estimationHeures' },
        nombreTaches: { $sum: 1 }
      }
    }
  ]);
};


OrdreTravailSchema.statics.getStatutStats = async function(atelierId, periode = 'jour' , garagisteId = null) {
  const match = {};
  
  if (garagisteId) {
    match.garagisteId = new mongoose.Types.ObjectId(garagisteId);
  }
  
  if (atelierId) {
    match.atelierId = new mongoose.Types.ObjectId(atelierId);
  }
  
  let dateFilter = {};
  
  // Si la période est 'jour', filtrer pour aujourd'hui seulement
  if (periode === 'jour') {
    const aujourdhui = new Date();
    const debutJour = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), aujourdhui.getDate());
    const finJour = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), aujourdhui.getDate() + 1);
    
    dateFilter = {
      dateCommence: {
        $gte: debutJour,
        $lt: finJour
      }
    };
  }
  
  const finalMatch = { ...match, ...dateFilter };
  
  return await this.aggregate([
    { $match: finalMatch },
    {
      $group: {
        _id: '$status', // Remplacez par le nom exact de votre champ statut
        count: { $sum: 1 }
      }
    }
  ]);
};


OrdreTravailSchema.statics.getChargeAtelier = async function(atelierId, periode = 'jour', garagisteId = null) {
    const match = {};
  
  if (garagisteId) {
    match.garagisteId = new mongoose.Types.ObjectId(garagisteId);
  }
  
  if (atelierId) {
    match.atelierId = new mongoose.Types.ObjectId(atelierId);
  }
  let dateFilter = {};
  let groupBy;
  
  const maintenant = new Date();
  
  switch(periode) {
    case 'jour':
      // Aujourd'hui seulement
      const debutJour = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
      const finJour = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate() + 1);
      
      dateFilter = {
        dateCommence: { $gte: debutJour, $lt: finJour }
      };
      groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$dateCommence" } };
      break;
      
    case 'semaine':
      // Cette semaine seulement (lundi à dimanche)
      const debutSemaine = new Date(maintenant);
      const jourSemaine = maintenant.getDay(); // 0 = dimanche, 1 = lundi...
      const joursARetirer = jourSemaine === 0 ? 6 : jourSemaine - 1; // Calculer depuis lundi
      debutSemaine.setDate(maintenant.getDate() - joursARetirer);
      debutSemaine.setHours(0, 0, 0, 0);
      
      const finSemaine = new Date(debutSemaine);
      finSemaine.setDate(debutSemaine.getDate() + 7);
      
      dateFilter = {
        dateCommence: { $gte: debutSemaine, $lt: finSemaine }
      };
      groupBy = { 
        year: { $year: '$dateCommence' },
        week: { $week: '$dateCommence' }
      };
      break;
      
    case 'mois':
      // Ce mois seulement
      const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1);
      const finMois = new Date(maintenant.getFullYear(), maintenant.getMonth() + 1, 1);
      
      dateFilter = {
        dateCommence: { $gte: debutMois, $lt: finMois }
      };
      groupBy = { 
        year: { $year: '$dateCommence' },
        month: { $month: '$dateCommence' }
      };
      break;
  }
  
  const finalMatch = { ...match, ...dateFilter };
  
  return await this.aggregate([
    { $match: finalMatch },
    {
      $group: {
        _id: groupBy,
        chargeEstimee: { $sum: '$totalHeuresEstimees' },
        nombreOrdres: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  ]);
};


export default mongoose.model('OrdreTravail', OrdreTravailSchema);