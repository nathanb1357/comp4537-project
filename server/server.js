require('dotenv').config({ path:'./server/.env' });

const express = require('express');
const db = require('./db/db');
db.initializeTables((err) => {
    if (err) {
        console.error('Error initializing tables:', err);
        process.exit(1); // Exit the application if DB initialization fails
    }
});

const { uploadImage, predictImage } = require('./controllers/api');
const { register, login, resetPassword, verifyToken, authenticateToken} = require('./controllers/auth');

// Creates new express app
const app = express();
app.use(express.json());

app.post('/auth/register', register);
app.post('/auth/login', login);
app.get('/auth/resetPassword/:email', resetPassword);
app.get('/auth/verifytoken/:token', verifyToken);
// app.post('/auth/resetPassword', changePassword);
// app.post('/api/predictImage', authenticateToken, uploadImage, predictImage);
// app.post('/api/getApiUsage', getApiUsage);


// Test to see if API working
app.get('/', (req, res) => {
    res.send('Welcome to the API server');
});

async function startServer() {
    try {
        await db.initializeTables().then(
            app.listen(PORT, HOST, () => {
                console.log(`Server running on ${HOST}: port ${PORT}!`);
            })
        );
    } catch (error) {
        console.error('Error initializing tables:', error);
        process.exit(1);
    }
}

startServer();