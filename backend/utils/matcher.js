/**
 * DSA-based Ride Matching Algorithm
 *
 * Uses a graph-based greedy matching with scoring:
 * - Proximity score (pickup distance)
 * - Time compatibility score
 * - Route overlap score
 *
 * Complexity: O(n^2) for n active rides — acceptable for campus scale
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Haversine formula — great-circle distance between two lat/lng points
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Time compatibility: returns 1.0 if within 15 min, scales down to 0 at 60 min
 */
function timeScore(t1, t2) {
  const diffMin = Math.abs(new Date(t1) - new Date(t2)) / 60000;
  if (diffMin <= 15) return 1.0;
  if (diffMin >= 60) return 0;
  return 1 - (diffMin - 15) / 45;
}

/**
 * Proximity score: returns 1.0 if within 0.5 km, scales to 0 at 5 km
 */
function proximityScore(dist) {
  if (dist <= 0.5) return 1.0;
  if (dist >= 5) return 0;
  return 1 - (dist - 0.5) / 4.5;
}

/**
 * Destination overlap: checks if destinations are in same direction
 */
function destinationScore(req, offer) {
  const dist = haversineDistance(
    req.destination.lat, req.destination.lng,
    offer.destination.lat, offer.destination.lng
  );
  if (dist <= 1) return 1.0;
  if (dist >= 5) return 0;
  return 1 - dist / 5;
}

/**
 * Compute composite match score [0..1] between a ride request and an offer
 */
function computeMatchScore(request, offer) {
  if (!offer.availableSeats || offer.availableSeats < 1) return 0;
  if (offer.status !== 'active') return 0;

  const pickupDist = haversineDistance(
    request.pickup.lat, request.pickup.lng,
    offer.pickup.lat, offer.pickup.lng
  );

  const pScore = proximityScore(pickupDist);        // 40% weight
  const tScore = timeScore(request.departureTime, offer.departureTime); // 40% weight
  const dScore = destinationScore(request, offer);  // 20% weight

  return 0.4 * pScore + 0.4 * tScore + 0.2 * dScore;
}

/**
 * Main matching function
 * @param {Object} rideRequest - The ride request to find matches for
 * @param {Array} availableOffers - Active ride offers from the database
 * @param {number} topN - Number of top matches to return
 * @returns {Array} Sorted array of { ride, score, pickupDistance }
 */
function findMatches(rideRequest, availableOffers, topN = 5) {
  if (!availableOffers || availableOffers.length === 0) return [];

  const scored = availableOffers
    .filter((offer) => offer._id.toString() !== rideRequest._id?.toString())
    .map((offer) => {
      const score = computeMatchScore(rideRequest, offer);
      const pickupDistance = haversineDistance(
        rideRequest.pickup.lat, rideRequest.pickup.lng,
        offer.pickup.lat, offer.pickup.lng
      );
      return { ride: offer, score: parseFloat(score.toFixed(3)), pickupDistanceKm: parseFloat(pickupDistance.toFixed(2)) };
    })
    .filter((m) => m.score > 0.1) // Filter out very poor matches
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  return scored;
}

/**
 * Fare estimation based on distance and vehicle type.
 * Base rate + per-km rate. Returns total and per-person fare.
 */
const FARE_RATES = {
  bike: { base: 10, perKm: 5 },
  auto: { base: 15, perKm: 8 },
  car:  { base: 20, perKm: 12 },
  bus:  { base: 10, perKm: 3 },
};

function estimateFare(pickupLat, pickupLng, destLat, destLng, vehicleType = 'auto', totalSeats = 1) {
  const distanceKm = haversineDistance(pickupLat, pickupLng, destLat, destLng);
  const rates = FARE_RATES[vehicleType] || FARE_RATES.auto;
  const totalFare = Math.round(rates.base + rates.perKm * distanceKm);
  const riders = Math.max(1, totalSeats);
  const farePerPerson = Math.round(totalFare / riders);
  return {
    distanceKm: parseFloat(distanceKm.toFixed(2)),
    estimatedFare: totalFare,
    farePerPerson,
  };
}

module.exports = { findMatches, computeMatchScore, haversineDistance, estimateFare };
