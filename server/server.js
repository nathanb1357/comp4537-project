const dotenv = require('dotenv');
const express = require('express');
const { detectImage } = require('./controllers/api');
const { register, login, authenticate } = require('./controllers/auth');

const app = express();

app.use(express.json());
dotenv.config();

app.post('/auth/register', register);
app.post('/auth/login', login);
app.post('/api/detectImage', authenticate, detectImage);

app.listen(process.env.PORT, process.env.HOST, () => {
    console.log(`Server running on ${process.env.HOST}: port ${process.env.PORT}!`)
});