const express = require('express');
const { requireApiAuth } = require('./utils/middlewares');

const router = express.Router();

router.use('/users', require('./controllers/users.controller'));
router.use('/shipments', require('./controllers/shipments.controller'));

router.get('/public', async (req, res, next) => {
    res.json({ message: 'Hello from public' });
});
router.get('/protected', requireApiAuth(['USER', 'ADMIN']), async (req, res, next) => {
    res.json({ message: 'Hello from protected', auth: req.auth, user: req.user });
});

module.exports = router;
