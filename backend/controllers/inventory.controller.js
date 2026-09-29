const Inventory = require('../models/Inventory');

const getInventory = async (req, res, next) => {
  try {
    const items = await Inventory.find().sort({ ingredient: 1 });
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (err) {
    next(err);
  }
};

const getLowStockAlerts = async (req, res, next) => {
  try {
    const items = await Inventory.find({
      $expr: { $lte: ['$quantity', '$minimumStock'] }
    });
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (err) {
    next(err);
  }
};

const addInventoryItem = async (req, res, next) => {
  try {
    const { ingredient, quantity, unit, minimumStock, cost } = req.body;
    const item = await Inventory.create({
      ingredient,
      quantity,
      unit,
      minimumStock,
      cost
    });
    res.status(201).json({ success: true, message: 'Ingredient added to inventory.', data: item });
  } catch (err) {
    next(err);
  }
};

const updateInventoryStock = async (req, res, next) => {
  try {
    const { quantity, delta, minimumStock, cost } = req.body;
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Ingredient not found.' });
    }

    if (quantity !== undefined) {
      item.quantity = Math.max(0, Number(quantity));
    } else if (delta !== undefined) {
      item.quantity = Math.max(0, item.quantity + Number(delta));
    }

    if (minimumStock !== undefined) item.minimumStock = Number(minimumStock);
    if (cost !== undefined) item.cost = Number(cost);
    item.lastRestocked = new Date();

    await item.save();

    res.status(200).json({ success: true, message: 'Inventory updated.', data: item });
  } catch (err) {
    next(err);
  }
};

const deleteInventoryItem = async (req, res, next) => {
  try {
    await Inventory.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Inventory item removed.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getInventory,
  getLowStockAlerts,
  addInventoryItem,
  updateInventoryStock,
  deleteInventoryItem
};
