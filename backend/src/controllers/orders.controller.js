import Order from '../models/Order.js';
import { createNotification } from '../services/notification.service.js';

// GET /api/orders
export const getOrders = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'farmer') {
      filter.farmerId = req.user._id;
    } else if (req.user.role === 'distributor') {
      filter.distributorId = req.user._id;
    }

    const orders = await Order.find(filter)
      .populate('listingId', 'cropType quantity unit imageUrls')
      .populate('farmerId', 'name phone isVerified')
      .populate('distributorId', 'name phone isVerified')
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/:id
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('listingId', 'cropType quantity unit expectedPrice imageUrls location')
      .populate('farmerId', 'name phone email isVerified address')
      .populate('distributorId', 'name phone email isVerified address')
      .populate('bookingId');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check ownership
    const isOwner =
      order.farmerId._id.toString() === req.user._id.toString() ||
      order.distributorId._id.toString() === req.user._id.toString() ||
      req.user.role === 'admin';

    if (!isOwner) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json({ order });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/orders/:id/status
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['pickup_scheduled', 'in_transit', 'delivered', 'completed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Only distributor or admin can update status
    if (order.distributorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    order.status = status;
    order.timeline.push({ status, note: note || `Status updated to ${status}` });
    await order.save();

    // Notify farmer
    const statusLabels = {
      pickup_scheduled: 'Pickup has been scheduled',
      in_transit: 'Your order is now in transit',
      delivered: 'Your order has been delivered',
      completed: 'Order completed. Please leave a review!',
    };

    await createNotification(
      order.farmerId,
      'order',
      statusLabels[status] || `Order status: ${status}`,
      order._id
    );

    if (status === 'completed') {
      await createNotification(
        order.distributorId,
        'order',
        'Order completed. Please leave a review!',
        order._id
      );
    }

    res.json({ message: 'Order status updated', order });
  } catch (error) {
    next(error);
  }
};
