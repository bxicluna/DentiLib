require('dotenv').config();
const express = require('express');
const app = express()
const port = 3000
const path = require('path')
const dbConnection = require("./config/dbConfig")
require('./models/user.model.js')
const userRoutes = require('./routes/userRoutes')
const adminRoutes = require('./routes/adminRoutes')
const worksheetRoutes = require('./routes/worksheetRoutes')
const actesRoutes = require('./routes/actesRoutes')


app.use(express.json())

//connection à la DB
dbConnection()


app.use(express.static(path.join(__dirname, 'public')))
app.use('/api/', userRoutes)
app.use('/api/', adminRoutes)
app.use('/api/', worksheetRoutes)
app.use('/api/acte', actesRoutes)


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'))
})

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
})