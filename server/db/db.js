const mysql = require('mysql2');
const env = require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASS,
    database: process.env.DB,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10
});

module.exports = pool.promise(); 