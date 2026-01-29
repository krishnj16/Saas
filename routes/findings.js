const express = require('express');
const router = express.Router();
const findingController = require('../controllers/finding.controller');

let authenticate;
try {
  const auth = require('../middleware/auth');
  if (typeof auth === 'function') authenticate = auth;
  else if (auth.authenticate) authenticate = auth.authenticate;
  else throw new Error("Auth middleware unknown");
} catch (e) {
  console.error("Auth load failed:", e.message);
  authenticate = (req, res, next) => res.status(500).json({ error: "Auth config error" });
}

router.get('/', authenticate, findingController.getFindings);
router.get('/:id', authenticate, findingController.getFindingById);
router.post('/:id/confirm', authenticate, findingController.confirmVulnerability);

module.exports = router;