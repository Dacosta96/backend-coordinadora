const { validationResult } = require('express-validator');

const logErrors = (err, req, res, next) => {
    if (err.stack) console.log(err.stack);
    else console.log(err);
    next(err);
};

const errorHandler = (err, req, res, next) => {
    res.status(500).json({
        message: 'Custom error response',
        error: err.message,
    });
};

const notFound = (req, res, next) => {
    res.status(500).json({
        message: 'Not found',
    });
};

// eslint-disable-next-line consistent-return
const validateParams = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
};

const validateBody = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }
    next();
};

module.exports = {
    logErrors,
    errorHandler,
    notFound,
    validateParams,
    validateBody,
};
