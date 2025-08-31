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
    telephone: String,
    email: String,
    adresse: String
  },
  // Informations véhicule (dénormalisées)
  vehiculeInfo: {
    type: String,
    required: true
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

// Index pour la performance
OrdreTravailSchema.index({ numeroOrdre: 1 });
OrdreTravailSchema.index({ devisId: 1 });
OrdreTravailSchema.index({ atelierId: 1 });
OrdreTravailSchema.index({ status: 1 });
OrdreTravailSchema.index({ priorite: 1 });
OrdreTravailSchema.index({ dateCommence: 1 });
OrdreTravailSchema.index({ createdAt: -1 });

// Virtual pour calculer le pourcentage de progression
OrdreTravailSchema.virtual('progressionPourcentage').get(function() {
  if (this.nombreTaches === 0) return 0;
  return Math.round((this.nombreTachesTerminees / this.nombreTaches) * 100);
});

// Virtual pour vérifier si l'ordre est en retard
OrdreTravailSchema.virtual('enRetard').get(function() {
  if (!this.dateFinPrevue || this.status === 'termine') return false;
  return new Date() > this.dateFinPrevue;
});

// Middleware pour générer le numéro d'ordre automatiquement
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

// Méthodes d'instance
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


// Méthodes statiques
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

OrdreTravailSchema.statics.getStatistiques = async function(atelierId = null) {
  const match = atelierId ? { atelierId: new mongoose.Types.ObjectId(atelierId) } : {};
  
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

export default mongoose.model('OrdreTravail', OrdreTravailSchema);