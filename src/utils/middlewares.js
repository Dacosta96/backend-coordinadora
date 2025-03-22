const { validationResult } = require('express-validator');

const errorHandler = (err, req, res, next) => {
    const statusCode = err.status || 500;
    const message = err.message || 'Custom Internal Server Error';

    res.status(statusCode).json({
        success: false,
        message,
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
    errorHandler,
    notFound,
    validateParams,
    validateBody,
};
