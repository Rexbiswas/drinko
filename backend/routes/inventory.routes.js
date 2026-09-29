const express = require('express');
const router = express.Router();
const {
  getInventory,
  getLowStockAlerts,
  addInventoryItem,
  updateInventoryStock,
  deleteInventoryItem
} = require('../controllers/inventory.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/adminAuth');

router.use(protect, authorize('admin', 'staff'));

router.route('/')
  .get(getInventory)
  .post(addInventoryItem);

router.get('/low-stock', getLowStockAlerts);

router.route('/:id')
  .put(updateInventoryStock)
  .delete(deleteInventoryItem);

module.exports = router;
