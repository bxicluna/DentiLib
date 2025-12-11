const mongoose = require("mongoose");

const acteSchema = new mongoose.Schema(
    {
        acteName: {
            type: String,
            trim: true,
            required: true
        },
        acteDescription: {
            type: Text,
        }
    }
)

module.exports = mongoose.model('Acte', actesSchema)

