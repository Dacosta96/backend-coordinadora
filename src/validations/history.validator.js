const Joi = require('joi');

const createHistorySchema = Joi.object({
    shipment_id: Joi.number().integer().required(),
    status: Joi.string().required(),
});

module.exports = {
    createHistorySchema,
};
