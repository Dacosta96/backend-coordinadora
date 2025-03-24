const express = require('express');

const { validateBody } = require('../utils/middlewares');
const { createShipmentSchema } = require('../validations/shipments.validation');
const ShipmentsService = require('../services/shipments.service');
const cacheMiddleware = require('../utils/redis/cache-middleware');

const router = express.Router();

const service = new ShipmentsService();

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
 *               userId:
 *                 type: integer
 *               weight:
 *                 type: number
 *               dimensions:
 *                 type: string
 *               productType:
 *                 type: string
 *               destinationAddress:
 *                 type: object
 *                 properties:
 *                   regionCode:
 *                     type: string
 *                     example: "CO"
 *                   locality:
 *                     type: string
 *                     example: "Cajicá"
 *                   administrativeArea:
 *                     type: string
 *                     example: "Cundinamarca"
 *                   postalCode:
 *                     type: string
 *                     example: "250240"
 *                   addressLines:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["Carrera 6 #4-30"]
 *     responses:
 *       201:
 *         description: Envío creado exitosamente
 */
router.post('/', validateBody(createShipmentSchema), async (req, res, next) => {
    try {
        console.log('req.body:', req.body);
        const db = req.app.locals.db;
        const shipment = await service.createShipment(db, req.body);
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
        const shipments = await service.findAllShipments(db);
        res.status(200).json(shipments);
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /shipments/waiting:
 *   get:
 *     summary: Lista todos los envíos en estado WAITING
 *     tags: [Shipments]
 *     responses:
 *       200:
 *         description: Lista de envíos en estado WAITING
 */
router.get('/waiting', async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const shipments = await service.findWaitingShipments(db);
        res.status(200).json(shipments);
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /shipments/in-transit:
 *   get:
 *     summary: Lista todos los envíos en estado IN_TRANSIT
 *     tags: [Shipments]
 *     responses:
 *       200:
 *         description: Lista de envíos en estado IN_TRANSIT
 */
router.get('/in-transit', async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const shipments = await service.findInTransitShipments(db);
        res.status(200).json(shipments);
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /shipments/routes:
 *   get:
 *     summary: Lista todas las rutas
 *     tags: [Shipments]
 *     responses:
 *       200:
 *         description: Lista de rutas
 */
router.get('/routes', async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const routes = await service.findAllRoutes(db);
        res.status(200).json(routes);
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /shipments/indicators:
 *   get:
 *     summary: Obtiene indicadores de envíos
 *     tags: [Shipments]
 *     responses:
 *       200:
 *         description: Retorna el total de envíos, el conteo por estado y la suma del peso total.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalShipments:
 *                       type: integer
 *                       example: 150
 *                     statusCounts:
 *                       type: object
 *                       example: { "Pendiente": 40, "En tránsito": 80, "Entregado": 30 }
 *                     totalWeight:
 *                       type: number
 *                       example: 1200.5
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/indicators', async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const indicators = await service.getShipmentIndicators(db);
        res.status(200).json(indicators);
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /shipments/daily-count:
 *   get:
 *     summary: Obtiene el total de envíos por día
 *     tags: [Shipments]
 *     responses:
 *       200:
 *         description: Retorna el número total de envíos agrupados por fecha.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       shipmentDate:
 *                         type: string
 *                         format: date
 *                         example: "2025-03-22"
 *                       totalShipments:
 *                         type: integer
 *                         example: 15
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/daily-count', async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const dailyCounts = await service.getDailyShipmentCounts(db);
        res.status(200).json(dailyCounts);
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /shipments/{id}:
 *   get:
 *     summary: Obtiene un envío por ID y user_id (ambos obligatorios)
 *     tags: [Shipments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalle del envío
 *       400:
 *         description: Faltan parámetros requeridos
 */
router.get('/:id', async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const { id } = req.params;
        // eslint-disable-next-line camelcase
        const { user_id } = req.query;

        // Validar que ambos parámetros sean proporcionados
        // eslint-disable-next-line camelcase
        if (!id || !user_id) {
            return res.status(400).json({ error: 'id y user_id son obligatorios' });
        }

        const shipment = await service.findShipment(db, {
            id: Number(id),
            userId: Number(user_id),
        });

        res.status(200).json(shipment);
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /shipments/user/{user_id}:
 *   get:
 *     summary: Obtiene envíos por user_id
 *     tags: [Shipments]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de envíos del usuario
 */
router.get('/user/:user_id', async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const shipments = await service.findShipmentByUserId(db, Number(req.params.user_id));
        res.status(200).json(shipments);
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /shipments/{id}/details:
 *   get:
 *     summary: Obtiene un envío por ID con detalles
 *     tags: [Shipments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalle del envío con detalles
 */
router.get(
    '/:id/details',
    cacheMiddleware((req) => `shipment-status:${req.params.id}`, 120),
    async (req, res, next) => {
        try {
            const db = req.app.locals.db;
            const shipment = await service.findShipmentByIdDetails(db, Number(req.params.id));
            res.status(200).json(shipment);
        } catch (err) {
            next(err);
        }
    }
);
/**
 * @swagger
 * /shipments/{id}/mark_delivered:
 *   put:
 *     summary: Marca un envío como entregado
 *     tags: [Shipments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Envío marcado como entregado
 */
router.put('/:id/mark_delivered', async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const shipment = await service.markShipmentAsDelivered(db, Number(req.params.id), 'DELIVERED');
        res.status(200).json(shipment);
    } catch (err) {
        next(err);
    }
});
/**
 * @swagger
 * /shipments/{id}:
 *   put:
 *     summary: Actualiza el estado de un envío existente
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
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estado del envío actualizado
 *       404:
 *         description: Envío no encontrado
 */

router.put('/:id', async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ message: 'El campo "status" es requerido' });
        }

        const db = req.app.locals.db;
        const shipment = await service.updateShipmentState(db, Number(req.params.id), status);
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
        await service.deleteShipment(db, Number(req.params.id));
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /shipments/assignment-route:
 *   post:
 *     summary: Asigna una ruta a un envío
 *     tags: [Shipments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shipmentId:
 *                 type: integer
 *               routeId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Asignación creada exitosamente
 */
router.post('/assignment-route', async (req, res, next) => {
    try {
        console.log('req.body:', req.body);
        const db = req.app.locals.db;
        const assignment = await service.createAssignment(db, req.body);
        res.status(201).json(assignment);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
