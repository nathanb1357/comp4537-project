require('dotenv').config({ path:'./server/.env' });

const express = require('express');
const db = require('./db/db');

const { uploadImage, predictImage } = require('./controllers/api');
const { register, login, resetPassword, verifyToken, authenticateToken} = require('./controllers/auth');

// Creates new express app
const app = express();
app.use(express.json());

// Create db tables if none exist
db.initializeTables();

app.post('/auth/register', register);
app.post('/auth/login', login);
app.get('/auth/resetPassword/:email', resetPassword);
app.get('/auth/verifytoken/:token', verifyToken);
// app.post('/auth/resetPassword', changePassword);
// app.post('/api/predictImage', authenticateToken, uploadImage, predictImage);
// app.post('/api/getApiUsage', getApiUsage);

app.listen(process.env.PORT, process.env.HOST, () => {
    console.log(`Server running on ${process.env.HOST}: port ${process.env.PORT}!`)
});