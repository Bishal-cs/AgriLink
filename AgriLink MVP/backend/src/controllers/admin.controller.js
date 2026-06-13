import User from '../models/User.js';
import CropListing from '../models/CropListing.js';
import Order from '../models/Order.js';
import Offer from '../models/Offer.js';
import StorageFacility from '../models/StorageFacility.js';
import Booking from '../models/Booking.js';

// GET /api/admin/users
export const getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      users,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/users/:id/verify
export const verifyUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User verified', user });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/users/:id/suspend
export const suspendUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.isSuspended = !user.isSuspended;
    await user.save();

    res.json({
      message: user.isSuspended ? 'User suspended' : 'User unsuspended',
      user,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/analytics
export const getAnalytics = async (req, res, next) => {
  try {
    const [
      totalUsers,
      farmerCount,
      distributorCount,
      storageOwnerCount,
      activeListings,
      totalOrders,
      completedOrders,
      totalFacilities,
      totalBookings,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'farmer' }),
      User.countDocuments({ role: 'distributor' }),
      User.countDocuments({ role: 'storage_owner' }),
      CropListing.countDocuments({ status: 'active' }),
      Order.countDocuments(),
      Order.countDocuments({ status: 'completed' }),
      StorageFacility.countDocuments(),
      Booking.countDocuments(),
    ]);

    // Recent activity (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [newListingsThisWeek, newOrdersThisWeek, newUsersThisWeek] = await Promise.all([
      CropListing.countDocuments({ createdAt: { $gte: weekAgo } }),
      Order.countDocuments({ createdAt: { $gte: weekAgo } }),
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
    ]);

    res.json({
      users: { total: totalUsers, farmers: farmerCount, distributors: distributorCount, storageOwners: storageOwnerCount },
      listings: { active: activeListings },
      orders: { total: totalOrders, completed: completedOrders },
      storage: { facilities: totalFacilities, bookings: totalBookings },
      thisWeek: { newListings: newListingsThisWeek, newOrders: newOrdersThisWeek, newUsers: newUsersThisWeek },
    });
  } catch (error) {
    next(error);
  }
};
