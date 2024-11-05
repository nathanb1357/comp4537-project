require('dotenv').config({ path: './server/.env' });

const express = require('express');
const db = require('./db/db');
const cors = require('cors');
const { uploadImage, predictImage } = require('./controllers/api');
const { register, login, resetPassword,  authenticateToken, getUserInfo, changePassword, getAllUsers} = require('./controllers/auth');

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
        app.post('/auth/resetPassword', changePassword);
        app.get('/auth/userinfo', authenticateToken, getUserInfo);
        app.get('/auth/users', authenticateToken, getAllUsers);

        // api
        // app.post('/api/uploadImage', uploadImage);
        // app.post('/api/predictImage', predictImage);
        // app.post('/api/getApiUsage', getApiUsage);

        app.get('/', (req, res) => {
            res.send('Welcome to the API server');
        });

        // Error handling middleware
        app.use((err, req, res, next) => {
            console.error(err.stack);
            res.status(500).json({ error: 'Something went wrong!' });
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
