import StorageFacility from '../models/StorageFacility.js';

/**
 * Calculate Haversine distance between two [lng, lat] coordinate pairs
 * Returns distance in kilometers
 */
const haversineDistance = (coord1, coord2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const dLat = toRad(coord2[1] - coord1[1]);
  const dLon = toRad(coord2[0] - coord1[0]);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(coord1[1])) * Math.cos(toRad(coord2[1])) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Find and rank nearby cold storage facilities for a farmer
 * Score = (1/distance) × 0.5 + (1/pricePerTon) × 0.3 + (availableRatio) × 0.2
 */
export const matchStorage = async (farmerCoords, requestedQty, limit = 5) => {
  try {
    // Find available facilities with enough capacity
    const facilities = await StorageFacility.find({
      isAvailable: true,
    }).populate('ownerId', 'name phone email isVerified');

    const scored = facilities
      .map((facility) => {
        const availableCapacity = facility.totalCapacity - facility.usedCapacity;
        if (availableCapacity < requestedQty) return null;

        const distance = haversineDistance(farmerCoords, facility.location.coordinates);
        if (distance === 0) return null;

        const distanceScore = (1 / distance) * 0.5;
        const priceScore = facility.pricePerTon > 0 ? (1 / facility.pricePerTon) * 0.3 : 0;
        const capacityScore = (availableCapacity / facility.totalCapacity) * 0.2;
        const totalScore = distanceScore + priceScore + capacityScore;

        return {
          facility: facility.toObject(),
          distance: Math.round(distance * 10) / 10,
          availableCapacity,
          score: Math.round(totalScore * 10000) / 10000,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored;
  } catch (error) {
    console.error('❌ Storage matching failed:', error.message);
    throw error;
  }
};

/**
 * Match distributors for a crop listing based on type, quantity, and service radius
 * Sorted by offeredPrice descending (best price first)
 */
export const matchDistributors = async (listing) => {
  try {
    const Requirement = (await import('../models/Requirement.js')).default;

    // Find active requirements matching this crop type
    const requirements = await Requirement.find({
      status: 'active',
      cropType: new RegExp(`^${listing.cropType}$`, 'i'),
      expiryDate: { $gte: new Date() },
    }).populate('distributorId', 'name phone email isVerified location');

    const scored = requirements
      .filter((req) => {
        // Filter: quantity range includes listing quantity
        if (listing.quantity > req.quantity * 1.5) return false; // allow up to 1.5x overshoot

        // Filter: listing location is within distributor's service radius
        if (req.location?.coordinates && listing.location?.coordinates) {
          const distance = haversineDistance(
            listing.location.coordinates,
            req.location.coordinates
          );
          if (distance > req.serviceRadius) return false;
        }
        return true;
      })
      .map((req) => {
        const distance =
          req.location?.coordinates && listing.location?.coordinates
            ? haversineDistance(listing.location.coordinates, req.location.coordinates)
            : null;

        return {
          requirement: req.toObject(),
          distance: distance ? Math.round(distance * 10) / 10 : null,
          offeredPrice: req.offeredPrice,
        };
      })
      .sort((a, b) => b.offeredPrice - a.offeredPrice);

    return scored;
  } catch (error) {
    console.error('❌ Distributor matching failed:', error.message);
    throw error;
  }
};
