const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const rideController = require('../controllers/rideController');

router.use(protect);

router.get('/', rideController.getRides);
router.get('/my', rideController.getMyRides);
router.get('/suggestions', rideController.getSuggestions);
router.post('/', rideController.createRide);
router.post('/sos', rideController.triggerSOS);
router.get('/:id', rideController.getRide);
router.get('/:id/matches', rideController.getMatches);
router.post('/:id/join', rideController.joinRide);
router.put('/:id/status', rideController.updateRideStatus);
router.put('/:id/passengers/:userId', rideController.respondToPassenger);
router.delete('/:id', rideController.cancelRide);

module.exports = router;
