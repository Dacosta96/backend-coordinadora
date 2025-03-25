const express = require('express');
const { requireApiAuth } = require('./utils/middlewares');
const cacheMiddleware = require('./utils/redis/cache-middleware');

const router = express.Router();

router.use('/users', require('./controllers/users.controller'));
router.use('/shipments', require('./controllers/shipments.controller'));
router.use('/history', require('./controllers/history.controller'));

router.get('/public', async (req, res, next) => {
    res.json({ message: 'Hello from public' });
});
router.get('/protected', requireApiAuth(['USER', 'ADMIN']), async (req, res, next) => {
    res.json({ message: 'Hello from protected', auth: req.auth, user: req.user });
});
router.get(
    '/cache-test',
    cacheMiddleware((req) => `find-user:${req.params.email}`, 5),
    async (req, res, next) => {
        // fake time consuming operation
        await new Promise((resolve) => setTimeout(resolve, 2000));
        res.json({ message: 'Hello from cache test' });
    }
);

module.exports = router;
