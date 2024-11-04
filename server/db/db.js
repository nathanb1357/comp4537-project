const mysql = require('mysql2');
require('dotenv').config({ path: './server/.env' });

class Database {
    constructor() {
        this.pool = mysql.createPool({
            host: process.env.HOST,
            user: process.env.USER,
            password: process.env.PASS,
            database: process.env.DB,
            port: process.env.PORT,
            connectionLimit: 10
        });
    }
    
    initializeTables() {
        const createQuery = (
            `CREATE TABLE IF NOT EXISTS User (
                user_id INT AUTO_INCREMENT PRIMARY KEY,
                user_email VARCHAR(255) UNIQUE NOT NULL,
                user_pass VARCHAR(255) NOT NULL,
                user_calls INT DEFAULT 20,
                user_role ENUM('user', 'admin') DEFAULT 'user'
            ) ENGINE=InnoDB;
             
            CREATE TABLE IF NOT EXISTS ResetToken (
                token VARCHAR(255) PRIMARY KEY,
                user_id INT NOT NULL,
                expiry INT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES User(user_id)
            ) ENGINE=InnoDB;`
        );
        this.query(createQuery, (err, result) => {
            if (err) {
                console.error("Error initializing tables:", err);
                return;
            }
            console.log('Tables ready');
        });
    }

    query(sql, params=[], callback) {
        if (typeof callback !== 'function') {
            callback = (err, results) => {
                if (err) console.error("Query error:", err);
            };
        }
    
        this.pool.getConnection((err, connection) => {
            if (err) {
                console.error("Connection error:", err); // Log connection error
                callback(err, null); // Pass connection error to callback
                return;
            }
    
            connection.query(sql, params, (queryErr, result) => {
                connection.release(); // Always release the connection
    
                if (queryErr) {
                    console.error("Query execution error:", queryErr); // Log query execution error
                    callback(queryErr, null); // Pass query execution error to callback
                } else {
                    callback(null, result); // Successful result
                }
            });
        });
    }
}

const db = new Database();
module.exports = db;