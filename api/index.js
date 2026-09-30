const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

let app;
let initError = null;

try {
  const serverModule = require('../backend/server');
  app = serverModule.app;
} catch (err) {
  initError = {
    message: err.message,
    stack: err.stack,
    code: err.code
  };
}

module.exports = (req, res) => {
  if (initError) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      success: false,
      error: 'Drinko Backend Initialization Error',
      details: initError
    }, null, 2));
  }

  try {
    return app(req, res);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      success: false,
      error: 'Drinko Runtime Execution Error',
      message: err.message,
      stack: err.stack
    }, null, 2));
  }
};


