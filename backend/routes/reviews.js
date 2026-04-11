const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const reviewController = require('../controllers/reviewController');

router.use(protect);

router.post('/', reviewController.createReview);
router.get('/user/:userId', reviewController.getUserReviews);

module.exports = router;
