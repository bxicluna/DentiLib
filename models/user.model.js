//const { Schema, model } = require("mongoose");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true
        },
        lastName: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            lowercase: true,
            required: true,
            unique: true,
            trim: true
        },
        password: {
            type: String,
            required: true,
            minLenght: 8
        },
        role: {
            type: String,
            required: true,
            enum: ["admin", "dentiste", "prothesiste"]
        },
        siret: {
            type: Number,
            trim: true
        },
        associatedUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        actesList: [
            {
            acte: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Acte'
            },
            price: {
                type: Number,
                required: true
            }
            }
        ]

    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema)