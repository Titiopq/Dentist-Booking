const express = require('express');
const { createDentist, getDentists, getDentist } = require('../controllers/dentists');
const { protect, authorize } = require('../middleware/auth');
const appointments = require('./appointments');

const router = express.Router();

router.use('/:dentistId/appointments', appointments);
router.route('/').get(getDentists).post(protect, authorize('admin'), createDentist);
router.get('/:id', getDentist);

module.exports = router;
