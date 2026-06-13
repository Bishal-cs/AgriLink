import Rating from '../models/Rating.js';
import Order from '../models/Order.js';

// POST /api/ratings
export const createRating = async (req, res, next) => {
  try {
    const { orderId, rateeId, score, review } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check order belongs to rater
    const isParty =
      order.farmerId.toString() === req.user._id.toString() ||
      order.distributorId.toString() === req.user._id.toString();

    if (!isParty) {
      return res.status(403).json({ error: 'Not authorized to rate this order' });
    }

    // Check order is completed
    if (order.status !== 'completed') {
      return res.status(400).json({ error: 'Can only rate completed orders' });
    }

    const rating = await Rating.create({
      orderId,
      raterId: req.user._id,
      rateeId,
      score,
      review,
    });

    res.status(201).json({ message: 'Rating submitted', rating });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'You have already rated this order' });
    }
    next(error);
  }
};

// GET /api/ratings/user/:id — get ratings for a user
export const getUserRatings = async (req, res, next) => {
  try {
    const ratings = await Rating.find({ rateeId: req.params.id })
      .populate('raterId', 'name')
      .sort({ createdAt: -1 });

    const avgScore =
      ratings.length > 0
        ? Math.round((ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length) * 10) / 10
        : 0;

    res.json({ ratings, avgScore, totalRatings: ratings.length });
  } catch (error) {
    next(error);
  }
};
