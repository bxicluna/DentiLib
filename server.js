require('dotenv').config();
const express = require('express');
const app = express()
const port = 3000
const path = require('path')
const connectMongo = require("./config/dbConfig")
const sequelize = require("./config/mysqlConfig")

// Charge les modèles MySQL et leurs associations
require('./models/userActe.mysql.model');

const userRoutes = require('./routes/userRoutes')
const adminRoutes = require('./routes/adminRoutes')
const worksheetRoutes = require('./routes/worksheetRoutes')
const actesRoutes = require('./routes/actesRoutes')

app.use(express.json())

// Connexion MongoDB
connectMongo()

// Connexion MySQL + création des tables si elles n'existent pas
sequelize
  .sync({ alter: true })
  .then(() => console.log("MySQL connecté et tables synchronisées !"))
  .catch((err) => console.error("MySQL connection failed:", err.message))

app.use(express.static(path.join(__dirname, 'public')))
app.use('/api/', userRoutes)
app.use('/api/', adminRoutes)
app.use('/api/worksheet/', worksheetRoutes)
app.use('/api/acte', actesRoutes)

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'))
})

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
})
