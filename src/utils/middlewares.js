const { validationResult } = require('express-validator');
const { requireAuth } = require('@clerk/express');

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

const requireApiAuth = (allowedRoles) => [
    requireAuth({ signInUrl: '/api/unauthorized' }),
    (req, res, next) => {
        // console.log('allowedRoles:', allowedRoles);
        if (!allowedRoles) return next(); // No se requiere rol específico

        // console.log('role:', req?.auth?.sessionClaims?.public_metadata?.role);
        const userRole = req?.auth?.sessionClaims?.public_metadata?.role;

        const rolesArray = Array.isArray(allowedRoles)
            ? allowedRoles.map((r) => r.toLowerCase())
            : [allowedRoles.toLowerCase()];

        if (!rolesArray.includes((userRole || '').toLowerCase())) {
            return res.status(403).json({ message: 'Forbidden: Insufficient role' });
        }

        next();
    },
];

const unauthorizedHandler = (req, res) => {
    res.status(401).json({ message: 'Unauthorized' });
};

module.exports = {
    errorHandler,
    notFound,
    validateParams,
    validateBody,
    requireApiAuth,
    unauthorizedHandler,
};
