import mysql from 'mysql2/promise';

// This is ready to wire up for the real database connections, 
// based on schema.sql, but not actively used for dashboard mock data yet.
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'iot_dashboard',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export default pool;
