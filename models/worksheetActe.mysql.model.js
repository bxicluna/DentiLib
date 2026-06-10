const { DataTypes } = require("sequelize");
const sequelize = require("../config/mysqlConfig");
const WorkSheet = require("./worksheet.mysql.model");

const WorksheetActe = sequelize.define(
  "WorksheetActe",
  {
    acteName: { type: DataTypes.STRING, allowNull: false },
    price:    { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  },
  { tableName: "worksheet_actes", timestamps: false }
);

WorksheetActe.belongsTo(WorkSheet, { foreignKey: "worksheetId" });
WorkSheet.hasMany(WorksheetActe, { foreignKey: "worksheetId", as: "actes" });

module.exports = WorksheetActe;
