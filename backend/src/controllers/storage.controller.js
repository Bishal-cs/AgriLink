import StorageFacility from '../models/StorageFacility.js';

// GET /api/storage
export const getStorageFacilities = async (req, res, next) => {
  try {
    const { minCapacity, maxPrice, available, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (available !== undefined) filter.isAvailable = available === 'true';
    if (maxPrice) filter.pricePerTon = { $lte: Number(maxPrice) };
    if (minCapacity) {
      filter.$expr = {
        $gte: [{ $subtract: ['$totalCapacity', '$usedCapacity'] }, Number(minCapacity)],
      };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [facilities, total] = await Promise.all([
      StorageFacility.find(filter)
        .populate('ownerId', 'name phone isVerified')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      StorageFacility.countDocuments(filter),
    ]);

    res.json({
      facilities,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/storage
export const createFacility = async (req, res, next) => {
  try {
    const { name, totalCapacity, pricePerTon, location, address, features, description } = req.body;

    const facility = await StorageFacility.create({
      ownerId: req.user._id,
      name,
      totalCapacity,
      pricePerTon,
      location: location || req.user.location,
      address,
      features: features || [],
      description,
    });

    res.status(201).json({ message: 'Facility created', facility });
  } catch (error) {
    next(error);
  }
};

// PUT /api/storage/:id
export const updateFacility = async (req, res, next) => {
  try {
    const facility = await StorageFacility.findById(req.params.id);
    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' });
    }
    if (facility.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const allowedFields = ['name', 'totalCapacity', 'pricePerTon', 'location', 'address', 'isAvailable', 'features', 'description'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        facility[field] = req.body[field];
      }
    }

    await facility.save();
    res.json({ message: 'Facility updated', facility });
  } catch (error) {
    next(error);
  }
};

// GET /api/storage/my — owner's own facilities
export const getMyFacilities = async (req, res, next) => {
  try {
    const facilities = await StorageFacility.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
    res.json({ facilities });
  } catch (error) {
    next(error);
  }
};
