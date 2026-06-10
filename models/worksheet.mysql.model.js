const { DataTypes } = require("sequelize");
const sequelize = require("../config/mysqlConfig");

const WorkSheet = sequelize.define(
  "WorkSheet",
  {
    comment: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM("En attente", "En cours", "Termine"),
      allowNull: false,
      defaultValue: "En attente",
    },
    patientFirstName: { type: DataTypes.STRING, allowNull: false },
    patientLastName:  { type: DataTypes.STRING, allowNull: false },
    patientEmail:     { type: DataTypes.STRING, allowNull: false },
    patientNumSecu:   { type: DataTypes.BIGINT, allowNull: false },
    facturePDF:       { type: DataTypes.STRING, allowNull: true },
    dentisteId:       { type: DataTypes.INTEGER, allowNull: false },
    prothesisteId:    { type: DataTypes.INTEGER, allowNull: false },
    total:            { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  },
  { tableName: "worksheets" }
);

module.exports = WorkSheet;
