require('dotenv').config({ path: './server/.env' });

const express = require('express');
const db = require('./db/db');
const cors = require('cors');
const { uploadImage, predictImage } = require('./controllers/api');
const { register, login, resetPassword, verifyToken, authenticateToken} = require('./controllers/auth');

async function startServer() {
    try {
        db.initializeTables();

        const app = express();
        app.use(express.json());
        app.use(cors({
            origin: process.env.DOMAINS,
            methods: ['GET', 'POST', 'OPTIONS'],
            credentials: true
        }));

        app.post('/auth/register', register);
        app.post('/auth/login', login);
        app.get('/auth/resetPassword/:email', resetPassword);
        app.get('/auth/verifytoken/:token', verifyToken);
        // app.post('/auth/resetPassword', changePassword);
        // app.post('/api/predictImage', authenticateToken, uploadImage, predictImage);
        // app.post('/api/getApiUsage', getApiUsage);

        app.get('/', (req, res) => {
            res.send('Welcome to the API server');
        });

        app.listen(process.env.PORT, process.env.HOST, () => {
            console.log(`Server running on ${process.env.HOST}: port ${process.env.PORT}!`);
        });
    } catch (error) {
        console.error('Error initializing tables:', error);
        process.exit(1);
    }
}

startServer();
