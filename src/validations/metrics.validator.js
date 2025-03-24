const Joi = require('joi');

const createMetricsSchema = Joi.object({
    shipment_id: Joi.number().integer().required(),
    delivery_time_minutes: Joi.number().required(),
});

module.exports = {
    createMetricsSchema,
};
