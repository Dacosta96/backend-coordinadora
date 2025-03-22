const Joi = require('joi');

const createShipmentSchema = Joi.object({
    userId: Joi.number().integer().required(),
    weight: Joi.number().positive().required(),
    dimensions: Joi.string().required(),
    productType: Joi.string().required(),
    destinationAddress: Joi.object({
        regionCode: Joi.string().length(2).required(),
        locality: Joi.string().required(),
        administrativeArea: Joi.string().required(),
        postalCode: Joi.string().optional(),
        addressLines: Joi.array().items(Joi.string()).min(1).required(),
    }).required(),
});

module.exports = {
    createShipmentSchema,
};
