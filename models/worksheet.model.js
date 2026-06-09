const mongoose = require("mongoose");

const workSheetSchema = new mongoose.Schema(
  {
    numWorkSheet: {
      type: Number,
      required: true,
      unique: true,
    },
    comment: {
      type: String,
    },
    status: {
      type: String,
      required: true,
      enum: ["En attente", "En cours", "Termine"],
      default: "En attente",
    },
    actes: [
      {
        acteName: {
          type: String,
          trim: true,
        },
        price: {
          type: Number,
        },
        quantity: {
          type: Number,
          default: 1,
        },
      },
    ],
    patientFirstName: {
      type: String,
      required: true,
      trim: true,
    },
    patientLastName: {
      type: String,
      required: true,
      trim: true,
    },
    patientEmail: {
      type: String,
      required: true,
      trim: true,
    },
    patientNumSecu: {
      type: Number,
      required: true,
    },
    facturePDF: {
      type: String,
      trim: true,
    },
    dentisteId: {
      type: Number,
      required: true,
    },
    prothesisteId: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WorkSheet", workSheetSchema);
