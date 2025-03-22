const mysql = require('mysql2/promise');
const config = require('../config');

const connectDB = async () => {
    try {
        console.log('Connecting to MySQL...');
        console.log(config);

        const connection = await mysql.createPool({
            host: config.MYSQL_HOST,
            user: config.MYSQL_USER,
            password: config.MYSQL_PASSWORD,
            database: config.MYSQL_DB,
            port: config.MYSQL_PORT,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        });

        // Verificar conexión real
        await connection.query('SELECT 1');

        console.log('✅ MySQL connected!');
        return connection;
    } catch (err) {
        console.error('❌ Error connecting to MySQL:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
