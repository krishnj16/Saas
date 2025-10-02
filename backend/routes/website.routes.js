const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const websiteController = require('../controllers/website.controller');

router.post('/', authenticate, websiteController.createWebsite);
router.get('/', authenticate, websiteController.getWebsites);
router.get('/:id', authenticate, websiteController.getWebsiteById);
router.patch('/:id', authenticate, websiteController.updateWebsite);
router.delete('/:id', authenticate, websiteController.deleteWebsite);

module.exports = router;
