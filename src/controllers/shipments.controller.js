const express = require('express');

const UsersService = require('../services/users.service');
const { validateBody } = require('../utils/middlewares');
const { createShipmentSchema } = require('../validations/shipments.validation');

const router = express.Router();

const service = new UsersService();

/**
 * @swagger
 * /shipments:
 *   post:
 *     summary: Crea un nuevo envío
 *     tags: [Shipments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *               weight:
 *                 type: number
 *               dimensions:
 *                 type: string
 *               product_type:
 *                 type: string
 *               destination_address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Envío creado exitosamente
 */
router.post('/', validateBody(createShipmentSchema), async (req, res, next) => {
    try {
        console.log('req.body:', req.body);
        const db = req.app.locals.db;
        const shipment = await req.app.locals.services.shipment.create(db, req.body);
        res.status(201).json(shipment);
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /shipments:
 *   get:
 *     summary: Lista todos los envíos
 *     tags: [Shipments]
 *     responses:
 *       200:
 *         description: Lista de envíos
 */
router.get('/', async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const shipments = await req.app.locals.services.shipment.findAll(db);
        res.status(200).json(shipments);
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /shipments/{id}:
 *   get:
 *     summary: Obtiene un envío por ID
 *     tags: [Shipments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalle del envío
 */
router.get('/:id', async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const shipment = await req.app.locals.services.shipment.findById(db, Number(req.params.id));
        res.status(200).json(shipment);
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /shipments/{id}:
 *   put:
 *     summary: Actualiza un envío existente
 *     tags: [Shipments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               weight:
 *                 type: number
 *               dimensions:
 *                 type: string
 *               product_type:
 *                 type: string
 *               destination_address:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Envío actualizado
 */
router.put('/:id', async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const shipment = await req.app.locals.services.shipment.update(db, Number(req.params.id), req.body);
        res.status(200).json(shipment);
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /shipments/{id}:
 *   delete:
 *     summary: Elimina un envío por ID
 *     tags: [Shipments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Envío eliminado
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        await req.app.locals.services.shipment.remove(db, Number(req.params.id));
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

module.exports = router;
