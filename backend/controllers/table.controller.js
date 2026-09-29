const Table = require('../models/Table');

// @desc    Get all active tables
// @route   GET /api/tables
// @access  Public
const getTables = async (req, res, next) => {
  try {
    const tables = await Table.find().sort({ tableNumber: 1 });
    res.status(200).json({ success: true, count: tables.length, data: tables });
  } catch (err) {
    next(err);
  }
};

// @desc    Get table details by tableNumber (for QR scanner)
// @route   GET /api/tables/:tableNumber
// @access  Public
const getTableByNumber = async (req, res, next) => {
  try {
    const { tableNumber } = req.params;
    const table = await Table.findOne({ tableNumber: tableNumber.trim() });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: `Table #${tableNumber} not found.`
      });
    }

    res.status(200).json({
      success: true,
      data: table
    });
  } catch (err) {
    next(err);
  }
};

// Admin table endpoints
const createTable = async (req, res, next) => {
  try {
    const { tableNumber, capacity, section } = req.body;
    const table = await Table.create({
      tableNumber,
      capacity,
      section,
      qrCodeUrl: `/pages/order.html?table=${encodeURIComponent(tableNumber)}`
    });
    res.status(201).json({ success: true, data: table });
  } catch (err) {
    next(err);
  }
};

const updateTableStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const table = await Table.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.status(200).json({ success: true, data: table });
  } catch (err) {
    next(err);
  }
};

const deleteTable = async (req, res, next) => {
  try {
    await Table.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Table removed.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTables,
  getTableByNumber,
  createTable,
  updateTableStatus,
  deleteTable
};
