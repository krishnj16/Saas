/*
  Wrapper db export so scripts run from repo root can load the same pool
  as backend/utils/db.js. Adjust path if your pool file is elsewhere.
*/
module.exports = require('../backend/utils/db');
