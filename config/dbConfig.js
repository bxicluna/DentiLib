const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URL + "/dentiLib");
    console.log("MongoDB connected !");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
  }
};

module.exports = connectDB