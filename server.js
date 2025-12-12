require('dotenv').config();
const express = require('express');
const app = express()
const port = 3000
const dbConnection = require("./config/dbConfig")
require('./models/user.model.js')
const userRoutes = require('./routes/userRoutes')

//connection à la DB
dbConnection()


app.use(express.json())
app.use('/api/', userRoutes)


app.get('/', (req, res) => {
    res.send('Bienvenue sur DentiLib!')
})

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
})