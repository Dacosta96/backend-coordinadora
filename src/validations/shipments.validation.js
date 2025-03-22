const Joi = require('joi');

const createShipmentSchema = Joi.object({
    user_id: Joi.number().integer().required(),
    weight: Joi.number().positive().required(),
    dimensions: Joi.string().required(),
    product_type: Joi.string().required(),
    destination_address: Joi.string().required(),
});

module.exports = {
    createShipmentSchema,
};
