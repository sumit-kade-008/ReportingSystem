// server/src/utils/geoUtils.js
// Provides mathematical distance calculation (Haversine formula) for duplicate detection.

/**
 * Calculates great-circle distance between two GPS coordinates in meters.
 * 
 * VIVA EXPLANATION:
 * The Haversine formula calculates the spherical distance between two points
 * given their latitude and longitude coordinates.
 * Radius of Earth (R) ≈ 6,371,000 meters.
 * 
 * @param {number} lat1 - Latitude of Point 1
 * @param {number} lon1 - Longitude of Point 1
 * @param {number} lat2 - Latitude of Point 2
 * @param {number} lon2 - Longitude of Point 2
 * @returns {number} Distance in meters
 */
const calculateDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance);
};

module.exports = { calculateDistanceInMeters };
