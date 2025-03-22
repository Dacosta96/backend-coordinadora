const Joi = require('joi');

const createUserSchema = Joi.object({
    name: Joi.string().max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string()
        .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[\\W_]).{8,}$'))
        .message(
            'Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character'
        )
        .required(),
    role: Joi.string().valid('user', 'admin').default('user'),
});

module.exports = { createUserSchema };
