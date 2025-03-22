const express = require('express');

const app = express();
const server = require('http').createServer(app);

const swaggerUi = require('swagger-ui-express');

const cors = require('cors');
const morgan = require('morgan');
const chalk = require('chalk');
const swaggerSpec = require('./docs/swagger-config');
const { errorHandler, notFound } = require('./utils/middlewares');
const connectDB = require('./utils/database');

// require('./utils/jobs');
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

console.log('swaggerSpec:', swaggerSpec.paths);

// docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// import routes
app.use('/api', require('./routes'));

// error handlers
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
