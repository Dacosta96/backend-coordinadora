const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API de Logística - Coordinadora',
            version: '1.0.0',
            description: 'Documentación técnica de la API de envíos, usuarios y rutas',
        },
        servers: [
            {
                url: 'http://localhost:4000/api',
            },
        ],
    },
    apis: [path.join(__dirname, '../controllers/**/*.js')],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;
