require('dotenv').config({ path: './server/.env' });

const express = require('express');
const db = require('./db/db');
const cors = require('cors');
const { upload, uploadImage, predictImage, getUserInfo, getAllUsers, getApiStats, deleteUser, editUser } = require('./controllers/api');
const { register, login, resetPassword, changePassword } = require('./controllers/auth');
const { authenticateToken, incrementEndpointCalls } = require('./controllers/middleware')

async function startServer() {
    try {
        db.initializeTables();

        const app = express();
        app.use(express.json());
        app.use(cors({
            origin: process.env.DOMAINS,
            methods: ['GET', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
            credentials: true
        }));

        // auth endpoints
        app.post('/v1/auth/register', register, incrementEndpointCalls);
        app.post('/v1/auth/login', login, incrementEndpointCalls);
        app.get('/v1/auth/resetPassword/:email', resetPassword, incrementEndpointCalls);
        app.post('/v1/auth/resetPassword', changePassword, incrementEndpointCalls);

        // api endpoints
        app.get('/v1/api/getUsers', authenticateToken, getAllUsers, incrementEndpointCalls);
        app.get('/v1/api/getUserInfo', authenticateToken, getUserInfo, incrementEndpointCalls);
        app.post('/v1/api/predictImage', authenticateToken, upload.single('image'), uploadImage, predictImage, incrementEndpointCalls);
        app.get('/v1/api/getApiStats', authenticateToken, getApiStats, incrementEndpointCalls);
        app.delete('/v1/api/deleteUser', authenticateToken, deleteUser, incrementEndpointCalls);
        app.patch('/v1/api/editUser', authenticateToken, editUser, incrementEndpointCalls);


        // TODO: Edit to send documentation on our API
        app.get('/v1/', (req, res) => {
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
