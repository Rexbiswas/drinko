const express = require('express');
const router = express.Router();
const {
  getTables,
  getTableByNumber,
  createTable,
  updateTableStatus,
  deleteTable
} = require('../controllers/table.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/adminAuth');

router.get('/', getTables);
router.get('/:tableNumber', getTableByNumber);

router.post('/', protect, authorize('admin', 'staff'), createTable);
router.put('/:id/status', protect, authorize('admin', 'staff'), updateTableStatus);
router.delete('/:id', protect, authorize('admin'), deleteTable);

module.exports = router;
