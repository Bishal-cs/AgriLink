import Booking from '../models/Booking.js';
import StorageFacility from '../models/StorageFacility.js';
import { createNotification } from '../services/notification.service.js';

// POST /api/bookings
export const createBooking = async (req, res, next) => {
  try {
    const { facilityId, quantity, startDate, endDate } = req.body;

    const facility = await StorageFacility.findById(facilityId);
    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' });
    }
    if (!facility.isAvailable) {
      return res.status(400).json({ error: 'Facility is currently unavailable' });
    }

    const availableCapacity = facility.totalCapacity - facility.usedCapacity;
    if (quantity > availableCapacity) {
      return res.status(400).json({ error: `Insufficient capacity. Available: ${availableCapacity} tons` });
    }

    // Calculate cost
    const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    const totalCost = days * quantity * facility.pricePerTon;

    const booking = await Booking.create({
      facilityId,
      bookerId: req.user._id,
      quantity,
      startDate,
      endDate,
      totalCost,
    });

    // Notify facility owner
    await createNotification(
      facility.ownerId,
      'booking',
      `New storage booking request from ${req.user.name} for ${quantity} tons`,
      booking._id
    );

    res.status(201).json({ message: 'Booking request sent', booking });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/bookings/:id/accept
export const acceptBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const facility = await StorageFacility.findById(booking.facilityId);
    if (facility.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ error: 'Booking is not pending' });
    }

    booking.status = 'confirmed';
    await booking.save();

    // Update facility used capacity
    facility.usedCapacity += booking.quantity;
    if (facility.usedCapacity >= facility.totalCapacity) {
      facility.isAvailable = false;
    }
    await facility.save();

    // Notify booker
    await createNotification(
      booking.bookerId,
      'booking',
      `Storage booking confirmed at ${facility.name}`,
      booking._id
    );

    res.json({ message: 'Booking confirmed', booking });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/bookings/:id/reject
export const rejectBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const facility = await StorageFacility.findById(booking.facilityId);
    if (facility.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    booking.status = 'cancelled';
    await booking.save();

    await createNotification(
      booking.bookerId,
      'booking',
      `Storage booking at ${facility.name} was not confirmed`,
      booking._id
    );

    res.json({ message: 'Booking rejected', booking });
  } catch (error) {
    next(error);
  }
};

// GET /api/bookings
export const getBookings = async (req, res, next) => {
  try {
    let filter = {};

    if (req.user.role === 'storage_owner') {
      // Get bookings for owner's facilities
      const facilities = await StorageFacility.find({ ownerId: req.user._id }).select('_id');
      const facilityIds = facilities.map((f) => f._id);
      filter = { facilityId: { $in: facilityIds } };
    } else {
      filter = { bookerId: req.user._id };
    }

    const bookings = await Booking.find(filter)
      .populate('facilityId', 'name address pricePerTon totalCapacity')
      .populate('bookerId', 'name phone email')
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (error) {
    next(error);
  }
};
