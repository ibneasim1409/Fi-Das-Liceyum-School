const express = require('express');
const router = express.Router();
const { register, login, getUsers, updateUser, deleteUser, getSetupStatus, initialSetup } = require('../controllers/authController');
const { registerValidator, loginValidator } = require('../validators/authValidator');
const { auth, authorize } = require('../middlewares/auth');

router.post('/register', [auth, authorize('admin')], registerValidator, register);
router.post('/login', loginValidator, login);
router.get('/', [auth, authorize('admin')], getUsers);
router.patch('/:id', [auth, authorize('admin')], updateUser);
router.delete('/:id', [auth, authorize('admin')], deleteUser);


// Setup Wizard Routes
router.get('/setup-status', getSetupStatus);
router.post('/initial-setup', initialSetup);

module.exports = router;
