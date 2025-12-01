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
    ref: 'Garagiste',
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
    // ⭐ RETIRÉ: unique: true (car nous utilisons un index composite)
  },
  devisId: {
    type: String,
    required: true,
    unique: true, 
  },
  clientInfo: {
    nom: { type: String, required: true },
    ClientId: { type: Object, required: true },
    telephone: String,
    email: String,
    adresse: String
  },
  vehiculedetails: {
    nom: { type: String, required: true },
    vehiculeId: { type: Object, required: true },
  },
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
  atelierId: {
    type: Schema.Types.ObjectId,
    ref: 'Atelier',
    required: true
  },
  atelierNom: {
    type: String,
    required: true
  },
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
  description: {
    type: String,
    trim: true
  },
  taches: [TacheSchema],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'Garagiste'
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Garagiste'
  },
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
  garageId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Garage', 
    required: true 
  },
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

// ⭐ INDEX COMPOSITE : numeroOrdre unique PAR garage
OrdreTravailSchema.index({ numeroOrdre: 1, garageId: 1 }, { unique: true });

// Virtuals
OrdreTravailSchema.virtual('progressionPourcentage').get(function() {
  if (this.nombreTaches === 0) return 0;
  return Math.round((this.nombreTachesTerminees / this.nombreTaches) * 100);
});

OrdreTravailSchema.virtual('enRetard').get(function() {
  if (!this.dateFinPrevue || this.status === 'termine') return false;
  return new Date() > this.dateFinPrevue;
});

// ⭐ PRE-SAVE HOOK avec logique de retry robuste
OrdreTravailSchema.pre('save', async function(next) {
  if (this.isNew && !this.numeroOrdre) {
    let numeroGenere = false;
    let tentatives = 0;
    const maxTentatives = 10;
    
    while (!numeroGenere && tentatives < maxTentatives) {
      try {
        // Trouver le dernier numéro utilisé pour ce garage
        const dernierOrdre = await this.constructor
          .findOne({ garageId: this.garageId })
          .sort({ numeroOrdre: -1 })
          .select('numeroOrdre')
          .lean();
        
        let prochainNumero = 1;
        
        if (dernierOrdre && dernierOrdre.numeroOrdre) {
          // Extraire le numéro du format ORD-XXXX
          const match = dernierOrdre.numeroOrdre.match(/ORD-(\d+)/);
          if (match) {
            prochainNumero = parseInt(match[1], 10) + 1;
          }
        }
        
        this.numeroOrdre = `ORD-${String(prochainNumero).padStart(4, '0')}`;
        numeroGenere = true;
        
      } catch (error) {
        tentatives++;
        if (tentatives >= maxTentatives) {
          // Fallback: utiliser timestamp pour garantir l'unicité
          const timestamp = Date.now().toString().slice(-6);
          this.numeroOrdre = `ORD-${timestamp}`;
          numeroGenere = true;
        }
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }
  
  // Calculer les statistiques
  this.nombreTaches = this.taches.length;
  this.nombreTachesTerminees = this.taches.filter(t => t.status === 'terminee').length;
  this.totalHeuresEstimees = this.taches.reduce((total, tache) => total + tache.estimationHeures, 0);
  this.totalHeuresReelles = this.taches.reduce((total, tache) => total + tache.heuresReelles, 0);
  
  // Mettre à jour le statut global
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

// Methods
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

// Statics
OrdreTravailSchema.statics.findByStatus = function(status, options = {}) {
  const query = status ? { status } : {};
  return this.find(query)
    .populate('atelierId', 'name localisation')
    .populate('taches.serviceId', 'name')
    .populate('taches.mecanicienId', 'nom')
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 0)
    .skip(options.skip || 0);
};

OrdreTravailSchema.statics.findByAtelier = function(atelierId, options = {}) {
  return this.find({ atelierId })
    .populate('taches.serviceId', 'name')
    .populate('taches.mecanicienId', 'nom')
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 0)
    .skip(options.skip || 0);
};

OrdreTravailSchema.statics.getStatistiques = async function(atelierId = null, garageId = null) {
  const match = {};
  
  if (garageId) {
    match.garageId = new mongoose.Types.ObjectId(garageId);
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
        Supprimés: { $sum: { $cond: [{ $eq: ['$status', 'supprime'] }, 1, 0] } },
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
    Supprimés: 0,
    totalHeuresEstimees: 0,
    totalHeuresReelles: 0
  };
};

OrdreTravailSchema.statics.getTempsMoyenInterventions = async function(atelierId, periode = 'jour', garageId = null) {
  const match = {};
  
  if (garageId) {
    match.garageId = new mongoose.Types.ObjectId(garageId);
  }
  
  if (atelierId) {
    match.atelierId = new mongoose.Types.ObjectId(atelierId);
  }
  
  let dateFilter = {};
  
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

OrdreTravailSchema.statics.getChargeParMecanicien = async function(atelierId, periode = 'jour', garageId = null) {
  const match = {};

  if (garageId) {
    match.garageId = new mongoose.Types.ObjectId(garageId);
  }
  
  if (atelierId) {
    match.atelierId = new mongoose.Types.ObjectId(atelierId);
  }
  
  let dateFilter = {};
  
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

OrdreTravailSchema.statics.getStatutStats = async function(atelierId, periode = 'jour', garageId = null) {
  const match = {};
  
  if (garageId) {
    match.garageId = new mongoose.Types.ObjectId(garageId);
  }
  
  if (atelierId) {
    match.atelierId = new mongoose.Types.ObjectId(atelierId);
  }
  
  let dateFilter = {};
  
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
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

OrdreTravailSchema.statics.getChargeAtelier = async function(atelierId, periode = 'jour', garageId = null) {
  const match = {};

  if (garageId) {
    match.garageId = new mongoose.Types.ObjectId(garageId);
  }
  
  if (atelierId) {
    match.atelierId = new mongoose.Types.ObjectId(atelierId);
  }
  
  let dateFilter = {};
  let groupBy;
  
  const maintenant = new Date();
  
  switch(periode) {
    case 'jour':
      const debutJour = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
      const finJour = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate() + 1);
      
      dateFilter = {
        dateCommence: { $gte: debutJour, $lt: finJour }
      };
      groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$dateCommence" } };
      break;
      
    case 'semaine':
      const debutSemaine = new Date(maintenant);
      const jourSemaine = maintenant.getDay();
      const joursARetirer = jourSemaine === 0 ? 6 : jourSemaine - 1;
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