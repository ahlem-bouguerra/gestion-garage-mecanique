import Piece from '../models/Pieces.js';

// GET - Récupérer toutes les pièces
export const getAllPieces = async (req, res) => {
  try {
    const pieces = await Piece.find({});
    console.log("✅ Pièces récupérées:", pieces.length);
    res.json(pieces);
  } catch (error) {
    console.error("❌ Erreur getAllPieces:", error);
    res.status(500).json({ error: error.message });
  }
};

// GET - Récupérer une pièce par ID
export const getPieceById = async (req, res) => {
  try {
    const { id } = req.params;
    const piece = await Piece.findById(id);

    if (!piece) {
      return res.status(404).json({ error: 'Pièce non trouvée' });
    }

    res.json(piece);
  } catch (error) {
    console.error("❌ Erreur getPieceById:", error);
    res.status(500).json({ error: error.message });
  }
};

// POST - Créer une nouvelle pièce
export const createPiece = async (req, res) => {
  try {
    const { name, prix } = req.body;

    console.log("📝 Création pièce - Données reçues:", req.body);

    if (!name || prix === undefined) {
      return res.status(400).json({ 
        error: 'Les champs nom et prix sont obligatoires' 
      });
    }

    const piece = new Piece({ name, prix });
    await piece.save();

    console.log("✅ Pièce créée:", piece);
    res.status(201).json(piece);

  } catch (error) {
    console.error("❌ Erreur createPiece:", error);
    res.status(500).json({ error: error.message });
  }
};

// PUT - Modifier une pièce
export const updatePiece = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const pieceModifie = await Piece.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!pieceModifie) {
      return res.status(404).json({ error: 'Pièce non trouvée' });
    }

    console.log("✅ Pièce modifiée:", pieceModifie);
    res.json(pieceModifie);

  } catch (error) {
    console.error("❌ Erreur updatePiece:", error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE - Supprimer une pièce
export const deletePiece = async (req, res) => {
  try {
    const { id } = req.params;

    const pieceSupprimee = await Piece.findByIdAndDelete(id);

    if (!pieceSupprimee) {
      return res.status(404).json({ error: 'Pièce non trouvée' });
    }

    console.log("🗑️ Pièce supprimée:", pieceSupprimee);
    res.json({ message: "Pièce supprimée avec succès" });

  } catch (error) {
    console.error("❌ Erreur deletePiece:", error);
    res.status(500).json({ error: error.message });
  }
};
