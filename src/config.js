require('dotenv').config();

const config = {
    MYSQL_HOST: process.env.MYSQL_HOST,
    MYSQL_USER: process.env.MYSQL_USER,
    MYSQL_PASSWORD: process.env.MYSQL_PASSWORD,
    MYSQL_DB: process.env.MYSQL_DB,
    MYSQL_PORT: process.env.MYSQL_PORT,
};

module.exports = config;
