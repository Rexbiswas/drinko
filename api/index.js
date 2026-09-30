const path = require('path');
const dotenv = require('dotenv');

// Load environment variables if running locally
dotenv.config({ path: path.join(__dirname, '../.env') });

const { app } = require('../backend/server');

module.exports = app;

