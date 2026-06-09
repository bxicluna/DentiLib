const { DataTypes } = require("sequelize");
const sequelize = require("../config/mysqlConfig");

const Acte = sequelize.define(
  "Acte",
  {
    acteName:        { type: DataTypes.STRING, allowNull: false, unique: true },
    acteDescription: { type: DataTypes.TEXT,   allowNull: true },
  },
  { tableName: "actes", timestamps: false }
);

module.exports = Acte;
