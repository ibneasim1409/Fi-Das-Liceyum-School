const express = require('express');
const router = express.Router();
const challanController = require('../controllers/challanController');
const { auth, authorize } = require('../middlewares/auth');

router.get('/', auth, challanController.getChallans);
router.post('/generate-monthly', [auth, authorize('admin', 'hr')], challanController.generateMonthlyChallans);
router.post('/void-batch', [auth, authorize('admin')], challanController.voidBatch);
router.get('/:id', auth, challanController.getChallan);
router.get('/admission/:admissionId', auth, challanController.getAdmissionChallan);
router.patch('/:id', auth, challanController.updateChallan);

module.exports = router;
