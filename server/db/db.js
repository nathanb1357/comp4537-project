const mysql = require('mysql2');

class Database {
    constructor() {
        this.pool = mysql.createPool({
            host: process.env.HOST,
            user: process.env.USER,
            password: process.env.PASS,
            database: process.env.DB,
            port: process.env.PORT,
            waitForConnections: true,
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
                user_role ENUM('user', 'admin') DEFAULT 'user
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

    query(sql, params=[], callback = (err, results) => {
        if (err) console.error("Query error:", err);
    }) {
        this.pool.getConnection((err, connection) => {
            if (err) {
                callback(err, null);
                return;
            }
            connection.query(sql, params, (queryErr, result) => {
                connection.release();
                if (queryErr) {
                    callback(queryErr, null);
                } else {
                    callback(null, result);
                }
            });
        });
    }
}

const db = new Database();
module.exports = db;