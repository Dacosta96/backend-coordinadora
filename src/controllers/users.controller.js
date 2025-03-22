const express = require('express');
const UsersService = require('../services/users.service');

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

module.exports = router;
