const express = require('express');
const router = express.Router();

const { home } = require('../controllers/home');


router.get('/', home);
//router.get('/users', home);

module.exports = router;