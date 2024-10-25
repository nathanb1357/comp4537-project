const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASS,
    database: process.env.DB,
    waitForConnections: true,
    connectionLimit: 10
});

module.exports = pool;