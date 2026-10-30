// const mysql = require("mysql2/promise");
//
// const pool = mysql.createPool({
//     host: process.env.DB_HOST,
//     port: Number(process.env.DB_PORT || 3306),
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0
// });
//
// module.exports = pool;

const sql = require("mssql");
require("dotenv").config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 1433),
    database: process.env.DB_NAME || "quiz_system",
    options: {
        encrypt: false,
        trustServerCertificate: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

const pool = new sql.ConnectionPool(config);

const poolConnect = pool.connect()
    .then(() => {
        console.log("Connected to SQL Server successfully!");
        return pool;
    })
    .catch((error) => {
        console.error("SQL Server connection failed:", error);
        throw error;
    });

module.exports = { sql, pool, poolConnect };