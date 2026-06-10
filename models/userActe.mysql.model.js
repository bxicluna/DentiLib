const { DataTypes } = require("sequelize");
const sequelize = require("../config/mysqlConfig");
const User = require("./user.mysql.model");
const Acte = require("./acte.mysql.model");

const UserActe = sequelize.define(
  "UserActe",
  {
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  },
  { tableName: "user_actes", timestamps: false }
);

// Associations
UserActe.belongsTo(User, { foreignKey: "userId" });
UserActe.belongsTo(Acte, { foreignKey: "acteId" });
User.hasMany(UserActe, { foreignKey: "userId", as: "actesList" });
User.belongsTo(User,   { as: "associatedUser", foreignKey: "associatedUserId" });

module.exports = UserActe;
