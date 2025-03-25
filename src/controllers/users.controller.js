const express = require('express');
const UsersService = require('../services/users.service');
const { validateBody } = require('../utils/middlewares');
const { createUserSchema } = require('../validations/users.validation');
const cacheMiddleware = require('../utils/redis/cache-middleware');

const router = express.Router();

const service = new UsersService();

/**
 * @swagger
 * /users/ping:
 *   get:
 *     summary: Verifica si el servicio de usuarios está funcionando
 *     tags: [Usuarios]
 *     responses:
 *       200:
 *         description: Respuesta exitosa con mensaje de estado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
router.get('/ping', async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const data = await service.ping(db);
        res.status(200).json(data);
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /users/email/{email}:
 *   get:
 *     summary: Obtiene un usuario por email
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalle del usuario
 *       404:
 *         description: Usuario no encontrado
 */
router.get(
    '/email/:email',
    cacheMiddleware((req) => `find-user:${req.params.email}`, 5),
    async (req, res, next) => {
        try {
            const db = req.app.locals.db;
            const user = await service.findUserByEmail(db, req.params.email);
            if (!user) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }
            res.status(200).json(user);
        } catch (err) {
            next(err);
        }
    }
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Obtiene un usuario por ID
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalle del usuario
 */
router.get('/:id', async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const shipment = await service.findUserById(db, Number(req.params.id));
        res.status(200).json(shipment);
    } catch (err) {
        next(err);
    }
});

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Crea un nuevo usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 clerkId:
 *                   type: string
 *                 role:
 *                   type: string
 *                 createdAt:
 *                   type: string
 */
router.post('/', validateBody(createUserSchema), async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const data = await service.create(db, req.body);
        res.status(201).json(data);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
