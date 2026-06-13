import Requirement from '../models/Requirement.js';

// @desc    Get all active requirements (with filters)
// @route   GET /api/requirements
// @access  Private
export const getRequirements = async (req, res, next) => {
  try {
    const { cropType, minQty, maxQty } = req.query;
    let query = { status: 'active', expiryDate: { $gt: new Date() } };

    if (cropType) query.cropType = new RegExp(cropType, 'i');
    if (minQty) query.quantity = { ...query.quantity, $gte: Number(minQty) };
    if (maxQty) query.quantity = { ...query.quantity, $lte: Number(maxQty) };

    const requirements = await Requirement.find(query)
      .populate('distributorId', 'name isVerified phone')
      .sort('-createdAt')
      .limit(50);

    res.json({ requirements });
  } catch (error) {
    next(error);
  }
};

// @desc    Get distributor's own requirements
// @route   GET /api/requirements/my
// @access  Private (Distributor only)
export const getMyRequirements = async (req, res, next) => {
  try {
    const requirements = await Requirement.find({ distributorId: req.user._id })
      .sort('-createdAt');
    res.json({ requirements });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a requirement
// @route   POST /api/requirements
// @access  Private (Distributor only)
export const createRequirement = async (req, res, next) => {
  try {
    const { cropType, quantity, unit, offeredPrice, expiryDate, serviceRadius, description } = req.body;

    const requirement = await Requirement.create({
      distributorId: req.user._id,
      cropType,
      quantity,
      unit,
      offeredPrice,
      expiryDate,
      serviceRadius,
      description,
      location: req.user.location, // use distributor's location as base
    });

    res.status(201).json({ requirement });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a requirement
// @route   DELETE /api/requirements/:id
// @access  Private (Distributor only)
export const cancelRequirement = async (req, res, next) => {
  try {
    const requirement = await Requirement.findById(req.params.id);
    
    if (!requirement) {
      return res.status(404).json({ error: 'Requirement not found' });
    }
    
    if (requirement.distributorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    requirement.status = 'cancelled';
    await requirement.save();

    res.json({ success: true, message: 'Requirement cancelled' });
  } catch (error) {
    next(error);
  }
};
