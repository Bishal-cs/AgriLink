import Offer from '../models/Offer.js';
import CropListing from '../models/CropListing.js';
import Order from '../models/Order.js';
import { createNotification } from '../services/notification.service.js';

// POST /api/offers
export const sendOffer = async (req, res, next) => {
  try {
    const { listingId, offeredPrice, quantity, pickupDate, notes } = req.body;

    const listing = await CropListing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    if (listing.status !== 'active') {
      return res.status(400).json({ error: 'Listing is no longer active' });
    }

    // Check for duplicate pending offer
    const existingOffer = await Offer.findOne({
      listingId,
      distributorId: req.user._id,
      status: 'pending',
    });
    if (existingOffer) {
      return res.status(409).json({ error: 'You already have a pending offer on this listing' });
    }

    const offer = await Offer.create({
      listingId,
      distributorId: req.user._id,
      offeredPrice,
      quantity,
      pickupDate,
      notes,
    });

    // Notify the farmer
    await createNotification(
      listing.farmerId,
      'offer',
      `You have a new offer from ${req.user.name} on your ${listing.cropType} listing`,
      offer._id
    );

    await offer.populate('distributorId', 'name phone isVerified');
    res.status(201).json({ message: 'Offer sent', offer });
  } catch (error) {
    next(error);
  }
};

// GET /api/listings/:id/offers
export const getOffersForListing = async (req, res, next) => {
  try {
    const listing = await CropListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    if (listing.farmerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const offers = await Offer.find({ listingId: req.params.id })
      .populate('distributorId', 'name phone email isVerified')
      .sort({ createdAt: -1 });

    res.json({ offers });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/offers/:id/accept
export const acceptOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id).populate('distributorId', 'name');
    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    const listing = await CropListing.findById(offer.listingId);
    if (!listing || listing.farmerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (offer.status !== 'pending') {
      return res.status(400).json({ error: 'Offer is not pending' });
    }

    // Accept this offer
    offer.status = 'accepted';
    await offer.save();

    // Mark listing as sold
    listing.status = 'sold';
    await listing.save();

    // Reject all other pending offers for this listing
    await Offer.updateMany(
      { listingId: listing._id, _id: { $ne: offer._id }, status: 'pending' },
      { status: 'rejected' }
    );

    // Create order
    const order = await Order.create({
      listingId: listing._id,
      farmerId: req.user._id,
      distributorId: offer.distributorId._id,
      offerId: offer._id,
      totalAmount: offer.offeredPrice * offer.quantity,
      status: 'confirmed',
      timeline: [{ status: 'confirmed', note: 'Order confirmed — offer accepted' }],
    });

    // Notify distributor
    await createNotification(
      offer.distributorId._id,
      'offer',
      `Your offer on ${listing.cropType} was accepted! Order #${order._id} created.`,
      order._id
    );

    res.json({ message: 'Offer accepted', offer, order });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/offers/:id/reject
export const rejectOffer = async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    const listing = await CropListing.findById(offer.listingId);
    if (!listing || listing.farmerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (offer.status !== 'pending') {
      return res.status(400).json({ error: 'Offer is not pending' });
    }

    offer.status = 'rejected';
    await offer.save();

    // Notify distributor
    await createNotification(
      offer.distributorId,
      'offer',
      `Your offer on ${listing.cropType} was not accepted.`,
      offer._id
    );

    res.json({ message: 'Offer rejected', offer });
  } catch (error) {
    next(error);
  }
};

// GET /api/offers/my — distributor's sent offers
export const getMyOffers = async (req, res, next) => {
  try {
    const offers = await Offer.find({ distributorId: req.user._id })
      .populate('listingId', 'cropType quantity unit expectedPrice status')
      .sort({ createdAt: -1 });
    res.json({ offers });
  } catch (error) {
    next(error);
  }
};
