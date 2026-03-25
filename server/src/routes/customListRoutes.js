const express = require('express');
const router = express.Router();
const { getList, updateList } = require('../controllers/customListController');
const { auth, authorize } = require('../middlewares/auth');

router.route('/:listId')
    .get(auth, getList)
    .put(auth, authorize('admin'), updateList);

module.exports = router;
