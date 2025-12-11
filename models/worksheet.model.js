const mongoose = require("mongoose");

const workSheetSchema = new mongoose.Schema(
    {
        numWorkSheet: {
            type: Number,
            required: true,           
        },
        comment: {
            type: Text
        },
        status: {
            type: String,
            required: true,
            enum: ["En attente", "En cours", "Termine"]
        },
        actes: [
            {
            acteName: {
                type: String,
                trim: true,
            },
            price: {
                type: Number,
            }
            }
        ],
        patientFirstName: {
            type: String,
            required: true,
            trim: true
        },
        patientLastName: {
            type: String,
            required: true,
            trim: true
        },
        patientEmail: {
            type: String,
            required: true,
            required: true,
            trim: true
        },
        patientNumSecu: {
            type: Number,
            required: true,
        },
        facturePDF: {
            type: String,
            trim: true
        },
        idUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('WorkSheet', workSheetSchema)