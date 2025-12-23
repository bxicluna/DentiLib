const mongoose = require("mongoose");

const acteSchema = new mongoose.Schema(
    {
        acteName: {
            type: String,
            trim: true,
            required: true,
            unique: true
        },
        acteDescription: {
            type: String,
        }
    }
)

module.exports = mongoose.model('Acte', acteSchema)

