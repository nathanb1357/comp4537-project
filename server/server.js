const dotenv = require('dotenv');
const express = require('express');
const { detectImage } = require('./controllers/api');
const { register, login, resetPassword, verifyToken, changePassword, authenticate } = require('./controllers/auth');
const { verify } = require('jsonwebtoken');

const app = express();

app.use(express.json());
dotenv.config();

app.post('/auth/register', register);
app.post('/auth/login', login);
app.get('/auth/resetPassword/:email', resetPassword);
app.get('/auth/verifytoken/:token', verifyToken);
app.post('/auth/resetPassword', changePassword);
// app.post('/api/detectImage', authenticate, detectImage);

app.listen(process.env.PORT, process.env.HOST, () => {
    console.log(`Server running on ${process.env.HOST}: port ${process.env.PORT}!`)
});

app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}!`);
});