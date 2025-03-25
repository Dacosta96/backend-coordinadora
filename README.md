# Gestión de Envíos y Rutas Logísticas - Backend

Este es el backend del proyecto **Gestión de Envíos y Rutas Logísticas**, desarrollado con **Node.js** y **Express**. Está diseñado para manejar la lógica del negocio, autenticación y almacenamiento de datos. 

## Tecnologías principales
- **Express.js**: Framework para la creación de APIs REST.
- **MySQL**: Base de datos relacional utilizada para almacenar la información.
- **Redis**: Cache en memoria para mejorar el rendimiento.
- **AWS SDK**: Utilizado para el envío de correos electrónicos mediante **SES (Simple Email Service)**.
- **Clerk**: Gestión de autenticación y validación de usuarios.
- **Google Address Validation API**: Para validar direcciones de envío.
- **Swagger**: Generación de documentación para la API.

## Scripts disponibles
- `npm start`: Inicia el servidor en producción.
- `npm run dev`: Inicia el servidor en modo desarrollo con **nodemon** y validación ESLint.
- `npm run lint`: Ejecuta **ESLint** para analizar el código.
- `npm test`: Ejecuta las pruebas con **Jest**.

## Dependencias principales
- `express`: Framework para la API.
- `mysql2`: Cliente para interactuar con la base de datos MySQL.
- `redis`: Cliente para el almacenamiento en caché.
- `aws-sdk`: Librería para la integración con AWS.
- `nodemailer`: Envío de correos electrónicos.
- `@clerk/clerk-sdk-node`: Gestión de autenticación y usuarios.
- `cors`: Habilitación de CORS para peticiones HTTP.
- `dotenv`: Manejo de variables de entorno.
- `swagger-jsdoc` y `swagger-ui-express`: Documentación de la API.

Este backend se comunica con el frontend de **Gestión de Envíos y Rutas Logísticas** y maneja todas las solicitudes de los usuarios, validaciones de direcciones, gestión de envíos y notificaciones por correo electrónico.

