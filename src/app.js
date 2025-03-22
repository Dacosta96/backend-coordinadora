const express = require('express');

const app = express();
const server = require('http').createServer(app);

const swaggerUi = require('swagger-ui-express');

const cors = require('cors');
const morgan = require('morgan');
const chalk = require('chalk');
const { clerkMiddleware } = require('@clerk/express');
const swaggerSpec = require('./docs/swagger-config');
const { errorHandler, notFound, unauthorizedHandler } = require('./utils/middlewares');
const connectDB = require('./utils/database');

console.log('starting...');
// creating the server

// enable the expess.json
app.use(express.json({ extended: true }));
app.use(cors());

// logger
app.use(
    morgan(chalk`:date[iso] {red :method} :url {green :status} {blue :response-time ms} - :res[content-length] length`)
);

// port the APP
const PORT = process.env.PORT || 4000;

// docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// add clerk middleware
app.use(clerkMiddleware());

// import routes
app.use('/api', require('./routes'));

// error handlers
app.get('/api/unauthorized', unauthorizedHandler);
app.use(errorHandler);
app.use(errorHandler);
app.use(notFound);

connectDB().then((db) => {
    app.locals.db = db; // share the connection with the routes
    return server.listen(PORT, () => {
        console.log(`The server is working in ${PORT}`);
        console.table({
            version: 'V1.0',
        });
    });
});
