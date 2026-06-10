const { DataTypes } = require("sequelize");
const sequelize = require("../config/mysqlConfig");

const User = sequelize.define(
  "User",
  {
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName:  { type: DataTypes.STRING, allowNull: false },
    email:     { type: DataTypes.STRING, allowNull: false, unique: true },
    password:  { type: DataTypes.STRING, allowNull: false },
    role: {
      type: DataTypes.ENUM("admin", "dentiste", "prothesiste"),
      allowNull: false,
    },
    siret:           { type: DataTypes.BIGINT,   allowNull: true },
    associatedUserId: { type: DataTypes.INTEGER, allowNull: true },
  },
  { tableName: "users" }
);

module.exports = User;
