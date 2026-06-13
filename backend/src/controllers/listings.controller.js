import CropListing from '../models/CropListing.js';

// GET /api/listings
export const getListings = async (req, res, next) => {
  try {
    const { cropType, minQty, maxQty, minPrice, maxPrice, urgency, status, page = 1, limit = 20 } = req.query;

    const filter = { status: status || 'active' };

    if (cropType) filter.cropType = new RegExp(cropType, 'i');
    if (minQty || maxQty) {
      filter.quantity = {};
      if (minQty) filter.quantity.$gte = Number(minQty);
      if (maxQty) filter.quantity.$lte = Number(maxQty);
    }
    if (minPrice || maxPrice) {
      filter.expectedPrice = {};
      if (minPrice) filter.expectedPrice.$gte = Number(minPrice);
      if (maxPrice) filter.expectedPrice.$lte = Number(maxPrice);
    }
    if (urgency) filter.urgency = urgency;

    const skip = (Number(page) - 1) * Number(limit);
    const [listings, total] = await Promise.all([
      CropListing.find(filter)
        .populate('farmerId', 'name phone isVerified location address')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      CropListing.countDocuments(filter),
    ]);

    res.json({
      listings,
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

// GET /api/listings/:id
export const getListingById = async (req, res, next) => {
  try {
    const listing = await CropListing.findById(req.params.id).populate(
      'farmerId',
      'name phone email isVerified location address profileImage'
    );
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    res.json({ listing });
  } catch (error) {
    next(error);
  }
};

// POST /api/listings
export const createListing = async (req, res, next) => {
  try {
    const { cropType, quantity, unit, expectedPrice, harvestDate, urgency, location, description } = req.body;

    // Handle uploaded images
    const imageUrls = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];

    const listing = await CropListing.create({
      farmerId: req.user._id,
      cropType,
      quantity,
      unit,
      expectedPrice,
      harvestDate,
      urgency,
      imageUrls,
      location: location || req.user.location,
      description,
    });

    await listing.populate('farmerId', 'name phone isVerified');

    res.status(201).json({ message: 'Listing created', listing });
  } catch (error) {
    next(error);
  }
};

// PUT /api/listings/:id
export const updateListing = async (req, res, next) => {
  try {
    const listing = await CropListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    if (listing.farmerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this listing' });
    }

    const allowedFields = ['cropType', 'quantity', 'unit', 'expectedPrice', 'harvestDate', 'urgency', 'status', 'description', 'location'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        listing[field] = req.body[field];
      }
    }

    if (req.files && req.files.length > 0) {
      listing.imageUrls = req.files.map((f) => `/uploads/${f.filename}`);
    }

    await listing.save();
    res.json({ message: 'Listing updated', listing });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/listings/:id
export const deleteListing = async (req, res, next) => {
  try {
    const listing = await CropListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    if (listing.farmerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this listing' });
    }

    await CropListing.findByIdAndDelete(req.params.id);
    res.json({ message: 'Listing deleted' });
  } catch (error) {
    next(error);
  }
};

// GET /api/listings/my — get farmer's own listings
export const getMyListings = async (req, res, next) => {
  try {
    const listings = await CropListing.find({ farmerId: req.user._id }).sort({ createdAt: -1 });
    res.json({ listings });
  } catch (error) {
    next(error);
  }
};
