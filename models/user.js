const { Schema, model } = require("mongoose");

const userSchema = new Schema(
    {
        nom: {
            type: String,
            required: true,
            trim: true
        },
        prenom: {
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
            require: true
        },
        role: {
            type: String,
            require: true,
            enum: ["admin", "dentiste", "prothesiste"]
        }
    },
    { timestamps: true }
);

module.exports = model("User", userSchema)