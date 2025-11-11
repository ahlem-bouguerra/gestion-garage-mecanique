import mongoose from "mongoose";

const garagisteSchema = new mongoose.Schema({

    nom: { type: String, required: true },

    matriculeFiscal: { type: String, required: true, unique: true },

    // Localisation
    governorateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Governorate",
        default: null
    },
    governorateName: {
        type: String,
        default: ""
    },
    cityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "City",
        default: null
    },
    cityName: {
        type: String,
        default: ""
    },
    streetAddress: {
        type: String,
        default: ""
    },

    // Location optionnelle
    location: {
        type: {
            type: String,
            enum: ['Point']
        },
        coordinates: {
            type: [Number] // [longitude, latitude]
        }
    },
    // 🔗 Admin principal du garage
    garagisteAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Garagiste",
        default: null,
    },

}, {
    timestamps: true
});

// ✅ Index géospatial sparse
garagisteSchema.index({ location: '2dsphere' }, { sparse: true });

export const Garagiste = mongoose.model("Garagiste", garagisteSchema);