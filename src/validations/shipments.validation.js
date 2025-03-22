const Joi = require('joi');

const createShipmentSchema = Joi.object({
    userId: Joi.number().integer().required(),
    weight: Joi.number().positive().required(),
    dimensions: Joi.string().required(),
    productType: Joi.string().required(),
    destinationAddress: Joi.string().required(),
});

module.exports = {
    createShipmentSchema,
};
