require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
    'host': process.env.DB_HOST || 'localhost',
    'user': process.env.DB_USER || 'root',
    'password': process.env.DB_PASSWORD || 'root',
    'database': process.env.DB_NAME || 'estoque',
    'port': Number(process.env.DB_PORT) || 3307,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise();

module.exports = pool;