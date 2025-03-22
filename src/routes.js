const express = require('express');
// const { jwtCheck } = require('../utils/jwtUtil');

const router = express.Router();

router.use('/users', require('./controllers/users.controller'));
router.use('/shipments', require('./controllers/shipments.controller'));

module.exports = router;
