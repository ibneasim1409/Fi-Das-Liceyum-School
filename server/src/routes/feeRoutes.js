const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
const { auth, authorize } = require('../middlewares/auth');

router.use(auth);

router.route('/')
    .get(feeController.getFeeStructures)
    .post(authorize('admin', 'hr'), feeController.createFeeStructure);

router.route('/:id')
    .put(authorize('admin', 'hr'), feeController.updateFeeStructure)
    .delete(authorize('admin', 'hr'), feeController.deleteFeeStructure);

module.exports = router;
