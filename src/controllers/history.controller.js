const express = require('express');
const { createHistorySchema } = require('../validations/history.validator');
const { validateBody } = require('../utils/middlewares');
const HistoryService = require('../services/history.service');

const router = express.Router();

const service = new HistoryService();

/**
 * @swagger
 * /history:
 *   get:
 *     summary: Lista todos los envíos
 *     tags: [History]
 *     responses:
 *       200:
 *         description: Lista de envíos
 */
router.get('/', async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const shipments = await service.findAllHistories(db);
        res.status(200).json(shipments);
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /history:
 *   post:
 *     summary: Crea un nuevo historial de envío
 *     description: Agrega un nuevo registro al historial de estados de un envío.
 *     tags:
 *       - History
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shipment_id:
 *                 type: integer
 *                 example: 123
 *               status:
 *                 type: string
 *                 example: "en tránsito"
 *     responses:
 *       201:
 *         description: Historial de envío creado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 shipment_id:
 *                   type: integer
 *                   example: 123
 *                 status:
 *                   type: string
 *                   example: "en tránsito"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-03-23T12:00:00Z"
 *       400:
 *         description: Error en la validación de la solicitud.
 *       500:
 *         description: Error interno del servidor.
 */

router.post('/', validateBody(createHistorySchema), async (req, res, next) => {
    try {
        console.log('req.body:', req.body);
        const db = req.app.locals.db;
        const shipmentHistory = await service.createHistory(db, req.body);
        res.status(201).json(shipmentHistory);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
